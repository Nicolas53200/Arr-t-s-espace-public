import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "@/contexts/ToastContext";
import ToastContainer from "@/components/common/ToastContainer";

function TestTrigger() {
  const toast = useToast();
  return <button onClick={() => toast.success("Operation reussie")}>Declencher</button>;
}

describe("ToastContainer", () => {
  it("affiche un toast apres declenchement", () => {
    render(
      <ToastProvider>
        <TestTrigger />
        <ToastContainer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("Declencher").click();
    });

    expect(screen.getByText("Operation reussie")).toBeDefined();
  });
});
