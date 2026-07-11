import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ArretesProvider } from "@/contexts/ArretesContext";
import { ReferencesProvider } from "@/contexts/ReferencesContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { AuditProvider } from "@/contexts/AuditContext";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

interface RenderOptions {
  route?: string;
  role?: "admin" | "redacteur" | "lecteur";
}

const USERS_PAR_ROLE = {
  admin: { id: "u_admin", nom: "Admin SaaS", email: "admin@saint-avoye.fr", role: "admin", tenant_id: "tenant_saint_avoye" },
  redacteur: { id: "u_redacteur", nom: "M. Lefèvre", email: "redacteur@saint-avoye.fr", role: "redacteur", tenant_id: "tenant_saint_avoye" },
  lecteur: { id: "u_lecteur", nom: "M. Dupont", email: "lecteur@saint-avoye.fr", role: "lecteur", tenant_id: "tenant_saint_avoye" },
} as const;

export function renderWithProviders(
  ui: ReactNode,
  { route = "/", role = "admin" }: RenderOptions = {},
) {
  localStorage.setItem("arretes_auth_user", JSON.stringify(USERS_PAR_ROLE[role]));

  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <TenantProvider>
          <AuthProvider>
            <ArretesProvider>
              <ReferencesProvider>
                <NotificationsProvider>
                  <AuditProvider>
                    {ui}
                  </AuditProvider>
                </NotificationsProvider>
              </ReferencesProvider>
            </ArretesProvider>
          </AuthProvider>
        </TenantProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}
