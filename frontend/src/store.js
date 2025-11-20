import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAppStore = create()(
  persist(
    (set) => ({
      token: "",
      user: null,
      setToken: (token) => set(() => ({ token })),
      setUser: (user) => set(() => ({ user })),
      clearUser: () => set({ user: null, token: "" }),
    }),
    {
      name: "app-store",
    }
  )
);

export default useAppStore;