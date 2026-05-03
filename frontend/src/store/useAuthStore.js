// src/store/useAuthStore.js

import { create } from "zustand";
import {
  loginUser,
  registerUser,
  getMe,
  refreshToken,
  logoutUser,
} from "../services/authService.js";

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isLoggedIn: false,
  isAdmin: false,
  loading: false,
  error: null,

  setUser: (userData, token) =>
    set({
      user: userData,
      accessToken: token,
      isLoggedIn: true,
      isAdmin: userData?.role === "admin",
    }),

  setAccessToken: (token) =>
    set({
      accessToken: token,
    }),

  login: (payload) => loginUser(payload, set),
  register: (payload) => registerUser(payload, set),
  fetchCurrentUser: () => getMe(set),
  refreshAccessToken: () => refreshToken(set),
  logout: () => logoutUser(get().user?._id, set),
}));
