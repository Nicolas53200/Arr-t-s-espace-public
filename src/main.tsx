import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { enregistrerServiceWorker } from "@/lib/offline";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Enregistrement du Service Worker (production uniquement)
if (import.meta.env.PROD) {
  enregistrerServiceWorker().then((etat) => {
    if (etat.enregistre) {
      console.log("[Actes360] Service Worker enregistré");
    }
  });
}
