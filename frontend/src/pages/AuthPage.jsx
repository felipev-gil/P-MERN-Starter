import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
export function AuthPage({ mode }) {
  const register = mode === "register";
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);
  const destination =
    location.state?.from?.startsWith("/") &&
    !location.state.from.startsWith("//")
      ? location.state.from
      : "/account";
  if (loading) return <p role="status">Checking your session…</p>;
  if (user) return <Navigate to={destination} replace />;
  async function submit(event) {
    event.preventDefault();
    setError("");
    setFields({});
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (new TextEncoder().encode(values.password).length > 72) {
      setFields({ password: "Use at most 72 UTF-8 bytes." });
      setBusy(false);
      return;
    }
    try {
      await signIn(mode, values);
      navigate(destination, { replace: true });
    } catch (error) {
      setError(error.message);
      setFields(error.fields || {});
    } finally {
      setBusy(false);
    }
  }
  const inputs = [
    ...(register
      ? [{ name: "name", label: "Name", autoComplete: "name", maxLength: 80 }]
      : []),
    {
      name: "email",
      label: "Email",
      type: "email",
      autoComplete: "email",
      maxLength: 254,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      autoComplete: register ? "new-password" : "current-password",
      minLength: 12,
    },
  ];
  return (
    <section className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-semibold">
        {register ? "Create an account" : "Sign in"}
      </h1>
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <p role="alert" className="text-error">
            {error}
          </p>
        )}
        {inputs.map(({ name, label, ...props }) => (
          <div key={name}>
            <label className="mb-2 block font-medium" htmlFor={name}>
              {label}
            </label>
            <input
              {...props}
              id={name}
              name={name}
              required
              className="input w-full"
              aria-invalid={Boolean(fields[name])}
              aria-describedby={
                fields[name]
                  ? name + "-error"
                  : name === "password"
                    ? "password-help"
                    : undefined
              }
            />
            {fields[name] && (
              <p id={name + "-error"} role="alert" className="mt-1 text-error">
                {fields[name]}
              </p>
            )}
          </div>
        ))}
        <p id="password-help" className="text-sm">
          Password: at least 12 characters, at most 72 UTF-8 bytes. Spaces are
          allowed.
        </p>
        <button className="btn btn-neutral w-full" disabled={busy}>
          {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
        </button>
      </form>
      <p className="mt-6">
        {register ? "Already registered? " : "Need an account? "}
        <Link
          className="link"
          to={register ? "/login" : "/register"}
          state={location.state}
        >
          {register ? "Sign in" : "Register"}
        </Link>
      </p>
    </section>
  );
}
