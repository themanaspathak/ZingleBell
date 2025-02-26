import { Router } from "express";
import { storage } from "../storage";

export const menuRouter = Router();

// GET all menu items
menuRouter.get("/", async (req, res) => {
  try {
    const items = await storage.getMenuItems();
    res.json(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

// POST new menu item
menuRouter.post("/", async (req, res) => {
  try {
    console.log("Creating new menu item:", req.body);
    const item = await storage.createMenuItem(req.body);
    console.log("Created menu item:", item);
    res.json(item);
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create menu item" });
  }
});

// GET single menu item
menuRouter.get("/:id", async (req, res) => {
  try {
    const item = await storage.getMenuItem(parseInt(req.params.id));
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json(item);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({ error: "Failed to fetch menu item" });
  }
});

// Update menu item availability
menuRouter.post("/:id/availability", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      res.status(400).json({ error: "isAvailable must be a boolean" });
      return;
    }

    const updatedItem = await storage.updateMenuItemAvailability(itemId, isAvailable);
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating menu item availability:", error);
    res.status(500).json({ error: "Failed to update menu item availability" });
  }
});

// Update menu item
menuRouter.patch("/:id", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    console.log("Updating menu item:", itemId, req.body);
    const updatedItem = await storage.updateMenuItem(itemId, req.body);
    console.log("Updated item:", updatedItem);
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update menu item" });
  }
});

// Delete menu item
menuRouter.delete("/:id", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    console.log("Deleting menu item:", itemId);
    await storage.deleteMenuItem(itemId);
    console.log("Successfully deleted menu item:", itemId);
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete menu item" });
  }
});