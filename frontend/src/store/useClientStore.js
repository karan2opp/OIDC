// src/store/useClientStore.js

import { create } from "zustand";
import { registerClientApp } from "../services/clientService";

export const useClientStore = create((set) => ({
  client: null,
  loading: false,
  error: null,

  registerClient: (payload) => registerClientApp(payload, set),

  clearClient: () =>
    set({
      client: null,
      error: null,
    }),
}));