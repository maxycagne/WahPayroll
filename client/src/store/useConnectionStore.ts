import { create } from "zustand";

type Connection = {
  isConnected: boolean;
  setIsConnected: (val: boolean) => void;
};

const useConnectionStore = create<Connection>((set) => ({
  isConnected: false,
  setIsConnected: (val) => set({ isConnected: val }),
}));

export default useConnectionStore;
