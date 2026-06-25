import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { C } from "./theme.js";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import Assistant from "./components/Assistant.jsx";
import Worklist from "./views/Worklist.jsx";
import Shipments from "./views/Shipments.jsx";
import ShipmentFile from "./views/ShipmentFile.jsx";
import Importers from "./views/Importers.jsx";
import ImporterFile from "./views/ImporterFile.jsx";
import ReferenceData from "./views/ReferenceData.jsx";
import AuditLog from "./views/AuditLog.jsx";

export default function App() {
  const [assistant, setAssistant] = useState(false);
  const { pathname } = useLocation();
  const m = pathname.match(/^\/shipments\/([^/]+)/);
  const activeShipmentId = m ? m[1] : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.paper }}>
      <Sidebar onOpenAssistant={() => setAssistant(true)} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar onOpenAssistant={() => setAssistant(true)} />
        <main style={{ flex: 1, padding: "24px 26px 56px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
          <Routes>
            <Route path="/" element={<Worklist onOpenAssistant={() => setAssistant(true)} />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/shipments/:id" element={<ShipmentFile onOpenAssistant={() => setAssistant(true)} />} />
            <Route path="/importers" element={<Importers />} />
            <Route path="/importers/:id" element={<ImporterFile />} />
            <Route path="/reference" element={<ReferenceData />} />
            <Route path="/audit" element={<AuditLog />} />
          </Routes>
        </main>
      </div>
      <Assistant open={assistant} onClose={() => setAssistant(false)} shipmentId={activeShipmentId} />
    </div>
  );
}
