

// src/auth/auth.service.js

import api from "./axiosService";

export const loginUser = async (payload, set) => {
  try {
    set({ loading: true, error: null });

    const res = await api.post("/auth/login", payload);
    console.log("login response:", res.data);
    const responseData = res.data.data;
    console.log("responseData:", responseData);
if (res.data.data.redirectTo) {
  window.location.href = `http://localhost:8001${res.data.data.redirectTo}`; // ✅
  return;
}
    const user = res.data.data.user;
    const accessToken = res.data.data.accessToken;

    set({
      user,
      accessToken,
      isLoggedIn: true,
      isAdmin: user?.role === "admin",
      loading: false,
    });

    return res.data;
  } catch (error) {
    set({
      loading: false,
      error: error.response?.data?.message || "Login failed",
    });

    throw error;
  }
};

export const registerUser = async (payload, set) => {
  try {
    set({ loading: true, error: null });

    const res = await api.post("/auth/register", payload);

    set({
      loading: false,
    });

    return res.data;
  } catch (error) {
    set({
      loading: false,
      error: error.response?.data?.message || "Registration failed",
    });

    throw error;
  }
};

export const getMe = async (set) => {
  try {
    set({
      loading: true,
      error: null,
    });

    const res = await api.get("/auth/me");
    const user = res.data.data;

    set({
      user,
      isLoggedIn: true,
      isAdmin: user?.role === "admin",
      loading: false,
    });

    return user;
  } catch (error) {
    set({
      user: null,
      isLoggedIn: false,
      isAdmin: false,
      loading: false,
      error: error.response?.data?.message || "Failed to fetch user",
    });

    return null;
  }
};

export const refreshToken = async (set) => {
  try {
    const res = await api.post("/auth/refresh-token");

    set({
      accessToken: res.data.data.accessToken,
      isLoggedIn: true,
    });

    return true;
  } catch (error) {
    set({
      accessToken: null,
      user: null,
      isLoggedIn: false,
      isAdmin: false,
    });

    return false;
  }
};

export const logoutUser = async (userId, set) => {
  try {
    await api.post("/auth/logout", {
      id: userId,
    });
  } catch (error) {
    console.error(error);
  } finally {
    set({
      user: null,
      accessToken: null,
      isLoggedIn: false,
      isAdmin: false,
      error: null,
    });
  }
};


