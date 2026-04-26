import { useEffect } from "react";
import socket from "./io";
import useConnectionStore from "@/store/useConnectionStore";
import { logout } from "./logout";

const useSocket = ({ user }: { user: any }) => {
  const setIsConnected = useConnectionStore((state) => state.setIsConnected);

  useEffect(() => {
    if (!user) {
      console.log("user not found");
      socket.disconnect();
      return;
    }

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("force-logout", (message) => {
      console.log(message);
      logout();
    });

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [setIsConnected, user]);
};

export default useSocket;
