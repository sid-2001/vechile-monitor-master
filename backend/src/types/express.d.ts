import "express";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      username: string;
      role: "ADMIN" | "DRIVER" | "OPERATOR";
      tokenId?: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
