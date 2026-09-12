import { useAuth } from "../context/auth-context";
export function Account() {
  const { user } = useAuth();
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Your account</h1>
      <p>
        Signed in as {user.name} ({user.email}).
      </p>
      <p>This minimal protected page is yours to replace.</p>
    </section>
  );
}
