import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, FilterX, Menu, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

export default function Orders() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Fetch orders with 5-second polling interval
  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const filteredOrders = orders?.filter(order => {
    if (!dateRange.from || !dateRange.to) return true;
    const orderDate = new Date(order.createdAt);
    return orderDate >= dateRange.from && orderDate <= dateRange.to;
  }) || [];

  const activeOrders = filteredOrders.filter(order => order.status === 'in progress') || [];
  const completedOrders = filteredOrders.filter(order => order.status === 'completed') || [];
  const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled') || [];

  const OrderCard = ({ order }: { order: Order }) => {
    const orderDate = new Date(order.createdAt);
    return (
      <Card key={order.id} className="mb-4">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-sm">
                  Order #{order.id}
                </Badge>
                <Badge
                  className={cn(
                    "text-sm",
                    {
                      "bg-yellow-600": order.status === "in progress",
                      "bg-green-600": order.status === "completed",
                      "bg-red-600": order.status === "cancelled"
                    }
                  )}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Table #{order.tableNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{format(orderDate, 'PPp')}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">₹{Math.round(order.total)}</p>
              <Badge variant="outline" className="mt-1">
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="text-sm">
                {item.quantity}x {item.menuItemId}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Orders</h1>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date Filter:</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateRange.from ? "default" : "outline"}
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Select date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from,
                      to: range?.to,
                    });
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDateRange({ from: undefined, to: undefined })}
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Orders</span>
                <Badge variant="default" className="bg-yellow-600">
                  {activeOrders.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[calc(100vh-250px)]">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {activeOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No active orders
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Completed Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Completed Orders</span>
                <Badge variant="default" className="bg-green-600">
                  {completedOrders.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[calc(100vh-250px)]">
                {completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {completedOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No completed orders
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Cancelled Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cancelled Orders</span>
                <Badge variant="default" className="bg-red-600">
                  {cancelledOrders.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[calc(100vh-250px)]">
                {cancelledOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {cancelledOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No cancelled orders
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
