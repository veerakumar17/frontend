import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export const registerWorker = (data) => api.post("/workers/register", data);
export const loginWorker    = (data) => api.post("/workers/login", data);

export const getRiskByLocation = (city) =>
  api.get("/ml/risk-by-location", { params: { city } });

export const getRecommendation = (weekly_salary, risk_score, weather_condition) =>
  api.post("/advisor/recommend-plan", { weekly_salary, risk_score, weather_condition });
