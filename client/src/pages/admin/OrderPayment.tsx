import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle2, IndianRupee, MapPin, User, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function OrderPayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders with 5-second polling interval for real-time updates
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const handlePaymentStatusUpdate = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/payment-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'paid' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update payment status");
      }

      // Immediately invalidate the orders query to trigger a refresh
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });

      toast({
        title: "Payment Confirmed",
        description: `Order #${orderId} has been marked as paid`,
      });
    } catch (error: any) {
      console.error('Failed to update payment status:', error);
      toast({
        title: 'Error',
        description: error.message || "Failed to update payment status",
        variant: 'destructive',
      });
    }
  };

  // Group orders by payment status
  const paidOrders = orders?.filter(order => 
    order.paymentStatus === "paid" && order.status !== "cancelled"
  ) || [];
  const pendingPaymentOrders = orders?.filter(order => 
    order.paymentStatus === "pending" && order.status !== "cancelled"
  ) || [];

  const OrderCard = ({ order }: { order: Order }) => (
    <div className="flex flex-col p-4 bg-muted/50 rounded-lg space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="font-medium text-lg">Order #{order.id}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(order.createdAt), 'PPp')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Table #{order.tableNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
          <IndianRupee className="h-5 w-5" />
          {Math.round(order.total)}
        </div>
      </div>

      {order.paymentStatus === 'pending' && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="default"
            size="lg"
            className="w-2/3 bg-green-600 hover:bg-green-700 py-6 text-lg"
            onClick={() => handlePaymentStatusUpdate(order.id)}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Mark as Paid
          </Button>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-4">Loading payment information...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Order Payments</h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              Total Orders: {orders?.length || 0}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Payment Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pending Payments</span>
                <Badge className="bg-yellow-600">
                  {pendingPaymentOrders.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4">
                  {pendingPaymentOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                  {pendingPaymentOrders.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No pending payments
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Paid Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Paid Orders</span>
                <Badge className="bg-green-600">
                  {paidOrders.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4">
                  {paidOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                  {paidOrders.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No paid orders
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}