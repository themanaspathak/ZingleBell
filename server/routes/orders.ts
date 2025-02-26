import { Router } from "express";
import { storage } from "../storage";
import { insertOrderSchema } from "@shared/schema";
import { stringify } from "csv-stringify/sync";

const router = Router();

// Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await storage.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Create new order
router.post("/", async (req, res) => {
  try {
    const orderData = insertOrderSchema.parse(req.body);
    const order = await storage.createOrder(orderData);
    res.status(201).json(order);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(400).json({ error: "Failed to create order" });
  }
});

// Get single order
router.get("/:id", async (req, res) => {
  try {
    const order = await storage.getOrder(parseInt(req.params.id));
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Update order status
router.post("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['in progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const order = await storage.updateOrderStatus(parseInt(id), status);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Failed to update order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Update order payment status
router.post("/:id/payment-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['paid', 'failed', 'pending'].includes(status)) {
      return res.status(400).json({ error: "Invalid payment status" });
    }

    const order = await storage.updateOrderPaymentStatus(parseInt(id), status);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Failed to update payment status:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

export const ordersRouter = router;