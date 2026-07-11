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
                            <Route path="carte" element={<CartePage />} />
                            <Route path="historique" element={<HistoriquePage />} />
                            <Route path="nouveau" element={<NouveauArretePage />} />
                            <Route path="nouveau/:id" element={<NouveauArretePage />} />
                            <Route path="validation" element={<ValidationPage />} />
                            <Route path="references" element={<ReferencesPage />} />
                            <Route path="tableau-de-bord" element={<TableauBordPage />} />
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
