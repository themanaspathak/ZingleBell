var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  MOCK_MENU_ITEMS: () => MOCK_MENU_ITEMS,
  MOCK_ORDERS: () => MOCK_ORDERS,
  insertMenuItemSchema: () => insertMenuItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertUserSchema: () => insertUserSchema,
  menuItems: () => menuItems,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, boolean, jsonb, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  isVegetarian: boolean("is_vegetarian").notNull().default(true),
  isBestSeller: boolean("is_bestseller").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  customizations: jsonb("customizations").$type()
});
var orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userEmail: text("user_email").notNull(),
  tableNumber: integer("table_number").notNull(),
  items: jsonb("items").$type().notNull(),
  status: text("status").notNull().default("pending"),
  cookingInstructions: text("cooking_instructions"),
  total: real("total").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  })
}));
var usersRelations = relations(users, ({ many }) => ({
  orders: many(orders)
}));
var insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address")
});
var insertMenuItemSchema = createInsertSchema(menuItems);
var insertOrderSchema = createInsertSchema(orders);
var MOCK_MENU_ITEMS = [
  {
    id: 1,
    name: "Vegetable Manchurian",
    description: "Crispy vegetable dumplings in a spicy Indo-Chinese sauce",
    price: 349,
    category: "Starters",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246",
    isVegetarian: true,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Sauce",
          choices: ["Dry", "With Gravy"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 2,
    name: "Paneer Popcorn",
    description: "Bite-sized crispy cottage cheese fritters with Indian spices",
    price: 399,
    category: "Starters",
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
    isVegetarian: true,
    isBestSeller: false,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Dips",
          choices: ["Mint Chutney", "Tamarind Chutney", "Tomato Sauce"],
          maxChoices: 2
        }
      ]
    }
  },
  {
    id: 3,
    name: "Mutter Paneer",
    description: "Fresh cottage cheese and green peas in rich tomato gravy",
    price: 449,
    category: "Main Course",
    imageUrl: "https://images.unsplash.com/photo-1631452180775-7c5d27efa8d4",
    isVegetarian: true,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Bread",
          choices: ["Naan", "Roti", "Paratha"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 4,
    name: "Malai Kofta",
    description: "Potato and cheese dumplings in creamy cashew sauce",
    price: 499,
    category: "Main Course",
    imageUrl: "https://images.unsplash.com/photo-1585032226639-91c2e508a542",
    isVegetarian: true,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Bread",
          choices: ["Naan", "Roti", "Paratha"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 5,
    name: "Hyderabadi Chicken Biryani",
    description: "Aromatic basmati rice cooked with spiced chicken and herbs",
    price: 549,
    category: "Rice and Biryani",
    imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0",
    isVegetarian: false,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Add-ons",
          choices: ["Raita", "Salan", "Extra Gravy"],
          maxChoices: 2
        }
      ]
    }
  },
  {
    id: 6,
    name: "Masala Dosa",
    description: "Crispy rice crepe filled with spiced potato masala",
    price: 349,
    category: "South Indian",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    isVegetarian: true,
    isBestSeller: false,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Accompaniments",
          choices: ["Coconut Chutney", "Sambar", "Tomato Chutney"],
          maxChoices: 3
        },
        {
          name: "Extra Filling",
          choices: ["More Potato", "Onion", "Cheese"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 7,
    name: "Chana Masala with Rice",
    description: "Spiced chickpeas curry served with steamed basmati rice",
    price: 399,
    category: "Fast Food",
    imageUrl: "https://images.unsplash.com/photo-1585032226634-b2ef638c7350",
    isVegetarian: true,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Add-ons",
          choices: ["Raita", "Papad", "Extra Rice"],
          maxChoices: 2
        }
      ]
    }
  },
  {
    id: 8,
    name: "Idli Sambhar",
    description: "Steamed rice cakes served with lentil soup and chutneys",
    price: 299,
    category: "South Indian",
    imageUrl: "https://images.unsplash.com/photo-1589301841844-1cf2d77f9b36",
    isVegetarian: true,
    isBestSeller: false,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Accompaniments",
          choices: ["Coconut Chutney", "Tomato Chutney", "Extra Sambhar"],
          maxChoices: 3
        },
        {
          name: "Extra Items",
          choices: ["Vada", "Podi", "Ghee"],
          maxChoices: 2
        }
      ]
    }
  },
  {
    id: 9,
    name: "Butter Chicken",
    description: "Tender chicken pieces in rich tomato and butter gravy",
    price: 599,
    category: "Main Course",
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398",
    isVegetarian: false,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Bread",
          choices: ["Naan", "Roti", "Paratha"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 10,
    name: "Chicken Biryani",
    description: "Fragrant basmati rice cooked with tender chicken and aromatic spices",
    price: 549,
    category: "Rice and Biryani",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8",
    isVegetarian: false,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Add-ons",
          choices: ["Raita", "Salan", "Extra Gravy"],
          maxChoices: 2
        }
      ]
    }
  },
  {
    id: 11,
    name: "Mutton Rogan Josh",
    description: "Tender mutton pieces cooked in Kashmiri style spicy gravy",
    price: 649,
    category: "Main Course",
    imageUrl: "https://images.unsplash.com/photo-1545247181-516773cae754",
    isVegetarian: false,
    isBestSeller: false,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Bread",
          choices: ["Naan", "Roti", "Paratha"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 12,
    name: "Fish Curry",
    description: "Fresh fish simmered in coconut-based curry sauce",
    price: 599,
    category: "Main Course",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46",
    isVegetarian: false,
    isBestSeller: false,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Rice Type",
          choices: ["Steamed Rice", "Jeera Rice", "No Rice"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 13,
    name: "Gulab Jamun",
    description: "Sweet dumplings made from milk solids, soaked in sugar syrup",
    price: 249,
    category: "Desserts",
    imageUrl: "https://images.unsplash.com/photo-1589301841844-1cf2d77f9b36",
    isVegetarian: true,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Portion",
          choices: ["2 pieces", "4 pieces", "6 pieces"],
          maxChoices: 1
        },
        {
          name: "Temperature",
          choices: ["Warm", "Room Temperature"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 14,
    name: "Gajar Ka Halwa",
    description: "Traditional carrot pudding made with milk, cardamom, and nuts",
    price: 279,
    category: "Desserts",
    imageUrl: "https://images.unsplash.com/photo-1546269795-e3f9f5a00e9e",
    isVegetarian: true,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Add-ons",
          choices: ["Extra Nuts", "Extra Raisins", "Plain"],
          maxChoices: 1
        },
        {
          name: "Temperature",
          choices: ["Warm", "Room Temperature"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 15,
    name: "Rasmalai",
    description: "Soft cottage cheese dumplings in creamy saffron milk",
    price: 299,
    category: "Desserts",
    imageUrl: "https://images.unsplash.com/photo-1547127796-06bb04e4b315",
    isVegetarian: true,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Portion",
          choices: ["2 pieces", "3 pieces", "4 pieces"],
          maxChoices: 1
        },
        {
          name: "Garnish",
          choices: ["Extra Pistachios", "Extra Saffron", "Plain"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 16,
    name: "Kheer",
    description: "Traditional rice pudding with cardamom, nuts, and saffron",
    price: 249,
    category: "Desserts",
    imageUrl: "https://images.unsplash.com/photo-1615832494873-b0c52d519696",
    isVegetarian: true,
    isBestSeller: false,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Add-ons",
          choices: ["Extra Nuts", "Extra Raisins", "Plain"],
          maxChoices: 1
        },
        {
          name: "Temperature",
          choices: ["Chilled", "Room Temperature"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 17,
    name: "Samosa Chaat",
    description: "Crispy samosas topped with chickpea curry, yogurt, and chutneys",
    price: 289,
    category: "Starters",
    imageUrl: "https://images.unsplash.com/photo-1630409351217-bc4fa6422075",
    isVegetarian: true,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Toppings",
          choices: ["Extra Chutney", "Extra Yogurt", "Extra Onions"],
          maxChoices: 2
        }
      ]
    }
  },
  {
    id: 18,
    name: "Onion Bhaji",
    description: "Crispy onion fritters with Indian spices and herbs",
    price: 259,
    category: "Starters",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    isVegetarian: true,
    isBestSeller: false,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Portion",
          choices: ["4 pieces", "6 pieces", "8 pieces"],
          maxChoices: 1
        },
        {
          name: "Accompaniments",
          choices: ["Mint Chutney", "Tamarind Chutney", "Both"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 19,
    name: "Paneer Tikka",
    description: "Grilled cottage cheese marinated in yogurt and Indian spices",
    price: 399,
    category: "Starters",
    imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0",
    isVegetarian: true,
    isBestSeller: true,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        },
        {
          name: "Style",
          choices: ["Classic", "Malai", "Hariyali"],
          maxChoices: 1
        }
      ]
    }
  },
  {
    id: 20,
    name: "Dahi Puri",
    description: "Crispy puris filled with potatoes, yogurt, and tangy chutneys",
    price: 279,
    category: "Starters",
    imageUrl: "https://images.unsplash.com/photo-1626544827763-d516dce335e2",
    isVegetarian: true,
    isBestSeller: false,
    isAvailable: true,
    customizations: {
      options: [
        {
          name: "Portion",
          choices: ["6 pieces", "8 pieces", "10 pieces"],
          maxChoices: 1
        },
        {
          name: "Spice Level",
          choices: ["Mild", "Medium", "Hot"],
          maxChoices: 1
        }
      ]
    }
  }
];
var MOCK_ORDERS = [
  {
    id: 1,
    tableNumber: 5,
    items: [
      {
        menuItemId: 1,
        quantity: 2,
        customizations: {
          "Portion Size": ["medium"],
          "Preparation": ["Regular"],
          "Taste": ["spicy"]
        }
      }
    ],
    status: "pending",
    cookingInstructions: "Extra spicy please, no onion",
    total: 698,
    createdAt: /* @__PURE__ */ new Date(),
    userId: 1,
    userEmail: "test@example.com"
  }
];

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  async getMenuItems() {
    try {
      const items = await db.select().from(menuItems);
      if (items.length === 0) {
        const insertedItems = await db.insert(menuItems).values(MOCK_MENU_ITEMS).returning();
        return insertedItems;
      }
      return items;
    } catch (error) {
      console.error("Error fetching menu items:", error);
      return MOCK_MENU_ITEMS;
    }
  }
  async getMenuItem(id) {
    try {
      const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
      return item;
    } catch (error) {
      console.error("Error fetching menu item:", error);
      return MOCK_MENU_ITEMS.find((item) => item.id === id);
    }
  }
  async getUser(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async createOrder(orderData) {
    let user = await this.getUser(orderData.userEmail);
    if (!user) {
      user = await this.createUser({ email: orderData.userEmail });
    }
    const order = await db.insert(orders).values(orderData).returning();
    return order[0];
  }
  async getOrder(id) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  async getUserOrders(email) {
    return await db.select().from(orders).where(eq(orders.userEmail, email)).orderBy(desc(orders.createdAt));
  }
  async getAllOrders() {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  async updateOrderStatus(orderId, status) {
    const [updatedOrder] = await db.update(orders).set({ status }).where(eq(orders.id, orderId)).returning();
    if (!updatedOrder) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    return updatedOrder;
  }
  async updateMenuItemAvailability(itemId, isAvailable) {
    try {
      const [updatedItem] = await db.update(menuItems).set({ isAvailable }).where(eq(menuItems.id, itemId)).returning();
      if (!updatedItem) {
        const mockItem = MOCK_MENU_ITEMS.find((item) => item.id === itemId);
        if (!mockItem) {
          throw new Error(`Menu item with ID ${itemId} not found`);
        }
        const [insertedItem] = await db.insert(menuItems).values({ ...mockItem, isAvailable }).returning();
        return insertedItem;
      }
      return updatedItem;
    } catch (error) {
      console.error("Error updating menu item availability:", error);
      throw new Error(`Failed to update availability for item ${itemId}`);
    }
  }
};
var storage = new DatabaseStorage();

// server/routes/menu.ts
import { Router } from "express";
var menuRouter = Router();
menuRouter.get("/", async (req, res) => {
  try {
    const items = await storage.getMenuItems();
    res.json(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});
menuRouter.get("/:id", async (req, res) => {
  try {
    const item = await storage.getMenuItem(parseInt(req.params.id));
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }
    res.json(item);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({ error: "Failed to fetch menu item" });
  }
});
menuRouter.post("/:id/availability", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { isAvailable } = req.body;
    if (typeof isAvailable !== "boolean") {
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

// server/routes.ts
async function registerRoutes(app2) {
  app2.use("/api/menu", menuRouter);
  app2.get("/api/orders", async (req, res) => {
    try {
      const orders2 = await storage.getAllOrders();
      res.json(orders2);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.post("/api/orders", async (req, res) => {
    try {
      const order = insertOrderSchema.parse(req.body);
      const created = await storage.createOrder(order);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });
  app2.get("/api/orders/:id", async (req, res) => {
    const order = await storage.getOrder(parseInt(req.params.id));
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json(order);
  });
  app2.get("/api/users/:email/orders", async (req, res) => {
    try {
      const { email } = req.params;
      const orders2 = await storage.getUserOrders(email);
      res.json(orders2);
    } catch (error) {
      console.error("Failed to fetch user orders:", error);
      res.status(500).json({ message: "Failed to fetch order history" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/routes/auth.ts
import { Router as Router2 } from "express";

// server/services/auth.ts
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { eq as eq2 } from "drizzle-orm";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  try {
    const [hashedPassword, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashedPassword, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return hashedBuf.length === suppliedBuf.length && timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}
async function authenticateUser(email, password) {
  console.log("Authenticating user:", email);
  const result = await db.select().from(users).where(eq2(users.email, email));
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
async function ensureAdminUser(email, password) {
  const result = await db.select().from(users).where(eq2(users.email, email));
  if (result.length === 0) {
    const hashedPassword = await hashPassword(password);
    await db.insert(users).values({
      email,
      password: hashedPassword,
      isAdmin: true
    });
    console.log("Admin user created:", email);
  }
}

// server/routes/auth.ts
import { eq as eq3 } from "drizzle-orm";
import session from "express-session";
import { z as z2 } from "zod";
var router = Router2();
router.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  })
);
var loginSchema = z2.object({
  email: z2.string().email("Invalid email address"),
  password: z2.string().min(6, "Password must be at least 6 characters")
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
    if (error instanceof z2.ZodError) {
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
    const result = await db.select().from(users).where(eq3(users.id, req.session.userId));
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
var auth_default = router;

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use("/api", auth_default);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  await ensureAdminUser("admin@restaurant.com", "admin123");
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = 5e3;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
