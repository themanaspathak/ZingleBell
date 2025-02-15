import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, IndianRupee, MapPin, User, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function OrderPayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const handlePaymentStatusUpdate = async (orderId: number, status: 'paid' | 'failed') => {
    try {
      await apiRequest(`/api/orders/${orderId}/payment-status`, 'POST', { status });

      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });

      toast({
        title: `Payment ${status === 'paid' ? 'Confirmed' : 'Failed'}`,
        description: `Order #${orderId} payment has been marked as ${status}`,
        variant: status === 'paid' ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Failed to update payment status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  // Group orders by payment status
  const paidOrders = orders?.filter(order => order.paymentStatus === "paid") || [];
  const pendingPaymentOrders = orders?.filter(order => 
    order.paymentStatus === "pending" || !order.paymentStatus
  ) || [];
  const failedPaymentOrders = orders?.filter(order => order.paymentStatus === "failed") || [];

  const OrderCard = ({ order, showActions = false }: { order: Order, showActions?: boolean }) => (
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

      {showActions && (
        <div className="flex gap-2 mt-2">
          <Button
            variant="default"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => handlePaymentStatusUpdate(order.id, 'paid')}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Paid
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => handlePaymentStatusUpdate(order.id, 'failed')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Mark as Failed
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Payment Orders */}
          <Card className="lg:col-span-2">
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
                    <OrderCard key={order.id} order={order} showActions />
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

          <div className="space-y-6">
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
                <ScrollArea className="h-[calc(100vh-500px)]">
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

            {/* Failed Payment Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Failed Payments</span>
                  <Badge variant="destructive">
                    {failedPaymentOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-500px)]">
                  <div className="space-y-4">
                    {failedPaymentOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                    {failedPaymentOrders.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No failed payments
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}