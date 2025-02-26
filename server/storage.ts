import { db } from "./db";
import { 
  users, orders, menuItems,
  type User, type InsertUser,
  type Order, type InsertOrder,
  type MenuItem, MOCK_MENU_ITEMS
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: Omit<MenuItem, 'id'>): Promise<MenuItem>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getUser(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserOrders(email: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(orderId: number, status: 'pending' | 'completed' | 'cancelled' | 'in progress'): Promise<Order>;
  updateMenuItemAvailability(itemId: number, isAvailable: boolean): Promise<MenuItem>;
  getUserOrdersByMobile(mobileNumber: string): Promise<Order[]>;
  updateMenuItem(id: number, menuItem: Partial<MenuItem>): Promise<MenuItem>;
  deleteMenuItem(id: number): Promise<void>;
  updateOrderPaymentStatus(orderId: number, paymentStatus: 'paid' | 'failed' | 'pending'): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  async getMenuItems(): Promise<MenuItem[]> {
    try {
      console.log("Fetching all menu items");
      const items = await db.select().from(menuItems);
      console.log("Fetched items:", items);
      if (items.length === 0) {
        const insertedItems = await db.insert(menuItems)
          .values(MOCK_MENU_ITEMS)
          .returning();
        console.log("Inserted mock items:", insertedItems);
        return insertedItems;
      }
      return items;
    } catch (error) {
      console.error("Error fetching menu items:", error);
      return MOCK_MENU_ITEMS;
    }
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    try {
      const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
      return item;
    } catch (error) {
      console.error("Error fetching menu item:", error);
      return MOCK_MENU_ITEMS.find(item => item.id === id);
    }
  }

  async getUser(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    try {
      console.log("Creating order with data:", orderData);

      // Create the order with "in progress" status
      const [order] = await db.insert(orders)
        .values({
          ...orderData,
          status: 'in progress',
          createdAt: new Date()
        })
        .returning();

      console.log("Order created successfully:", order);
      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async getOrder(id: number): Promise<Order | undefined> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      return order;
    } catch (error) {
      console.error("Error fetching order:", error);
      return undefined;
    }
  }

  async getUserOrders(email: string): Promise<Order[]> {
    try {
      return await db.select()
        .from(orders)
        .where(eq(orders.userEmail, email))
        .orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error fetching user orders:", error);
      return [];
    }
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      return await db.select()
        .from(orders)
        .orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error fetching all orders:", error);
      return [];
    }
  }

  async updateOrderStatus(orderId: number, status: 'pending' | 'completed' | 'cancelled' | 'in progress'): Promise<Order> {
    try {
      // First check the current status of the order
      const [currentOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!currentOrder) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // If order is already completed or cancelled, prevent further changes
      if (currentOrder.status === 'completed' || currentOrder.status === 'cancelled') {
        throw new Error(`Cannot modify order ${orderId} as it is already ${currentOrder.status}`);
      }

      // If the new status is cancelled, also update the payment status to failed
      const updateData = status === 'cancelled'
        ? { status, paymentStatus: 'failed' as const }
        : { status };

      const [updatedOrder] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error(`Failed to update order ${orderId}`);
      }

      return updatedOrder;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  async updateMenuItemAvailability(itemId: number, isAvailable: boolean): Promise<MenuItem> {
    try {
      const [updatedItem] = await db
        .update(menuItems)
        .set({ isAvailable })
        .where(eq(menuItems.id, itemId))
        .returning();

      if (!updatedItem) {
        const mockItem = MOCK_MENU_ITEMS.find(item => item.id === itemId);
        if (!mockItem) {
          throw new Error(`Menu item with ID ${itemId} not found`);
        }

        const [insertedItem] = await db
          .insert(menuItems)
          .values({ ...mockItem, isAvailable })
          .returning();

        return insertedItem;
      }

      return updatedItem;
    } catch (error) {
      console.error("Error updating menu item availability:", error);
      throw new Error(`Failed to update availability for item ${itemId}`);
    }
  }
  async updateMenuItem(id: number, menuItem: Partial<MenuItem>): Promise<MenuItem> {
    try {
      console.log("Starting update of menu item:", id, "with data:", menuItem);

      // First verify the item exists
      const [existingItem] = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, id));

      if (!existingItem) {
        console.error(`Menu item with ID ${id} not found for update`);
        throw new Error(`Menu item with ID ${id} not found`);
      }

      console.log("Found item to update:", existingItem);

      const [updatedItem] = await db
        .update(menuItems)
        .set(menuItem)
        .where(eq(menuItems.id, id))
        .returning();

      console.log("Update result:", updatedItem);

      if (!updatedItem) {
        throw new Error(`Failed to update menu item ${id}`);
      }

      console.log(`Successfully updated menu item ${id}`);
      return updatedItem;
    } catch (error) {
      console.error("Error in updateMenuItem:", error);
      throw error;
    }
  }

  async deleteMenuItem(id: number): Promise<void> {
    try {
      console.log("Starting deletion of menu item:", id);

      // First verify the item exists
      const [existingItem] = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, id));

      if (!existingItem) {
        console.error(`Menu item with ID ${id} not found for deletion`);
        throw new Error(`Menu item with ID ${id} not found`);
      }

      console.log("Found item to delete:", existingItem);

      // Execute the delete operation
      const deletedItems = await db
        .delete(menuItems)
        .where(eq(menuItems.id, id))
        .returning();

      console.log("Deletion result:", deletedItems);

      if (deletedItems.length === 0) {
        throw new Error(`Failed to delete menu item ${id}`);
      }

      console.log(`Successfully deleted menu item ${id}`);
    } catch (error) {
      console.error("Error in deleteMenuItem:", error);
      throw error;
    }
  }
  async getUserOrdersByMobile(mobileNumber: string): Promise<Order[]> {
    try {
      return await db.select()
        .from(orders)
        .where(eq(orders.mobileNumber, mobileNumber))
        .orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error fetching user orders by mobile:", error);
      return [];
    }
  }
  async updateOrderPaymentStatus(orderId: number, paymentStatus: 'paid' | 'failed' | 'pending'): Promise<Order> {
    try {
      // First check if the order exists
      const [currentOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!currentOrder) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Update the order's payment status
      const [updatedOrder] = await db
        .update(orders)
        .set({ paymentStatus })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error(`Failed to update payment status for order ${orderId}`);
      }

      return updatedOrder;
    } catch (error) {
      console.error("Error updating order payment status:", error);
      throw error;
    }
  }
  async createMenuItem(menuItem: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    try {
      console.log("Creating new menu item:", menuItem);

      // Remove any potential id from the input to let database generate it
      const { id, ...menuItemData } = menuItem as any;

      // Ensure customizations is properly formatted
      const sanitizedData = {
        ...menuItemData,
        customizations: menuItemData.customizations || { options: [] }
      };

      console.log("Sanitized menu item data:", sanitizedData);

      const [newItem] = await db
        .insert(menuItems)
        .values(sanitizedData)
        .returning();

      if (!newItem) {
        throw new Error("Failed to create menu item");
      }

      console.log("Successfully created menu item:", newItem);
      return newItem;
    } catch (error) {
      console.error("Error in createMenuItem:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();