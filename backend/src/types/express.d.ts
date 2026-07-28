import "express";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      username: string;
      role: "ADMIN" | "DRIVER" | "OPERATOR";
      roleId?: string;
      permissions?: Record<string, "NONE" | "READ" | "WRITE" | "UPDATE" | "DELETE" | "FULL">;
      tokenId?: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
