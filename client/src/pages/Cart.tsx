import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Minus, Plus, Trash2, ArrowLeft, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { state, dispatch } = useCart();
  const { toast } = useToast();
  const [cookingRequest, setCookingRequest] = useState("");

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const gst = subtotal * 0.05; // 5% GST
  const total = subtotal + gst;

  // Function to get quantity of item in cart
  const getItemQuantity = (itemId: number) => {
    const cartItem = state.items.find(item => item.menuItem.id === itemId);
    return cartItem?.quantity || 0;
  };

  // Function to update quantity
  const updateQuantity = (cartItem: { menuItem: MenuItem, quantity: number, customizations: Record<string, string[]> }, newQuantity: number) => {
    if (newQuantity === 0) {
      dispatch({
        type: "REMOVE_ITEM",
        menuItemId: cartItem.menuItem.id,
      });
      toast({
        title: "Removed from cart",
        description: `${cartItem.menuItem.name} has been removed from your cart.`,
      });
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        menuItemId: cartItem.menuItem.id,
        quantity: newQuantity,
      });
      toast({
        title: "Quantity Updated",
        description: `Quantity of ${cartItem.menuItem.name} updated to ${newQuantity}.`,
      });
    }
  };

  // Fetch menu items for recommendations
  const { data: menuItems } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const desserts = menuItems?.filter(item =>
    item.category === "Desserts" ||
    item.name.toLowerCase().includes('jamun') ||
    item.name.toLowerCase().includes('halwa') ||
    item.name.toLowerCase().includes('kheer') ||
    item.name.toLowerCase().includes('rasmalai')
  ) || [];

  // Function to handle adding dessert to cart
  const handleAddDessert = (dessert: MenuItem) => {
    dispatch({
      type: "ADD_ITEM",
      item: {
        menuItem: dessert,
        quantity: 1,
        customizations: {},
      },
    });

    toast({
      title: "Added to cart",
      description: `${dessert.name} has been added to your cart.`,
    });
  };

  // Function to render dessert button with quantity controls
  const renderDessertButton = (dessert: MenuItem) => {
    const quantity = getItemQuantity(dessert.id);

    if (quantity === 0) {
      return (
        <Button
          onClick={() => handleAddDessert(dessert)}
          size="sm"
          className="h-7 bg-green-600 hover:bg-green-700 text-white"
        >
          Add
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            const existingItem = state.items.find(item => item.menuItem.id === dessert.id);
            if (existingItem) {
              updateQuantity(existingItem, Math.max(0, quantity - 1));
            }
          }}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center text-sm">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            const existingItem = state.items.find(item => item.menuItem.id === dessert.id);
            if (existingItem) {
              updateQuantity(existingItem, quantity + 1);
            }
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 pb-16">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background/95 backdrop-blur py-4 -mx-4 px-4 mb-6 md:hidden">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Your Cart</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-8">
        <h1 className="text-3xl font-bold mb-4">Your Cart</h1>
        <Link href="/">
          <Button variant="outline" className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add more items
          </Button>
        </Link>
      </div>

      {state.items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link href="/">
            <Button>Browse Menu</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item) => (
              <Card key={item.menuItem.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Veg/Non-veg indicator */}
                      <div className={`w-4 h-4 border-2 ${item.menuItem.isVegetarian ? 'border-green-600' : 'border-red-600'} p-0.5`}>
                        <div className={`w-full h-full rounded-full ${item.menuItem.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">{item.menuItem.name}</h3>
                        <div className="text-sm text-gray-600">
                          {Object.entries(item.customizations).map(([category, choices]) => (
                            <div key={category}>
                              {choices.join(", ")}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 md:h-8 md:w-8"
                      onClick={() =>
                        dispatch({
                          type: "REMOVE_ITEM",
                          menuItemId: item.menuItem.id,
                        })
                      }
                    >
                      <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 md:h-8 md:w-8"
                        onClick={() => updateQuantity(item, Math.max(0, item.quantity - 1))}
                      >
                        <Minus className="h-5 w-5 md:h-4 md:w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 md:h-8 md:w-8"
                        onClick={() => updateQuantity(item, item.quantity + 1)}
                      >
                        <Plus className="h-5 w-5 md:h-4 md:w-4" />
                      </Button>
                    </div>
                    <p className="font-medium">
                      ₹{Math.round(item.menuItem.price * item.quantity)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Cooking Request Section */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Pencil className="h-6 w-6 md:h-5 md:w-5 text-gray-600" />
                  <h3 className="font-medium">Special Cooking Instructions</h3>
                </div>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="Add any special cooking instructions or dietary requirements..."
                  value={cookingRequest}
                  onChange={(e) => {
                    setCookingRequest(e.target.value);
                    dispatch({
                      type: "SET_COOKING_INSTRUCTIONS",
                      instructions: e.target.value,
                    });
                  }}
                />
              </CardContent>
            </Card>

            {/* Recommended Desserts Section */}
            {desserts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Complete Your Meal</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {desserts.slice(0, 3).map((dessert) => (
                    <Card key={dessert.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <img
                          src={dessert.imageUrl}
                          alt={dessert.name}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-sm">{dessert.name}</h3>
                            <p className="text-sm font-bold">₹{Math.round(dessert.price)}</p>
                          </div>
                          {renderDessertButton(dessert)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Add more items - Mobile */}
            <div className="md:hidden mt-4">
              <Link href="/">
                <Button variant="outline" className="w-full h-12 flex items-center justify-center gap-3">
                  <Plus className="h-5 w-5" />
                  Add more items
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-[4.5rem] md:top-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{Math.round(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST (5%)</span>
                    <span>₹{Math.round(gst)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-4">
                    <span>Total</span>
                    <span>₹{Math.round(total)}</span>
                  </div>
                  <Link href="/checkout" className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Proceed to Checkout
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}