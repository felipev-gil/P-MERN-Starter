import { Link } from "react-router-dom";
export function NotFound() {
  return (
    <section>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <Link className="link mt-4 inline-block" to="/">
        Return home
      </Link>
    </section>
  );
}
