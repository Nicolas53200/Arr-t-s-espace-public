import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import LoginPage from "@/pages/LoginPage";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <ToastProvider>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le formulaire de connexion", () => {
    renderLogin();
    expect(screen.getByLabelText("Adresse e-mail")).toBeDefined();
    expect(screen.getByLabelText("Mot de passe")).toBeDefined();
    expect(screen.getByText("Se connecter")).toBeDefined();
  });

  it("affiche les comptes de demonstration", () => {
    renderLogin();
    expect(screen.getByText("Comptes de demonstration")).toBeDefined();
    expect(screen.getByText("admin@saint-avoye.fr / admin123")).toBeDefined();
  });

  it("a les champs email et password requis", () => {
    renderLogin();
    const email = screen.getByLabelText("Adresse e-mail") as HTMLInputElement;
    const pwd = screen.getByLabelText("Mot de passe") as HTMLInputElement;
    expect(email.required).toBe(true);
    expect(pwd.required).toBe(true);
    expect(email.type).toBe("email");
    expect(pwd.type).toBe("password");
  });

  it("a l'autocomplete configure", () => {
    renderLogin();
    const email = screen.getByLabelText("Adresse e-mail") as HTMLInputElement;
    const pwd = screen.getByLabelText("Mot de passe") as HTMLInputElement;
    expect(email.autocomplete).toBe("email");
    expect(pwd.autocomplete).toBe("current-password");
  });
});
