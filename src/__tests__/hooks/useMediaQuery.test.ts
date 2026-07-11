import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

describe("useMediaQuery", () => {
  let listeners: Array<(e: MediaQueryListEvent) => void>;
  let matchesMock: boolean;

  beforeEach(() => {
    listeners = [];
    matchesMock = false;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: matchesMock,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
          listeners.push(cb);
        },
        removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
          listeners = listeners.filter((l) => l !== cb);
        },
        dispatchEvent: () => false,
      }),
    });
  });

  it("retourne false quand la query ne correspond pas", () => {
    matchesMock = false;
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("retourne true quand la query correspond", () => {
    matchesMock = true;
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("reagit aux changements de media query", () => {
    matchesMock = false;
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => {
      for (const cb of listeners) {
        cb({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });

  it("nettoie le listener au demontage", () => {
    matchesMock = false;
    const { unmount } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(listeners.length).toBeGreaterThan(0);
    unmount();
    expect(listeners.length).toBe(0);
  });
});
