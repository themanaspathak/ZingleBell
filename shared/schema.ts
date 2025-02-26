import { pgTable, text, serial, integer, boolean, jsonb, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table to store user information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  mobileNumber: text("mobile_number").unique(),
  fullName: text("full_name"),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),  // New field for subcategory (veg/non-veg)
  imageUrl: text("image_url").notNull(),
  isVegetarian: boolean("is_vegetarian").notNull().default(true),
  isBestSeller: boolean("is_bestseller").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  customizations: jsonb("customizations").$type<{
    options: { name: string; choices: string[]; maxChoices: number }[];
  }>(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userEmail: text("user_email").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  customerName: text("customer_name").notNull(),
  tableNumber: integer("table_number").notNull(),
  items: jsonb("items").$type<{
    menuItemId: number;
    quantity: number;
    customizations: Record<string, string[]>;
  }[]>().notNull(),
  status: text("status").notNull().default('pending'),
  paymentStatus: text("payment_status").notNull().default('pending').$type<'pending' | 'paid' | 'failed'>(),
  paymentMethod: text("payment_method").$type<'cash' | 'upi'>(),
  cookingInstructions: text("cooking_instructions"),
  total: real("total").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().optional(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems);
export const insertOrderSchema = createInsertSchema(orders);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: 1,
    name: "Vegetable Manchurian",
    description: "Crispy vegetable dumplings in Indo-Chinese sauce",
    price: 349.00,
    category: "Starters",
    subcategory: "Veg", //Added Subcategory
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
    description: "Crispy spiced cottage cheese bites",
    price: 399.00,
    category: "Starters",
    subcategory: "Veg", //Added Subcategory
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
    description: "Cottage cheese and peas in rich gravy",
    price: 449.00,
    category: "Main Course",
    subcategory: "Veg", //Added Subcategory
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
    description: "Cheese-stuffed potato dumplings in creamy curry",
    price: 499.00,
    category: "Main Course",
    subcategory: "Veg", //Added Subcategory
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
    description: "Fragrant rice with spiced chicken and herbs",
    price: 549.00,
    category: "Rice and Biryani",
    subcategory: "Non-Veg", //Added Subcategory
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
    description: "Crispy rice crepe with spiced potato filling",
    price: 349.00,
    category: "South Indian",
    subcategory: "Veg", //Added Subcategory
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
    description: "Spiced chickpeas curry served with basmati rice",
    price: 399.00,
    category: "Fast Food",
    subcategory: "Veg", //Added Subcategory
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
    description: "Steamed rice cakes with lentil soup",
    price: 299.00,
    category: "South Indian",
    subcategory: "Veg", //Added Subcategory
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
    description: "Tender chicken in rich tomato-butter sauce",
    price: 599.00,
    category: "Main Course",
    subcategory: "Non-Veg", //Added Subcategory
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
    description: "Aromatic rice layered with spiced chicken",
    price: 549.00,
    category: "Rice and Biryani",
    subcategory: "Non-Veg", //Added Subcategory
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
    description: "Kashmiri-style spiced tender lamb curry",
    price: 649.00,
    category: "Main Course",
    subcategory: "Non-Veg", //Added Subcategory
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
    description: "Fresh fish in aromatic coconut curry",
    price: 599.00,
    category: "Main Course",
    subcategory: "Non-Veg", //Added Subcategory
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
    description: "Sweet milk dumplings in sugar syrup",
    price: 249.00,
    category: "Desserts",
    subcategory: "Veg", //Added Subcategory
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
    description: "Sweet carrot pudding with nuts and cardamom",
    price: 279.00,
    category: "Desserts",
    subcategory: "Veg", //Added Subcategory
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
    description: "Cottage cheese dumplings in saffron milk",
    price: 299.00,
    category: "Desserts",
    subcategory: "Veg", //Added Subcategory
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
    description: "Creamy rice pudding with nuts and saffron",
    price: 249.00,
    category: "Desserts",
    subcategory: "Veg", //Added Subcategory
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
    description: "Crushed samosas topped with chutneys and yogurt",
    price: 289.00,
    category: "Starters",
    subcategory: "Veg", //Added Subcategory
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
    description: "Crispy spiced onion fritters",
    price: 259.00,
    category: "Starters",
    subcategory: "Veg", //Added Subcategory
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
    description: "Grilled spiced cottage cheese cubes",
    price: 399.00,
    category: "Starters",
    subcategory: "Veg", //Added Subcategory
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
    description: "Crispy shells filled with yogurt and chutneys",
    price: 279.00,
    category: "Starters",
    subcategory: "Veg", //Added Subcategory
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

export const MOCK_ORDERS: Order[] = [
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
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    cookingInstructions: "Extra spicy please, no onion",
    total: 698.00,
    createdAt: new Date(),
    userId: 1,
    userEmail: "test@example.com",
    mobileNumber: "1234567890",
    customerName: "Test Customer" 
  }
];