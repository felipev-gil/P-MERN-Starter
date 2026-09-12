export function readConfig(env = process.env) {
  const fail = (message) => {
    throw new Error("Configuration error: " + message);
  };
  const mode = env.NODE_ENV || "development";
  if (!["development", "test", "production"].includes(mode))
    fail("NODE_ENV must be development, test, or production.");
  if (!env.MONGO_URI || !/^mongodb(\+srv)?:\/\//.test(env.MONGO_URI))
    fail("Set MONGO_URI to a MongoDB connection string in backend/.env.");
  const integer = (key, fallback, min, max) => {
    const value = Number(env[key] ?? fallback);
    if (!Number.isInteger(value) || value < min || value > max)
      fail(key + " must be an integer between " + min + " and " + max + ".");
    return value;
  };
  const origins = (env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!origins.length) fail("Set CORS_ORIGINS to your frontend origin.");
  for (const origin of origins) {
    let url;
    try {
      url = new URL(origin);
    } catch {
      fail("CORS_ORIGINS must contain complete HTTP(S) origins.");
    }
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin)
      fail(
        "CORS_ORIGINS must contain origins without paths or trailing slashes.",
      );
    if (mode === "production" && url.protocol !== "https:")
      fail("Production frontend origins must use HTTPS.");
  }
  const sameSite = env.COOKIE_SAME_SITE || "lax";
  if (!["lax", "strict", "none"].includes(sameSite))
    fail("COOKIE_SAME_SITE must be lax, strict, or none.");
  if (sameSite === "none" && mode !== "production")
    fail("SameSite=none requires production HTTPS.");
  return {
    mode,
    mongoUri: env.MONGO_URI,
    origins,
    sameSite,
    port: integer("PORT", 5000, 1, 65535),
    sessionHours: integer("SESSION_HOURS", 24, 1, 168),
    trustProxyHops: integer("TRUST_PROXY_HOPS", 0, 0, 10),
  };
}
