import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { menuRouter } from "./routes/menu";
import { ordersRouter } from "./routes/orders";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register menu routes
  app.use("/api/menu", menuRouter);

  // Register orders routes
  app.use("/api/orders", ordersRouter);

  // Add endpoint to get orders by mobile number
  app.get("/api/orders/mobile/:mobileNumber", async (req, res) => {
    try {
      const { mobileNumber } = req.params;
      const orders = await storage.getUserOrdersByMobile(mobileNumber);
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch orders by mobile:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // User order history endpoint
  app.get("/api/users/:email/orders", async (req, res) => {
    try {
      const { email } = req.params;
      const orders = await storage.getUserOrders(email);
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch user orders:", error);
      res.status(500).json({ message: "Failed to fetch order history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}