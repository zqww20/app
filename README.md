# Customs brokerage operations workspace

An internal web application for a licensed Canadian customs brokerage. The users
are the brokerage's own operations staff. It carries a shipment from importer
onboarding through release, accounting, and post-entry compliance, with an
embedded AI assistant that drafts the heavy, regulation-heavy steps — and a
licensed broker who stays accountable for everything filed with CBSA.

This is internal tooling, not a product: no branding, marketing, sign-up,
pricing, or multi-tenant machinery. The interface serves legibility and speed of
work.

> **Prototype scope.** Document extraction is real (the model reads an uploaded
> invoice). Classification, valuation and assessment values come from a
> deterministic engine grounded in **editable reference data**, clearly labelled
> as proposed/illustrative — not customs advice. CARM/CBSA transmission runs
> through **stubbed adapters**; nothing is sent to a government system. Every
> regulatory value shown must be reconciled against the live CBSA sources.

## Operating principles (built in, not just documented)

- **The broker is accountable; the tool assists.** The assistant proposes,
  drafts, flags and computes. Release transmission, CAD submission/corrections,
  and post-entry filings **cannot complete without sign-off authority** — an
  explicit per-user permission, not a job title. The system never auto-transmits.
- **Auditability is first-class.** Every material action appends to an
  immutable, queryable log: who, what, when, prior value → new value, and reason.
  See `/audit`.
- **No hardcoded regulation.** Tariff treatments, duty/tax rates, exchange rates,
  OGD/SIMA rules, and CARM timeframes are versioned, effective-dated reference
  data (`/reference`). Engines resolve through it; a CBSA change is a data edit.
- **Fail loudly and specifically.** Stage gates list exactly what's missing in
  operational language and block until it's resolved (or explicitly overridden,
  with a logged reason). Silent defaults are prohibited on anything that affects
  a declaration.

## The workflow spine

Navigation is the shipment lifecycle. Each file is one canonical record moving
through an explicit state machine:

```
Importer file → Intake → Classification → Valuation → Assessment
→ Release → Accounting (CARM CAD) → Billing → Post-entry → Archive
```

States permit controlled backward / out-of-band transitions (reopen
classification after a release query; open a correction years post-archive) —
each logged with a reason. The current state determines which actions are
available and which are blocked.

### Phase 1 — what's built

This is the **spine, end to end**, so a file can travel the whole path:

- **Worklist** (`/`) — role-tuned home; exceptions first (awaiting sign-off,
  blocked work, lapsing authorities/security, SIMA exposure), plus your queue
  and recent activity.
- **Shipments** (`/shipments`) — the pipeline; open a new file from an invoice.
- **Shipment file** (`/shipments/:id`) — the hub. Stage rail + a single action
  bar driven by the state machine, with stations:
  - **Intake** — documents (6-year retention), **real AI extraction** of line
    items with the source field quoted, and the human confirmation checkpoint.
  - **Classification** — per-line AI proposal (HS to 10 digits, GRI path,
    grounded treatment & duty, confidence + the deciding-spec reason when low),
    SIMA/OGD flags, the importer **precedent library**, and accept / edit /
    reject. Committing writes to the precedent library.
  - **Valuation** — record the value-for-duty method.
  - **Assessment** — duty / GST / SIMA / OGD computed from reference data with
    each component's source cited; advisor review.
  - **Release** — completeness validation against the stream + the broker
    **sign-off gate** (transmits via the CARM adapter).
  - **Accounting / Billing / Post-entry** — CAD assembly + sign-off submit,
    client invoice, corrections — functional and shallow; deepened in later
    phases.
- **Importers** (`/importers`) — master records with the **release-readiness
  checkpoints** (valid agency authority + active RPP security + CARM delegation)
  and the precedent library.
- **Reference data** (`/reference`) — the versioned, effective-dated datasets.
- **Audit log** (`/audit`) — the append-only record, filterable and searchable.
- **Assistant** — scoped to the open file; explains a classification, screens
  SIMA/OGD, checks what's blocking, summarises value. It cites what it used and
  never files.

Later phases deepen the risk stages (full classification & valuation
workspaces), assessment and the release board, CARM accounting and billing, then
post-entry, compliance and analytics. The audit trail, sign-off gates and the
"assist, don't file" contract are load-bearing from phase one.

## Roles & sign-off

Use the **role switcher** (top right) to act as different staff: release clerk,
classification specialist, compliance advisor, accounting, operations manager,
and the licensed broker who holds **sign-off authority**. Switch to a non-broker
and the release/CAD actions are visibly gated; switch to the broker to file.
(The default user is the broker so you can walk the whole flow.)

## Architecture

```
src/
  domain/        constants (roles, states, doc types), state machine + guards, ids
  reference/     versioned reference data + resolvers (tariff, rates, FX, SIMA, OGD, CARM)
  adapters/      extraction (real model), carm / singleWindow / fx (stubbed)
  store/         localStorage persistence, seed, StoreContext (mutations + audit)
  auth/          SessionContext (current user / role), permissions
  lib/           classify (grounded engine), shipment rollups, formatters
  components/    ui primitives, shell (Sidebar/TopBar/Assistant), TransitionBar,
                 StageRail, AuditTrail, LineClassification, stations/*
  views/         Worklist, Shipments, ShipmentFile, Importers, ImporterFile,
                 ReferenceData, AuditLog
```

Persistence is a frontend store over `localStorage` behind a `load()/save()`
seam; CARM/Single-Window/FX sit behind clean adapter interfaces. A real backend
and live connectors drop in behind the same seams. State seeds on first load;
clear `localStorage` (key `cbsa_workspace_v3`) to reset.

Stack: **Vite + React 18 + React Router + Tailwind CSS + lucide-react**.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the build
```

## Regulatory note

CBSA, CARM, SIMA and OGD requirements are time-sensitive. The reference data was
seeded against public CBSA sources at build time (e.g. the CAD replaced the
legacy B3/B2 forms under CARM in Oct 2024) but is illustrative and must be
verified against current CBSA publications before any real use. Mandatory human
sign-off points are enforced in the build, not just described here.
