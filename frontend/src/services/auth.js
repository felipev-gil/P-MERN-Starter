import { api } from "./api";
export const auth = {
  me: () => api("/auth/me"),
  login: (body) => api("/auth/login", { method: "POST", body }),
  register: (body) => api("/auth/register", { method: "POST", body }),
  logout: () => api("/auth/logout", { method: "POST" }),
};
