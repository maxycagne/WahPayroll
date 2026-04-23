import { io } from "socket.io-client";

const getAccessToken = () => localStorage.getItem("wah_token") || "";

const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
  auth: {
    token: getAccessToken(),
  },
});

export default socket;
