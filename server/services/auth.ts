import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashedPassword, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashedPassword, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return hashedBuf.length === suppliedBuf.length && timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export async function authenticateUser(email: string, password: string) {
  console.log("Authenticating user:", email);
  const result = await db.select().from(users).where(eq(users.email, email));
  const user = result[0];

  if (!user) {
    console.log("User not found:", email);
    throw new Error("Invalid email or password");
  }

  console.log("Comparing passwords for user:", user.id);
  const isValid = await comparePasswords(password, user.password);
  if (!isValid) {
    console.log("Invalid password for user:", user.id);
    throw new Error("Invalid email or password");
  }

  console.log("Authentication successful for user:", user.id);
  return user;
}

// Function to create admin user if it doesn't exist
export async function ensureAdminUser(email: string, password: string) {
  const result = await db.select().from(users).where(eq(users.email, email));

  if (result.length === 0) {
    const hashedPassword = await hashPassword(password);
    await db.insert(users).values({
      email,
      password: hashedPassword,
      isAdmin: true,
    });
    console.log("Admin user created:", email);
  }
}
