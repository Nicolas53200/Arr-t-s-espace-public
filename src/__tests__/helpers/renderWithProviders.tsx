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
import { ajouterCollectivite, reinitialiser } from "@/lib/registre";

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

export function renderWithProviders(
  ui: ReactNode,
  { route = "/", role = "admin" }: RenderOptions = {},
) {
  reinitialiser();
  const collectivite = ajouterCollectivite({
    nom: "Ville de Saint-Avoye",
    code_postal: "56000",
    siren: "215600001",
    email_admin: "admin@saint-avoye.fr",
  });

  const USERS_PAR_ROLE = {
    admin: { id: `u_${collectivite.id}`, nom: "Admin SaaS", email: "admin@saint-avoye.fr", role: "admin", tenant_id: collectivite.id },
    redacteur: { id: "u_redacteur", nom: "M. Lefèvre", email: "redacteur@saint-avoye.fr", role: "redacteur", tenant_id: collectivite.id },
    lecteur: { id: "u_lecteur", nom: "M. Dupont", email: "lecteur@saint-avoye.fr", role: "lecteur", tenant_id: collectivite.id },
  } as const;

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
