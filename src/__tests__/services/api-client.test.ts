import { describe, it, expect, beforeEach } from "vitest";
import {
  ApiError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  setToken,
  setTenantId,
  clearAuth,
} from "@/services/api-client";

describe("api-client errors", () => {
  it("ApiError a le status et le body", () => {
    const err = new ApiError("test", 400, { detail: "bad" });
    expect(err.status).toBe(400);
    expect(err.body).toEqual({ detail: "bad" });
    expect(err.name).toBe("ApiError");
    expect(err.message).toBe("test");
  });

  it("ForbiddenError a le status 403", () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
    expect(err.name).toBe("ForbiddenError");
    expect(err.message).toBe("Accès interdit");
  });

  it("ForbiddenError accepte un message custom", () => {
    const err = new ForbiddenError("Pas autorise");
    expect(err.message).toBe("Pas autorise");
  });

  it("NotFoundError a le status 404", () => {
    const err = new NotFoundError();
    expect(err.status).toBe(404);
    expect(err.name).toBe("NotFoundError");
  });

  it("ServerError a le status 500", () => {
    const err = new ServerError();
    expect(err.status).toBe(500);
    expect(err.name).toBe("ServerError");
  });
});

describe("api-client storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("setToken stocke le token", () => {
    setToken("abc123");
    expect(localStorage.getItem("auth_token")).toBe("abc123");
  });

  it("setTenantId stocke le tenant", () => {
    setTenantId("tenant_x");
    expect(localStorage.getItem("tenant_id")).toBe("tenant_x");
  });

  it("clearAuth supprime token et tenant", () => {
    setToken("abc");
    setTenantId("tenant_x");
    clearAuth();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("tenant_id")).toBeNull();
  });
});
