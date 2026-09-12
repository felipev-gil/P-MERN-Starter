import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import { ProtectedRoute } from "./ProtectedRoute";
afterEach(cleanup);
function setup(value) {
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/login" element={<p>Sign in form</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<p>Private content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}
it("does not reveal private content while checking or signed out", () => {
  setup({ loading: true });
  expect(screen.getByRole("status").textContent).toContain("Checking");
  expect(screen.queryByText("Private content")).toBeNull();
  cleanup();
  setup({ loading: false });
  expect(screen.getByText("Sign in form")).toBeTruthy();
});
it("shows authenticated content and offers retry on connection failure", () => {
  setup({ user: { id: "1" } });
  expect(screen.getByText("Private content")).toBeTruthy();
  cleanup();
  setup({ error: "Offline" });
  expect(screen.getByRole("alert").textContent).toBe("Offline");
  expect(screen.getByRole("button").textContent).toContain("Retry");
});
