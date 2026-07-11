import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function AppShell() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", color: "#1C1F1B", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <a href="#contenu-principal" className="skip-link">Aller au contenu principal</a>
      <Header />
      <main id="contenu-principal" role="main">
        <Outlet />
      </main>
    </div>
  );
}
