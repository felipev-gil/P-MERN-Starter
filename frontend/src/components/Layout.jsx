import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth-context";
export function Layout() {
  const { user, notice, signOut } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await signOut();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="border-b border-base-300">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 p-4"
        >
          <Link className="font-semibold" to="/">
            MERN Starter
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-4">
            {user ? (
              <>
                <Link to="/account">Account</Link>
                <button className="btn btn-sm" disabled={busy} onClick={logout}>
                  {busy ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-4xl p-4 py-10">
        {notice && (
          <p role="status" className="mb-4">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 text-error">
            {error}
          </p>
        )}
        <Outlet />
      </main>
    </>
  );
}
