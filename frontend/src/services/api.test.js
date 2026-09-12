import { afterEach, expect, it, vi } from "vitest";
import { api } from "./api";
afterEach(() => vi.unstubAllGlobals());
it("sends cookies and JSON; preserves validation fields", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { message: "Invalid", fields: { email: "Invalid email" } },
        }),
        { status: 422 },
      ),
    );
  vi.stubGlobal("fetch", fetch);
  await expect(
    api("/auth/register", { method: "POST", body: { email: "bad" } }),
  ).rejects.toMatchObject({ status: 422, fields: { email: "Invalid email" } });
  expect(fetch.mock.calls[0][1]).toMatchObject({
    credentials: "include",
    body: '{"email":"bad"}',
  });
});
it("announces expired sessions but not incorrect login credentials", async () => {
  const listener = vi.fn();
  window.addEventListener("session-expired", listener);
  for (const code of ["INVALID_CREDENTIALS", "UNAUTHENTICATED"]) {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ error: { code, message: "Sign in" } }),
            { status: 401 },
          ),
        ),
    );
    await expect(api("/auth/me")).rejects.toMatchObject({ status: 401 });
  }
  expect(listener).toHaveBeenCalledTimes(1);
  window.removeEventListener("session-expired", listener);
});
it("handles network failures and empty logout responses", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
  await expect(api("/health")).rejects.toThrow("Cannot reach the API");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  );
  await expect(api("/auth/logout", { method: "POST" })).resolves.toBeNull();
});
