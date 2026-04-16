import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

// Auth
export const registerWorker = (data) => api.post("/workers/register", data);
export const loginWorker    = (data) => api.post("/workers/login", data);
export const getWorker      = (id)   => api.get(`/workers/${id}`);

// ML & Advisor
export const getRiskByLocation = (city) =>
  api.get("/ml/risk-by-location", { params: { city } });

export const getRecommendation = (weekly_salary, risk_score, weather_condition) =>
  api.post("/advisor/recommend-plan", { weekly_salary, risk_score, weather_condition });

// Dynamic Premium
export const getDynamicPremiums = (risk_score) =>
  api.get("/policies/dynamic-premium", { params: { risk_score } });

// Policy
export const createPolicy = (worker_id, plan, risk_score) =>
  api.post("/policies/create", { worker_id, plan, risk_score });

export const getPolicy = (worker_id) =>
  api.get(`/policies/${worker_id}`);

// Premiums
export const payPremium        = (worker_id) => api.post(`/premiums/pay/${worker_id}`);
export const getPremiumHistory = (worker_id) => api.get(`/premiums/${worker_id}`);

// Claims
export const getClaims          = (worker_id) => api.get(`/claims/${worker_id}`);
export const processClaimPayout = (claim_id)  => api.post(`/claims/process-payout/${claim_id}`);

// Triggers
export const getTriggerList  = ()     => api.get("/triggers/list");
export const simulateTrigger = (data) => api.post("/triggers/simulate", data);

// Admin
export const adminLogin           = (data)      => api.post("/admin/login", data);
export const adminRegister        = (data)      => api.post("/admin/register", data);
export const getAdminDashboard    = ()          => api.get("/admin/dashboard");
export const getWorkersSummary    = ()          => api.get("/admin/workers-summary");
export const getFraudDetection    = ()          => api.get("/admin/fraud-detection");
export const adminTriggerPayment      = (worker_id) => api.post(`/admin/trigger-payment/${worker_id}`);
export const adminFireTrigger         = (data)      => api.post("/admin/fire-trigger", data);
export const adminFireTriggerLocation = (data)      => api.post("/admin/fire-trigger-by-location", data);
