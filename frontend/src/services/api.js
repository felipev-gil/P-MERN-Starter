const baseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export async function api(path, { body, ...options } = {}) {
  let response;
  try {
    response = await fetch(baseUrl + path, {
      ...options,
      credentials: "include",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Cannot reach the API. Check your connection and try again.",
      { cause: error },
    );
  }
  if (response.status === 204) return null;
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      "The API returned an unexpected response. Check VITE_API_URL.",
    );
  }
  if (!response.ok) {
    const error = Object.assign(
      new Error(payload.error?.message || "Request failed."),
      { status: response.status, fields: payload.error?.fields },
    );
    if (response.status === 401 && payload.error?.code === "UNAUTHENTICATED")
      window.dispatchEvent(new Event("session-expired"));
    throw error;
  }
  return payload.data;
}
