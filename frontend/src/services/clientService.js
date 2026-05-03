// src/client/client.service.js

import api from "./axiosService";

export const registerClientApp = async (payload, set) => {
  try {
    set({ loading: true, error: null });

    const res = await api.post("/clients/register", payload);

    set({
      client: res.data.data,
      loading: false,
    });

    return res.data;
  } catch (error) {
    set({
      loading: false,
      error: error.response?.data?.message || "Client registration failed",
    });

    throw error;
  }
};





