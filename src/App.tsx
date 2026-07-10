import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ArretesProvider } from "@/contexts/ArretesContext";
import { ReferencesProvider } from "@/contexts/ReferencesContext";
import AppShell from "@/components/layout/AppShell";
import AccueilPage from "@/pages/AccueilPage";
import ActifsPage from "@/pages/ActifsPage";
import CartePage from "@/pages/CartePage";
import HistoriquePage from "@/pages/HistoriquePage";
import NouveauArretePage from "@/pages/NouveauArretePage";
import ReferencesPage from "@/pages/ReferencesPage";
import "@/styles/global.css";
import "@/styles/leaflet-overrides.css";

export default function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AuthProvider>
          <ArretesProvider>
            <ReferencesProvider>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<AccueilPage />} />
                  <Route path="actifs" element={<ActifsPage />} />
                  <Route path="carte" element={<CartePage />} />
                  <Route path="historique" element={<HistoriquePage />} />
                  <Route path="nouveau" element={<NouveauArretePage />} />
                  <Route path="nouveau/:id" element={<NouveauArretePage />} />
                  <Route path="references" element={<ReferencesPage />} />
                </Route>
              </Routes>
            </ReferencesProvider>
          </ArretesProvider>
        </AuthProvider>
      </TenantProvider>
    </BrowserRouter>
  );
}
