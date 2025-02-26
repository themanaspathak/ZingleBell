import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, IndianRupee, Info, MapPin, LogOut } from "lucide-react";
import { format } from "date-fns";

export default function OrderHistory() {
  const [, navigate] = useLocation();
  const hasPlacedOrder = localStorage.getItem("hasPlacedOrder") === "true";

  // Fetch both orders and menu items
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: hasPlacedOrder, // Only fetch if user has placed an order
  });

  const { data: menuItems, isLoading: menuLoading } = useQuery({
    queryKey: ["/api/menu"],
    enabled: hasPlacedOrder, // Only fetch if user has placed an order
  });

  const handleLogout = () => {
    localStorage.clear(); // Clear all storage including hasPlacedOrder
    navigate("/"); // Redirect to menu
  };

  // Redirect if no order has been placed
  if (!hasPlacedOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            Please place an order first to view order history.
          </p>
          <Button onClick={() => navigate("/")} variant="default">
            Go to Menu
          </Button>
        </div>
      </div>
    );
  }

  if (ordersLoading || menuLoading) {
    return <div className="container mx-auto px-4 py-8">Loading order history...</div>;
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "in progress":
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      case "cancelled":
        return "bg-red-600 hover:bg-red-700 text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 py-4 px-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="-ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
            <Badge variant="outline" className="text-base">
              {orders?.length || 0} Orders
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {orders?.map((order) => (
            <Card key={order.id} className="overflow-hidden border-2">
              <CardHeader className="bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Order #{order.id}</CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {format(new Date(order.createdAt), 'PPpp')}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        Table #{order.tableNumber}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusBadgeStyle(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {order.items.map((item, index) => {
                    // Find the corresponding menu item
                    const menuItem = menuItems?.find(m => m.id === item.menuItemId);

                    return (
                      <div key={index} className="flex justify-between items-start py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">
                            {item.quantity}x {menuItem?.name || `Item #${item.menuItemId}`}
                          </p>
                          {Object.entries(item.customizations || {}).map(([category, choices]) => (
                            <div key={category} className="text-sm text-muted-foreground ml-4 mt-1">
                              • {category}: {Array.isArray(choices) ? choices.join(", ") : choices}
                            </div>
                          ))}
                        </div>
                        <div className="text-right font-medium">
                          <div className="flex items-center justify-end gap-1 text-green-600">
                            <IndianRupee className="h-4 w-4" />
                            {menuItem ? (menuItem.price * item.quantity) : 0}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {order.cookingInstructions && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4" />
                        <span className="font-medium">Special Instructions:</span>
                      </div>
                      <p className="text-muted-foreground">{order.cookingInstructions}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4">
                    <Badge variant="outline" className="text-base">
                      {order.paymentStatus}
                    </Badge>
                    <div className="text-xl font-bold text-green-600 flex items-center">
                      <IndianRupee className="h-5 w-5" />
                      {Math.round(order.total).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!orders || orders.length === 0) && (
            <div className="text-center py-16 bg-muted/50 rounded-lg border-2 border-dashed">
              <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground mb-6">
                You haven't placed any orders yet. Start ordering from our delicious menu!
              </p>
              <Button onClick={() => navigate("/")} variant="default">
                Browse Menu
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}