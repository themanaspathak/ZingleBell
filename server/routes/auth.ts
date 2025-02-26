import { Router } from "express";
import { authenticateUser, hashPassword, createPasswordResetToken, resetPassword } from "../services/auth";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const resetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// Password reset request endpoint
router.post("/admin/request-reset", async (req, res) => {
  try {
    const { email } = resetRequestSchema.parse(req.body);
    await createPasswordResetToken(email);
    res.json({ message: "If an account exists with this email, a reset link will be sent." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Failed to process reset request" });
  }
});

// Reset password endpoint
router.post("/admin/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await resetPassword(token, newPassword);
    res.json({ message: "Password reset successful" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// Protected kitchen route
router.get("/kitchen", requireAuth, (req, res) => {
  res.json({ message: "Kitchen access granted" });
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