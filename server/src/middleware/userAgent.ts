import { NextFunction, Request, Response } from "express";

export default function userAgent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userAgent = req.headers["user-agent"];
  req.userAgent = userAgent;
  next();
}
