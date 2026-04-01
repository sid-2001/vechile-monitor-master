import "express";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      username: string;
      role: "ADMIN" | "DRIVER" | "OPERATOR";
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
