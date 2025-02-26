import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Minus, Plus, ArrowLeft, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Checkout() {
  const { state, dispatch } = useCart();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const gst = subtotal * 0.05; // 5% GST
  const total = subtotal + gst;

  const updateQuantity = (menuItemId: number, newQuantity: number) => {
    dispatch({
      type: "UPDATE_QUANTITY",
      menuItemId,
      quantity: newQuantity,
    });
  };

  const handleTableSelect = (tableNumber: number) => {
    setSelectedTable(tableNumber);
    dispatch({
      type: "SET_TABLE",
      tableNumber,
    });
  };

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const orderData = {
        tableNumber: state.tableNumber || 1,
        userEmail: `${mobileNumber}@guest.restaurant.com`,
        mobileNumber: mobileNumber,
        customerName: customerName,
        items: state.items.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          customizations: item.customizations || {}
        })),
        status: "in progress",
        paymentStatus: "pending" as const,
        paymentMethod: "cash" as const,
        cookingInstructions: state.cookingInstructions || "",
        total: total,
      };

      const response = await apiRequest("/api/orders", "POST", orderData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      dispatch({ type: "CLEAR_CART" });
      localStorage.setItem("customerName", customerName);
      localStorage.setItem("mobileNumber", mobileNumber);

      navigate("/order-confirmed");
    } catch (error: any) {
      console.error("Failed to place order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to place your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">Your cart is empty</p>
        <Link href="/">
          <Button>Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-16 max-w-lg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 mb-6">
        <Link href="/cart">
          <Button variant="ghost" size="icon" className="absolute left-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-center">Review Order</h1>
      </div>

      {/* Order Items */}
      <div className="space-y-6">
        {state.items.map((item) => (
          <Card key={item.menuItem.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {/* Veg/Non-veg indicator */}
                <div className={`w-4 h-4 border-2 ${item.menuItem.isVegetarian ? 'border-green-600' : 'border-red-600'} p-0.5`}>
                  <div className={`w-full h-full rounded-full ${item.menuItem.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`} />
                </div>
                <h2 className="text-lg font-semibold">{item.menuItem.name}</h2>
              </div>
              <div className="text-xl">₹{Math.round(item.menuItem.price * item.quantity)}</div>
            </div>

            {/* Customizations */}
            <div className="text-sm text-gray-600 mb-4">
              {Object.entries(item.customizations).map(([category, choices]) => (
                <div key={category}>
                  {choices.join(", ")}
                </div>
              ))}
            </div>

            {/* Quantity Controls */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.menuItem.id, Math.max(1, item.quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {/* Customer Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Details</h2>
          <Input
            type="text"
            placeholder="Your Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="h-12"
          />
          <Input
            type="tel"
            placeholder="Mobile Number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="h-12"
          />
        </div>

        {/* Table Selection Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Select Your Table</h2>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((tableNum) => (
              <Button
                key={tableNum}
                variant={selectedTable === tableNum ? "default" : "outline"}
                className={`h-16 text-lg font-semibold ${
                  selectedTable === tableNum ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleTableSelect(tableNum)}
              >
                Table {tableNum}
              </Button>
            ))}
          </div>
        </div>

        {/* Payment Method and Order Button */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Payment Method</h2>

          {/* Order Button */}
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white h-auto py-4 flex items-center justify-center gap-3"
            onClick={handlePlaceOrder}
            disabled={!selectedTable || !customerName || mobileNumber.length !== 10 || isLoading}
          >
            <Wallet className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Place Order</div>
              <div className="text-sm opacity-90">Pay at the restaurant</div>
            </div>
            <div className="ml-auto font-bold">₹{Math.round(total)}</div>
          </Button>

          {(!selectedTable || !customerName || mobileNumber.length !== 10) && (
            <p className="text-sm text-muted-foreground text-center">
              Please fill in all details to proceed with the order
            </p>
          )}
        </div>
      </div>
    </div>
  );
}