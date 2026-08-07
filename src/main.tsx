import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initialiserDonneesDemoSiVide } from "@/lib/seed-demo";
import App from "./App";

// Injecte les données de démo au tout premier lancement (localStorage vide)
initialiserDonneesDemoSiVide();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
