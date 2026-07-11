import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import RouteProtegee from "@/components/auth/RouteProtegee";

function renderProtected(initialPath: string, roles?: string[]) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<RouteProtegee roles={roles as import("@/types").Role[]} />}>
              <Route path="/protegee" element={<div>Contenu protege</div>} />
              <Route path="/admin-only" element={<div>Admin only</div>} />
            </Route>
            <Route path="/login" element={<div>Page de connexion</div>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("RouteProtegee", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirige vers /login si non authentifie", () => {
    renderProtected("/protegee");
    expect(screen.getByText("Page de connexion")).toBeDefined();
  });

  it("affiche le contenu si authentifie sans restriction de role", () => {
    localStorage.setItem(
      "arretes_auth_user",
      JSON.stringify({
        id: "u_admin",
        nom: "Admin",
        email: "admin@saint-avoye.fr",
        role: "admin",
        tenant_id: "tenant_saint_avoye",
      }),
    );
    renderProtected("/protegee");
    expect(screen.getByText("Contenu protege")).toBeDefined();
  });

  it("affiche 'Acces non autorise' si le role ne correspond pas", () => {
    localStorage.setItem(
      "arretes_auth_user",
      JSON.stringify({
        id: "u_lecteur",
        nom: "Lecteur",
        email: "lecteur@saint-avoye.fr",
        role: "lecteur",
        tenant_id: "tenant_saint_avoye",
      }),
    );
    renderProtected("/admin-only", ["admin"]);
    expect(screen.getByText("Acces non autorise")).toBeDefined();
  });

  it("autorise l'acces si le role est dans la liste", () => {
    localStorage.setItem(
      "arretes_auth_user",
      JSON.stringify({
        id: "u_admin",
        nom: "Admin",
        email: "admin@saint-avoye.fr",
        role: "admin",
        tenant_id: "tenant_saint_avoye",
      }),
    );
    renderProtected("/admin-only", ["admin"]);
    expect(screen.getByText("Admin only")).toBeDefined();
  });
});
