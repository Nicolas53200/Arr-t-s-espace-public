import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ArretesProvider } from "@/contexts/ArretesContext";
import { ReferencesProvider } from "@/contexts/ReferencesContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { AuditProvider } from "@/contexts/AuditContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/common/ToastContainer";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import RouteProtegee from "@/components/auth/RouteProtegee";
import AppShell from "@/components/layout/AppShell";
import LandingPage from "@/pages/LandingPage";
import SuperAdminPage from "@/pages/SuperAdminPage";
import LoginPage from "@/pages/LoginPage";
import AccueilPage from "@/pages/AccueilPage";
import ActifsPage from "@/pages/ActifsPage";
import CartePage from "@/pages/CartePage";
import HistoriquePage from "@/pages/HistoriquePage";
import NouveauArretePage from "@/pages/NouveauArretePage";
import ReferencesPage from "@/pages/ReferencesPage";
import ValidationPage from "@/pages/ValidationPage";
import NotificationsPage from "@/pages/NotificationsPage";
import TableauBordPage from "@/pages/TableauBordPage";
import JournalPage from "@/pages/JournalPage";
import AdminPage from "@/pages/AdminPage";
import NotFoundPage from "@/pages/NotFoundPage";
import "@/styles/global.css";
import "leaflet/dist/leaflet.css";
import "@/styles/leaflet-overrides.css";

function SectionFallback({ section }: { section: string }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "#6B6A60", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#1C1F1B", margin: "0 0 8px" }}>
        Erreur dans {section}
      </p>
      <p style={{ fontSize: 13, margin: "0 0 16px" }}>
        Cette section a rencontre un probleme. Les autres fonctionnalites restent disponibles.
      </p>
      <button className="btn-secondary" onClick={() => window.location.reload()} style={{ fontSize: 12 }}>
        Recharger la page
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <TenantProvider>
          <AuthProvider>
            <ArretesProvider>
              <ReferencesProvider>
                <NotificationsProvider>
                  <AuditProvider>
                    <ErrorBoundary>
                      <Routes>
                        {/* Public routes */}
                        <Route path="bienvenue" element={<LandingPage />} />
                        <Route path="super-admin" element={<SuperAdminPage />} />
                        <Route path="login" element={<LoginPage />} />

                        {/* Protected routes */}
                        <Route element={<RouteProtegee />}>
                          <Route element={<AppShell />}>
                            <Route index element={<AccueilPage />} />
                            <Route path="actifs" element={<ActifsPage />} />
                            <Route path="carte" element={<ErrorBoundary fallback={<SectionFallback section="Cartographie" />}><CartePage /></ErrorBoundary>} />
                            <Route path="historique" element={<HistoriquePage />} />
                            <Route path="nouveau" element={<ErrorBoundary fallback={<SectionFallback section="Formulaire" />}><NouveauArretePage /></ErrorBoundary>} />
                            <Route path="nouveau/:id" element={<ErrorBoundary fallback={<SectionFallback section="Formulaire" />}><NouveauArretePage /></ErrorBoundary>} />
                            <Route path="validation" element={<ValidationPage />} />
                            <Route path="references" element={<ReferencesPage />} />
                            <Route path="tableau-de-bord" element={<ErrorBoundary fallback={<SectionFallback section="Tableau de bord" />}><TableauBordPage /></ErrorBoundary>} />
                            <Route path="notifications" element={<NotificationsPage />} />
                            <Route path="journal" element={<JournalPage />} />
                          </Route>
                        </Route>

                        {/* Admin-only route */}
                        <Route element={<RouteProtegee roles={["admin"]} />}>
                          <Route element={<AppShell />}>
                            <Route path="admin" element={<AdminPage />} />
                          </Route>
                        </Route>

                        {/* 404 */}
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </ErrorBoundary>
                    <ToastContainer />
                  </AuditProvider>
                </NotificationsProvider>
              </ReferencesProvider>
            </ArretesProvider>
          </AuthProvider>
        </TenantProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
