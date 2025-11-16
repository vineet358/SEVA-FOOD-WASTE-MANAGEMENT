// Entry point for SEWA frontend (small update for readability)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Safeguard: Ensure root element exists before rendering
const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found!");
}
