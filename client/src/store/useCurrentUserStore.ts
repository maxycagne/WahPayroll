import { create } from "zustand";
import { persist } from "zustand/middleware";

type CurrentUser = {
  email: string;
  emp_id: string | number;
  first_name: string;
  last_name: string;
  name: string;
  profile_photo: string;
  role: string;
};

type State = {
  currentUser: CurrentUser | null;
};

type Action = {
  changeCurrentUser: (currentUser: CurrentUser) => void;
  clearCurrentUser: () => void;
};

const useCurrentUserStore = create<State & Action>()(
  persist(
    (set) => ({
      currentUser: null,
      changeCurrentUser: (currentUser) => set({ currentUser }),
      clearCurrentUser: () => set({ currentUser: null }),
    }),
    {
      name: "wah-current-user",
    },
  ),
);

export default useCurrentUserStore;
