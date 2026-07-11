import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import FeedbackWidget from "@/components/common/FeedbackWidget";
import AppTour from "@/components/common/AppTour";

export default function AppShell() {
  const [tourOuvert, setTourOuvert] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("tour_complete");
    if (!done) setTourOuvert(true);
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      if (e instanceof CustomEvent) setTourOuvert(true);
    }
    window.addEventListener("open-tour", handler);
    return () => window.removeEventListener("open-tour", handler);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", color: "#1C1F1B", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <a href="#contenu-principal" className="skip-link">Aller au contenu principal</a>
      <Header />
      <main id="contenu-principal" role="main">
        <Outlet />
      </main>
      <FeedbackWidget />
      {tourOuvert && <AppTour onClose={() => setTourOuvert(false)} />}
    </div>
  );
}
