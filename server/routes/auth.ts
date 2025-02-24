import { Router } from "express";
import { authenticateUser, hashPassword } from "../services/auth";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import { z } from "zod";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../db";

const router = Router();
const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// Initialize session middleware with PostgreSQL store
router.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
    },
  })
);

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

router.post("/admin/login", async (req, res) => {
  console.log("Login attempt for email:", req.body.email);

  try {
    const { email, password } = loginSchema.parse(req.body);
    console.log("Validated login data");

    const user = await authenticateUser(email, password);
    console.log("User authenticated:", user.id);

    if (!user.isAdmin) {
      console.log("Non-admin user attempted login:", user.id);
      return res.status(403).json({ message: "Access denied: Admin privileges required" });
    }

    // Set user session
    req.session.userId = user.id;
    console.log("Session set for user:", user.id);

    res.json({ 
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error instanceof Error) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/admin/logout", (req, res) => {
  console.log("Logout attempt for user:", req.session.userId);

  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/admin/user", async (req, res) => {
  console.log("Checking auth status for session:", req.session.userId);

  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const result = await db.select().from(users).where(eq(users.id, req.session.userId));
    const user = result[0];

    if (!user) {
      console.log("User not found for id:", req.session.userId);
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
      console.log("Non-admin user attempted access:", user.id);
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});

export default router;