// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import passport from "passport";

// Extend Express Request type
declare global {
  namespace Express {
    interface User {
      role?: string;
      [key: string]: any;
    }
  }
}

export const authMiddleware = (allowedRoles: string[]) => {
  return [
    passport.authenticate("jwt", { session: false }),
    (req: Request, res: Response, next: NextFunction) => {
      if (!allowedRoles.includes(req.user?.role ?? "")) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Insufficient permissions",
        });
      }
      next();
    },
  ];
};

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role ?? "")) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions",
      });
    }
    next();
  };
};
