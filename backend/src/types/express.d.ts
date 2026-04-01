import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

export interface AuthTokenPayload extends JwtPayload {
  id: string;
  username: string;
}
