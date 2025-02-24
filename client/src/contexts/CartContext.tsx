import { createContext, useContext, useReducer, ReactNode } from "react";
import { MenuItem } from "@shared/schema";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations: Record<string, string[]>;
}

interface CartState {
  items: CartItem[];
  tableNumber: number | null;
  cookingInstructions: string;
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; menuItemId: number }
  | { type: "UPDATE_QUANTITY"; menuItemId: number; quantity: number }
  | { type: "SET_TABLE"; tableNumber: number }
  | { type: "SET_COOKING_INSTRUCTIONS"; instructions: string }
  | { type: "CLEAR_CART" };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        item => 
          item.menuItem.id === action.item.menuItem.id && 
          JSON.stringify(item.customizations) === JSON.stringify(action.item.customizations)
      );

      if (existingItemIndex !== -1) {
        // Item exists, update its quantity
        return {
          ...state,
          items: state.items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + action.item.quantity }
              : item
          ),
        };
      }

      // Item doesn't exist, add it to the cart
      return {
        ...state,
        items: [...state.items, action.item],
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.menuItem.id !== action.menuItemId),
      };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map((item) =>
          item.menuItem.id === action.menuItemId
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    case "SET_TABLE":
      return {
        ...state,
        tableNumber: action.tableNumber,
      };
    case "SET_COOKING_INSTRUCTIONS":
      return {
        ...state,
        cookingInstructions: action.instructions,
      };
    case "CLEAR_CART":
      return {
        ...state,
        items: [],
        cookingInstructions: "",
      };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    tableNumber: null,
    cookingInstructions: "",
  });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}