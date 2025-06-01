import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";

export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function setupAuth(app: Express) {
  app.use(getSession());
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}