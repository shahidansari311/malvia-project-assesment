import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch {
      // ignore malformed localStorage
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (mobile, otp) => api.post("/auth/login", { mobile, otp });
export const register = (mobile, name) =>
  api.post("/auth/register", { mobile, name });
export const getProfile = () => api.get("/auth/profile");

// ── Markets ───────────────────────────────────────────────────────────────────
export const getMarkets = () => api.get("/markets");
export const updateMarketTimings = (marketData) =>
  api.put("/markets/update", marketData);

// ── Bets ──────────────────────────────────────────────────────────────────────
export const placeBet = (betData) => api.post("/bets/place", betData);
export const getLiveBets = () => api.get("/bets/live");
export const getUserBets = () => api.get("/bets/my-bets");

// ── Admin ─────────────────────────────────────────────────────────────────────
export const declareResult = (resultData) =>
  api.post("/admin/declare-result", resultData);
export const getResults = () => api.get("/admin/results");

export default api;
