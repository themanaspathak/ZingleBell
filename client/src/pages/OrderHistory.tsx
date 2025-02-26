import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Order, MenuItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, IndianRupee, User, Phone, Info, MapPin, CreditCard, LogOut } from "lucide-react";

export default function OrderHistory() {
  const [, navigate] = useLocation();
  const mobileNumber = localStorage.getItem("verifiedMobile");

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/mobile/${encodeURIComponent(mobileNumber || "")}`],
    enabled: !!mobileNumber,
  });

  const { data: menuItems, isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const handleLogout = () => {
    localStorage.removeItem("verifiedMobile");
    navigate("/");
  };

  if (!mobileNumber) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg text-center">
        <p className="mb-4">Please verify your mobile number to view order history</p>
        <Button onClick={() => navigate("/")}>Go to Menu</Button>
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

  const getPaymentStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      case "failed":
        return "bg-rose-600 hover:bg-rose-700 text-white";
      default:
        return "bg-amber-600 hover:bg-amber-700 text-white";
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>+91 {mobileNumber}</span>
          </div>
        </div>

        <div className="space-y-6">
          {orders?.map((order) => (
            <Card
              key={order.id}
              className="overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] duration-300"
            >
              <CardHeader className="bg-muted/50 pb-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <CardTitle className="text-xl flex items-center gap-2">
                        Order #{order.id}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <Badge
                      className={`${getStatusBadgeStyle(order.status)} px-3 py-1 text-sm font-medium shadow-sm`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="divide-y">
                    {order.items.map((item, index) => {
                      const menuItem = menuItems?.find(m => m.id === item.menuItemId);
                      return (
                        <div key={index} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-start gap-4 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate flex-1">
                                  {menuItem?.name || `Item #${item.menuItemId}`}
                                </p>
                                <Badge variant="outline" className="text-xs px-2">
                                  ×{item.quantity}
                                </Badge>
                              </div>
                              <div className="mt-1 space-y-1">
                                {Object.entries(item.customizations).map(([category, choices]) => (
                                  <div key={category} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <Info className="h-3 w-3 mt-1 shrink-0" />
                                    <span>{category}: {choices.join(", ")}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="text-right font-medium">
                              <div className="flex items-center justify-end gap-1 text-green-600">
                                <IndianRupee className="h-4 w-4" />
                                {menuItem ? Math.round(menuItem.price * item.quantity).toLocaleString('en-IN') : 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {order.cookingInstructions && (
                    <div className="text-sm bg-muted/50 p-4 rounded-lg border">
                      <span className="font-medium block mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Special Instructions
                      </span>
                      <p className="text-muted-foreground pl-6">
                        {order.cookingInstructions}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Table #{order.tableNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <CreditCard className="h-4 w-4" />
                        <div className="flex items-center gap-2">
                          <span>{order.paymentMethod?.toUpperCase() || 'CASH'}</span>
                          <Badge
                            className={`${getPaymentStatusBadgeStyle(order.paymentStatus)} px-2 py-0.5 text-xs font-medium shadow-sm ml-2`}
                          >
                            {order.paymentStatus ? (order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)) : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                      <span className="text-sm font-medium">Total Amount</span>
                      <span className="text-xl font-bold text-green-600 flex items-center gap-1">
                        <IndianRupee className="h-5 w-5" />
                        {Math.round(order.total).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!orders || orders.length === 0) && (
            <div className="text-center py-16 bg-muted/50 rounded-lg border-2 border-dashed">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Looks like you haven't placed any orders yet. Start your culinary journey with us!
                </p>
                <Button
                  onClick={() => navigate("/")}
                  variant="default"
                  className="bg-primary hover:bg-primary/90"
                >
                  Browse Our Menu
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}