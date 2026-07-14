import { Request, Response, NextFunction } from "express";
import { verifyJwt, JwtPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Verify JWT from Authorization header — blocks if missing/invalid */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "অননুমোদিত" });
  }

  try {
    req.user = verifyJwt(token);
    next();
  } catch {
    return res.status(401).json({ message: "টোকেন অকার্যকর" });
  }
}

/** Restrict to specific roles — use after authMiddleware */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "অননুমোদিত" });
    }
    if (!roles.includes(req.user.role || "")) {
      return res.status(403).json({ message: "অনুমতি নেই" });
    }
    next();
  };
}

/** Attach user if token present, but don't block */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    try {
      req.user = verifyJwt(token);
    } catch {
      // silently ignore
    }
  }
  next();
}
