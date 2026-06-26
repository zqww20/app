import React, { createContext, useContext, useRef, useState, useMemo, useCallback } from "react";
import { load, save, resetWorkspace } from "./db.js";
import { availableTransitions, transitionByTarget, canPerform } from "../domain/stateMachine.js";
import { AUDIT, CLS_STATUS } from "../domain/constants.js";
import { uid, shipmentNo } from "../domain/ids.js";
import { useSession } from "../auth/SessionContext.jsx";
import { transmitRelease, submitCad } from "../adapters/carm.js";

/* ------------------------------------------------------------------ */
/*  The workspace store. Holds the single canonical document and        */
/*  exposes mutations that each append to the immutable audit log with   */
/*  the acting user. Filing actions (release, CAD) run through the CARM   */
/*  adapter and only after a sign-off check.                             */
/* ------------------------------------------------------------------ */

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { currentUser } = useSession();
  const [doc, setDoc] = useState(() => {
    const d = load();
    if (!d.precedents) d.precedents = [];
    return d;
  });
  const docRef = useRef(doc);
  docRef.current = doc;
  const userRef = useRef(currentUser);
  userRef.current = currentUser;

  /* immutable update + persist */
  const update = useCallback((mutator) => {
    setDoc((prev) => {
      const draft = structuredClone(prev);
      mutator(draft);
      save(draft);
      return draft;
    });
  }, []);

  const makeEvent = (fields) => {
    const u = userRef.current;
    return {
      id: uid("evt"),
      ts: Date.now(),
      actor: u?.id || "unknown",
      actorName: u?.name || "Unknown",
      roles: u?.roles || [],
      signoff: !!fields.signoff,
      ...fields,
    };
  };
  const logTo = (draft, fields) => {
    draft.audit.unshift(makeEvent(fields)); // newest first; never edited/removed
  };

  /* --- selectors ----------------------------------------------------- */
  const getShipment = useCallback((id) => docRef.current.shipments.find((s) => s.id === id) || null, []);
  const getImporter = useCallback((id) => docRef.current.importers.find((i) => i.id === id) || null, []);
  const importerOf = useCallback((shp) => (shp ? getImporter(shp.importerId) : null), [getImporter]);

  const ctxFor = useCallback(
    (shipmentId) => {
      const shipment = docRef.current.shipments.find((s) => s.id === shipmentId);
      const importer = shipment ? docRef.current.importers.find((i) => i.id === shipment.importerId) : null;
      return { shipment, importer };
    },
    []
  );

  /* --- mutations ----------------------------------------------------- */

  const createShipment = useCallback(
    (input) => {
      const id = uid("shp");
      update((draft) => {
        const n = (draft.counters.shipment || 150) + 1;
        draft.counters.shipment = n;
        const shp = {
          id,
          no: shipmentNo(n),
          importerId: input.importerId,
          supplier: input.supplier || "",
          exporter: input.exporter || "",
          originCountry: input.originCountry || "",
          shipTo: input.shipTo || "",
          mode: input.mode || "Truck",
          port: input.port || "",
          incoterm: input.incoterm || "",
          etaDate: input.etaDate || "",
          createdAt: Date.now(),
          state: "awaiting_documents",
          assigned: input.assigned || null,
          documents: [],
          intake: { headerConfirmed: false, linesConfirmed: false },
          valuation: {},
          assessment: {},
          release: {},
          accounting: {},
          billing: {},
          lines: [],
        };
        draft.shipments.unshift(shp);
        logTo(draft, { action: AUDIT.shipment_created, entity: "shipment", entityId: id, field: "shipment", prior: null, next: shp.no, reason: input.reason || "Shipment file opened." });
      });
      return id;
    },
    [update]
  );

  const addDocument = useCallback(
    (shipmentId, docInput) => {
      update((draft) => {
        const shp = draft.shipments.find((s) => s.id === shipmentId);
        if (!shp) return;
        const d = { id: uid("doc"), version: 1, addedAt: Date.now(), ...docInput };
        shp.documents.push(d);
        if (shp.state === "awaiting_documents") shp.state = "in_intake";
        logTo(draft, { action: AUDIT.document_added, entity: "shipment", entityId: shipmentId, field: "document", prior: null, next: `${docInput.type}: ${docInput.name}`, reason: "Document received and retained (6-year clock started)." });
      });
    },
    [update]
  );

  const setLines = useCallback(
    (shipmentId, lines, meta = {}) => {
      update((draft) => {
        const shp = draft.shipments.find((s) => s.id === shipmentId);
        if (!shp) return;
        shp.lines = lines.map((l) => ({ id: l.id || uid("ln"), ...l }));
        shp.intake = { ...shp.intake, extracted: true, headerConfirmed: false, linesConfirmed: false };
        if (shp.state === "awaiting_documents") shp.state = "in_intake";
        logTo(draft, { action: AUDIT.extraction_run, entity: "shipment", entityId: shipmentId, field: "lines", prior: null, next: `${lines.length} line items`, reason: meta.mode === "model" ? "Lines extracted from document by model (pending clerk confirmation)." : "Lines entered for review." });
      });
    },
    [update]
  );

  const confirmIntake = useCallback(
    (shipmentId) => {
      update((draft) => {
        const shp = draft.shipments.find((s) => s.id === shipmentId);
        if (!shp) return;
        shp.intake = { ...shp.intake, headerConfirmed: true, linesConfirmed: true, confirmedBy: userRef.current?.id, confirmedAt: Date.now() };
        logTo(draft, { action: AUDIT.intake_confirmed, entity: "shipment", entityId: shipmentId, field: "intake", prior: "extracted", next: "confirmed", reason: `Header and ${shp.lines.length} line${shp.lines.length === 1 ? "" : "s"} verified against the source documents.` });
      });
    },
    [update]
  );

  const decideClassification = useCallback(
    (shipmentId, lineId, decision) => {
      update((draft) => {
        const shp = draft.shipments.find((s) => s.id === shipmentId);
        const line = shp?.lines.find((l) => l.id === lineId);
        if (!line) return;
        const prior = line.classification?.hs || "proposed";
        line.classification = {
          status: decision.status, // accepted | edited | rejected
          hs: decision.hs,
          heading: decision.heading,
          gri: decision.gri,
          treatmentKey: decision.treatmentKey,
          treatmentCode: decision.treatmentCode,
          confidence: decision.confidence,
          decidedBy: userRef.current?.id,
          decidedByName: userRef.current?.name,
          decidedAt: Date.now(),
          reason: decision.reason || null,
        };
        logTo(draft, { action: AUDIT.line_classified, entity: "line", entityId: `${shipmentId}/${lineId}`, field: decision.hs, prior, next: decision.status, reason: decision.reason || (decision.status === "accepted" ? "Accepted AI proposal." : decision.status === "edited" ? "Code edited by specialist." : "Sent back for manual classification.") });
        // write to precedent library on a committed code
        if ((decision.status === "accepted" || decision.status === "edited") && decision.hs && decision.hs !== "—") {
          draft.precedents.unshift({ id: uid("prec"), importerId: shp.importerId, description: line.description, hs: decision.hs, heading: decision.heading, decidedBy: userRef.current?.id, decidedByName: userRef.current?.name, decidedAt: Date.now() });
        }
      });
    },
    [update]
  );

  const setValuationMethod = useCallback(
    (shipmentId, method) => {
      update((draft) => {
        const shp = draft.shipments.find((s) => s.id === shipmentId);
        if (!shp) return;
        const prior = shp.valuation?.method || null;
        shp.valuation = { ...shp.valuation, method, reviewedBy: userRef.current?.id };
        logTo(draft, { action: AUDIT.note, entity: "shipment", entityId: shipmentId, field: "valuation.method", prior, next: method, reason: "Value-for-duty method recorded." });
      });
    },
    [update]
  );

  const reviewAssessment = useCallback(
    (shipmentId) => {
      update((draft) => {
        const shp = draft.shipments.find((s) => s.id === shipmentId);
        if (!shp) return;
        shp.assessment = { ...shp.assessment, reviewed: true, reviewedBy: userRef.current?.id, reviewedAt: Date.now() };
        logTo(draft, { action: AUDIT.note, entity: "shipment", entityId: shipmentId, field: "assessment", prior: "unreviewed", next: "reviewed", reason: "Duty/tax/SIMA/OGD assessment reviewed by advisor." });
      });
    },
    [update]
  );

  const assembleCad = useCallback(
    (shipmentId) => {
      update((draft) => {
        const shp = draft.shipments.find((s) => s.id === shipmentId);
        if (!shp) return;
        shp.accounting = { ...shp.accounting, assembled: true };
        logTo(draft, { action: AUDIT.note, entity: "shipment", entityId: shipmentId, field: "accounting", prior: null, next: "assembled", reason: "CAD assembled from the released file for review." });
      });
    },
    [update]
  );

  const addNote = useCallback(
    (shipmentId, text) => {
      update((draft) => {
        logTo(draft, { action: AUDIT.note, entity: "shipment", entityId: shipmentId, field: "note", prior: null, next: text, reason: text });
      });
    },
    [update]
  );

  const assignShipment = useCallback(
    (shipmentId, userId) => {
      update((draft) => {
        const shp = draft.shipments.find((s) => s.id === shipmentId);
        if (!shp || shp.assigned === userId) return;
        const prior = shp.assigned;
        const priorName = draft.users.find((u) => u.id === prior)?.name || "Unassigned";
        const name = draft.users.find((u) => u.id === userId)?.name || "Unassigned";
        shp.assigned = userId || null;
        logTo(draft, { action: AUDIT.assigned, entity: "shipment", entityId: shipmentId, field: "assigned", prior: priorName, next: userId ? name : "Unassigned", reason: userId ? `File handed off to ${name}.` : "File unassigned." });
      });
    },
    [update]
  );

  /* The guarded transition. Returns {ok, blockers, reason}.            */
  const transition = useCallback(
    async (shipmentId, target, opts = {}) => {
      const ctx = ctxFor(shipmentId);
      if (!ctx.shipment) return { ok: false, reason: "Shipment not found." };
      const t = transitionByTarget(ctx, target);
      if (!t) return { ok: false, reason: "That transition isn't available from the current state." };

      // sign-off check
      const perm = canPerform(t, { hasSignoff: !!userRef.current?.signoff });
      if (!perm.ok) return { ok: false, reason: perm.reason };

      // completeness guard
      if (t.blocked && !(t.allowOverride && opts.override)) {
        return { ok: false, blockers: t.blockers };
      }
      if (t.requireReason && !opts.reason) {
        return { ok: false, reason: "A reason is required for this action." };
      }

      // side effects on filing transitions (adapter calls happen here)
      let ack = null;
      if (target === "released") ack = await transmitRelease({ stream: ctx.shipment.release?.stream || "RMD", shipmentNo: ctx.shipment.no });
      if (target === "accounted" && ctx.shipment.state === "in_accounting") ack = await submitCad({ shipmentNo: ctx.shipment.no, revision: 0 });

      const prior = ctx.shipment.state;
      update((draft) => {
        const shp = draft.shipments.find((s) => s.id === shipmentId);
        if (!shp) return;
        shp.state = target;
        if (target === "released" && ack) shp.release = { ...shp.release, transmitted: true, cbsaRef: ack.cbsaRef, transmittedAt: ack.transmittedAt, signedBy: userRef.current?.id, stub: ack.stub };
        if (target === "accounted" && ack) shp.accounting = { ...shp.accounting, cadRef: ack.cadRef, submittedAt: ack.submittedAt, signedBy: userRef.current?.id, stub: ack.stub };
        const action =
          target === "released" ? AUDIT.release_transmitted : target === "accounted" ? AUDIT.cad_submitted : AUDIT.state_changed;
        logTo(draft, {
          action,
          entity: "shipment",
          entityId: shipmentId,
          field: "state",
          prior,
          next: target,
          reason: opts.reason || (opts.override ? `Advanced with explicit override of completeness checks.` : t.label),
          signoff: !!t.requiresSignoff,
          override: !!opts.override,
          ack: ack ? ack.cbsaRef || ack.cadRef : undefined,
        });
      });
      return { ok: true, ack };
    },
    [ctxFor, update]
  );

  const resetAll = useCallback(() => {
    const seed = resetWorkspace();
    if (!seed.precedents) seed.precedents = [];
    setDoc(seed);
  }, []);

  const value = useMemo(
    () => ({
      doc,
      shipments: doc.shipments,
      importers: doc.importers,
      audit: doc.audit,
      precedents: doc.precedents || [],
      users: doc.users,
      getShipment,
      getImporter,
      importerOf,
      ctxFor,
      availableTransitionsFor: (shipmentId) => availableTransitions(ctxFor(shipmentId)),
      createShipment,
      addDocument,
      setLines,
      confirmIntake,
      decideClassification,
      setValuationMethod,
      reviewAssessment,
      assembleCad,
      addNote,
      assignShipment,
      transition,
      resetAll,
    }),
    [doc, getShipment, getImporter, importerOf, ctxFor, createShipment, addDocument, setLines, confirmIntake, decideClassification, setValuationMethod, reviewAssessment, assembleCad, addNote, assignShipment, transition, resetAll]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
