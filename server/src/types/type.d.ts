import { Request } from "express";
declare global {
  namespace Express {
    interface Request {
      userAgent?: string;
    }
  }
}

type ServerToClientEvents = {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
};

type ClientToServerEvents = {
  hello: () => void;
};

type InterServerEvents = {
  ping: () => void;
};

type SocketData = {
  name: string;
  age: number;
};
