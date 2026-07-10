import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function AppShell() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", color: "#1C1F1B", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
