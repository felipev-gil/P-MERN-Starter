import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import { auth } from "../services/auth";
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSession(await auth.me());
    } catch (error) {
      if (error.status === 401) setSession(null);
      else setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    auth
      .me()
      .then((result) => {
        if (active) setSession(result);
      })
      .catch((error) => {
        if (active && error.status !== 401) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const expire = () => {
      setSession(null);
      if (session) setNotice("Your session expired. Please sign in again.");
    };
    window.addEventListener("session-expired", expire);
    const timer = session
      ? setTimeout(
          expire,
          Math.max(
            0,
            Math.min(
              2147483647,
              new Date(session.expiresAt).getTime() - Date.now(),
            ),
          ),
        )
      : null;
    return () => {
      window.removeEventListener("session-expired", expire);
      clearTimeout(timer);
    };
  }, [session]);
  const signIn = async (mode, values) => {
    const result = await auth[mode](values);
    setSession(result);
    setNotice("");
    setError("");
  };
  const signOut = async () => {
    await auth.logout();
    setSession(null);
    setNotice("You have signed out.");
  };
  return (
    <AuthContext.Provider
      value={{
        user: session?.user,
        loading,
        error,
        notice,
        refresh,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
