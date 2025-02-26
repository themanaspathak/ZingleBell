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

// Export orders as CSV
router.get("/export/csv", async (req, res) => {
  try {
    const orders = await storage.getAllOrders();
    
    // Transform orders into a format suitable for CSV
    const csvData = orders.map(order => ({
      'Order ID': order.id,
      'Customer Name': order.customerName,
      'Mobile Number': order.mobileNumber,
      'Table Number': order.tableNumber,
      'Status': order.status,
      'Payment Status': order.paymentStatus,
      'Total Amount': order.total,
      'Items': order.items.map(item => 
        `${item.quantity}x Item #${item.menuItemId}`
      ).join(', '),
      'Created At': new Date(order.createdAt).toLocaleString(),
    }));

    // Generate CSV string
    const csvString = stringify(csvData, {
      header: true,
      columns: [
        'Order ID',
        'Customer Name',
        'Mobile Number',
        'Table Number',
        'Status',
        'Payment Status',
        'Total Amount',
        'Items',
        'Created At'
      ]
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
    
    res.send(csvString);
  } catch (error) {
    console.error("Failed to export orders:", error);
    res.status(500).json({ error: "Failed to export orders" });
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

export const ordersRouter = router;
