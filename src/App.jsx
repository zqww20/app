import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Command, Bell, Sparkles } from "lucide-react";
import { C, MONO } from "./theme.js";
import Sidebar from "./components/Sidebar.jsx";
import Copilot from "./components/Copilot.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Entries from "./views/Entries.jsx";
import EntryDetail from "./views/EntryDetail.jsx";
import ClassifyIntake from "./views/ClassifyIntake.jsx";
import BrokerReview from "./views/BrokerReview.jsx";
import TariffLookup from "./views/TariffLookup.jsx";
import Clients from "./views/Clients.jsx";

function TopBar({ onOpenCopilot }) {
  const { pathname } = useLocation();
  const crumb =
    pathname === "/"
      ? "Dashboard"
      : pathname
          .split("/")
          .filter(Boolean)
          .map((s) => s.replace(/-/g, " "))
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join("  ›  ");

  return (
    <div
      className="flex items-center justify-between"
      style={{
        height: 54,
        flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
        background: "rgba(244,245,247,0.86)",
        backdropFilter: "blur(6px)",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: C.sub, letterSpacing: "0.04em" }}>{crumb}</span>
      </div>
      <div className="flex items-center" style={{ gap: 12 }}>
        <div
          className="flex items-center"
          style={{
            gap: 7,
            fontFamily: MONO,
            fontSize: 11,
            color: C.faint,
            border: `1px solid ${C.line}`,
            background: C.panel,
            borderRadius: 6,
            padding: "5px 9px",
          }}
        >
          <Command size={11} /> K · Search entries
        </div>
        <button
          style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 4 }}
          title="3 items need attention"
        >
          <Bell size={17} color={C.sub} />
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 7,
              height: 7,
              borderRadius: 999,
              background: C.stamp,
              border: `1.5px solid ${C.paper}`,
            }}
          />
        </button>
        <button
          onClick={onOpenCopilot}
          className="flex items-center"
          style={{
            gap: 7,
            fontFamily: MONO,
            fontSize: 11.5,
            color: "#fff",
            background: C.stamp,
            border: "none",
            borderRadius: 6,
            padding: "7px 12px",
            cursor: "pointer",
          }}
        >
          <Sparkles size={13} /> Ask Manifest
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [copilot, setCopilot] = useState(false);
  const openCopilot = () => setCopilot(true);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.paper }}>
      <Sidebar onOpenCopilot={openCopilot} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar onOpenCopilot={openCopilot} />
        <main style={{ flex: 1, padding: "26px 28px 56px", maxWidth: 1180, width: "100%", margin: "0 auto" }}>
          <Routes>
            <Route path="/" element={<Dashboard onOpenCopilot={openCopilot} />} />
            <Route path="/entries" element={<Entries />} />
            <Route path="/entries/:id" element={<EntryDetail onOpenCopilot={openCopilot} />} />
            <Route path="/classify" element={<ClassifyIntake />} />
            <Route path="/review" element={<BrokerReview />} />
            <Route path="/lookup" element={<TariffLookup />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<Clients />} />
          </Routes>
        </main>
      </div>
      <Copilot open={copilot} onClose={() => setCopilot(false)} />
    </div>
  );
}
