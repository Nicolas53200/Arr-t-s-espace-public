import { describe, it, expect } from "vitest";
import {
  hasPermission,
  canCreateArrete,
  canEditArrete,
  canAbrogerArrete,
  canManageReferences,
} from "@/lib/permissions";

describe("hasPermission", () => {
  it("admin a toutes les permissions", () => {
    expect(hasPermission("admin", "arrete:create")).toBe(true);
    expect(hasPermission("admin", "settings:manage")).toBe(true);
    expect(hasPermission("admin", "users:manage")).toBe(true);
  });

  it("redacteur peut créer et modifier des arrêtés", () => {
    expect(hasPermission("redacteur", "arrete:create")).toBe(true);
    expect(hasPermission("redacteur", "arrete:edit")).toBe(true);
    expect(hasPermission("redacteur", "arrete:abrogate")).toBe(true);
  });

  it("redacteur ne peut pas gérer les utilisateurs", () => {
    expect(hasPermission("redacteur", "users:manage")).toBe(false);
    expect(hasPermission("redacteur", "settings:manage")).toBe(false);
  });

  it("lecteur ne peut que consulter", () => {
    expect(hasPermission("lecteur", "arrete:view")).toBe(true);
    expect(hasPermission("lecteur", "arrete:create")).toBe(false);
    expect(hasPermission("lecteur", "arrete:edit")).toBe(false);
  });
});

describe("raccourcis RBAC", () => {
  it("canCreateArrete respecte les rôles", () => {
    expect(canCreateArrete("admin")).toBe(true);
    expect(canCreateArrete("redacteur")).toBe(true);
    expect(canCreateArrete("lecteur")).toBe(false);
  });

  it("canEditArrete respecte les rôles", () => {
    expect(canEditArrete("admin")).toBe(true);
    expect(canEditArrete("lecteur")).toBe(false);
  });

  it("canAbrogerArrete respecte les rôles", () => {
    expect(canAbrogerArrete("redacteur")).toBe(true);
    expect(canAbrogerArrete("lecteur")).toBe(false);
  });

  it("canManageReferences est réservé aux admins", () => {
    expect(canManageReferences("admin")).toBe(true);
    expect(canManageReferences("redacteur")).toBe(false);
    expect(canManageReferences("lecteur")).toBe(false);
  });
});
