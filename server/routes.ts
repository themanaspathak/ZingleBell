import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { menuRouter } from "./routes/menu";
import { sendOTP, verifyOTP } from "./services/messageCentralService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register menu routes
  app.use("/api/menu", menuRouter);

  // Mobile OTP verification endpoints
  app.post("/api/send-mobile-otp", async (req, res) => {
    try {
      const { mobileNumber } = req.body;
      if (!mobileNumber) {
        res.status(400).json({ success: false, message: "Mobile number is required" });
        return;
      }

      const result = await sendOTP(mobileNumber);
      res.json(result);
    } catch (error) {
      console.error("Failed to send OTP:", error);
      res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
  });

  app.post("/api/verify-mobile-otp", async (req, res) => {
    try {
      const { mobileNumber, otp } = req.body;
      if (!mobileNumber || !otp) {
        res.status(400).json({ success: false, message: "Mobile number and OTP are required" });
        return;
      }

      const result = await verifyOTP(mobileNumber, otp);
      if (result.success) {
        // Store verified mobile number in session
        if (req.session) {
          req.session.verifiedMobile = mobileNumber;
        }
      }
      res.json(result);
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      res.status(500).json({ success: false, message: "Failed to verify OTP" });
    }
  });

  // Add endpoint to get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Add endpoint to update order status
  app.post("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await storage.updateOrderStatus(parseInt(id), status);
      res.json(order);
    } catch (error) {
      console.error("Failed to update order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

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

  app.post("/api/orders", async (req, res) => {
    try {
      const order = insertOrderSchema.parse(req.body);
      const created = await storage.createOrder(order);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    const order = await storage.getOrder(parseInt(req.params.id));
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json(order);
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