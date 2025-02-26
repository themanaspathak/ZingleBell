import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session) {
      console.error('Session middleware not initialized');
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session) {
      console.error('Session middleware not initialized');
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const result = await db.select().from(users).where(eq(users.id, req.session.userId));
    const user = result[0];

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
}