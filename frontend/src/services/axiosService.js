import axios from "axios";

// Helper to get base URL with fallback
const getBaseUrl = () => {
  // Vite env variables are injected at build time
  return import.meta.env.VITE_API_URL || 
         import.meta.env.VITE_API_BASE_URL || 
         "http://localhost:8001/api";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can add global error logging here
    console.error("API Error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;