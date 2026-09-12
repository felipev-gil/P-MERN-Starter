import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
export function Home() {
  const [result, setResult] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api("/health", { signal: controller.signal })
      .then((data) => setResult({ data }))
      .catch((error) => {
        if (error.name !== "AbortError") setResult({ error: error.message });
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">
        A starting point for your next project
      </h1>
      <p>React, Express, and MongoDB with a small authentication foundation.</p>
      <div className="rounded-box border border-base-300 p-6">
        <h2 className="mb-3 text-xl font-medium">API connection</h2>
        {result.loading ? (
          <p role="status">Connecting to the API…</p>
        ) : result.error ? (
          <p role="alert">{result.error}</p>
        ) : (
          <p role="status">
            API: {result.data.status}. Database: {result.data.database}.
          </p>
        )}
        <button
          className="btn mt-4"
          onClick={() => {
            setResult({ loading: true });
            setAttempt((value) => value + 1);
          }}
        >
          Check again
        </button>
      </div>
      <Link className="link" to="/account">
        Open the protected account page
      </Link>
    </section>
  );
}
