import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { SessionProvider } from "./auth/SessionContext.jsx";
import { StoreProvider } from "./store/StoreContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </SessionProvider>
    </BrowserRouter>
  </React.StrictMode>
);
