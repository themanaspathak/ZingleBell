import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MenuItem, Order } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChefHat, Clock, Calendar, FilterX, Pencil, MenuSquare, ClipboardList, Check, AlertCircle, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type View = 'menu' | 'active' | 'completed' | 'cancelled';

export default function Kitchen() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<View>('active');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const [availabilityMap, setAvailabilityMap] = useState<Record<number, boolean>>({});
  const [updatingOrders, setUpdatingOrders] = useState<Record<number, string>>({});

  const handleAvailabilityToggle = async (itemId: number) => {
    const menuItem = menuItems?.find(item => item.id === itemId);
    const newStatus = !menuItem?.isAvailable;

    try {
      await apiRequest(
        `/api/menu/${itemId}/availability`,
        'POST',
        { isAvailable: newStatus }
      );

      await queryClient.invalidateQueries({ queryKey: ['/api/menu'] });

      toast({
        title: `Menu Item ${newStatus ? 'Available' : 'Unavailable'}`,
        description: `${menuItem?.name} is now ${newStatus ? 'available' : 'unavailable'} for ordering`,
        variant: newStatus ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Failed to update menu item availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update menu item availability',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: 'completed' | 'cancelled') => {
    try {
      setUpdatingOrders(prev => ({
        ...prev,
        [orderId]: newStatus
      }));

      await apiRequest(`/api/orders/${orderId}/status`, 'POST', { status: newStatus });
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });

      toast({
        title: `Order ${newStatus}`,
        description: `Order #${orderId} has been marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
      setUpdatingOrders(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });

      toast({
        title: 'Cannot Update Order',
        description: error instanceof Error ? error.message : 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const { data: menuItems, isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const filteredOrders = orders?.filter(order => {
    if (!dateRange.from || !dateRange.to) return true;
    const orderDate = new Date(order.createdAt);
    return orderDate >= dateRange.from && orderDate <= dateRange.to;
  }) || [];

  const activeOrders = filteredOrders.filter(order => order.status === 'in progress') || [];
  const completedOrders = filteredOrders.filter(order => order.status === 'completed') || [];
  const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled') || [];

  if (menuLoading || ordersLoading) {
    return <div className="p-4">Loading kitchen dashboard...</div>;
  }

  const MenuView = () => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Menu Items Availability</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toggle availability for menu items
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="divide-y">
            {menuItems?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.isAvailable ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <Switch
                    checked={item.isAvailable}
                    onCheckedChange={() => handleAvailabilityToggle(item.id)}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const OrderCard = ({ order }: { order: Order }) => {
    const currentStatus = order.status;
    const orderDate = new Date(order.createdAt);
    const isActionable = currentStatus === "in progress";

    return (
      <Card key={order.id} className="mb-4 shadow-md border-0 hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="bg-muted/50 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Badge variant="default" className="text-sm px-3 py-1 bg-primary/90 hover:bg-primary">
                Order #{order.id}
              </Badge>
              <Badge
                className={cn(
                  "text-sm px-3 py-1",
                  {
                    "bg-green-600 hover:bg-green-700 text-white": currentStatus === "completed",
                    "bg-yellow-600 hover:bg-yellow-700 text-white": currentStatus === "in progress",
                    "bg-red-600 hover:bg-red-700 text-white": currentStatus === "cancelled"
                  }
                )}
              >
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl font-bold">
                Table #{order.tableNumber}
              </CardTitle>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <div className="font-medium text-base text-foreground">
                  {order.customerName}
                </div>
                <div>+91 {order.mobileNumber}</div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span title={format(orderDate, 'PPpp')}>
                    {format(orderDate, 'hh:mm aa')} - {format(orderDate, 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {order.items.map((item, index) => {
              const menuItem = menuItems?.find(m => m.id === item.menuItemId);
              return (
                <div key={index} className="flex justify-between items-start py-2 border-b last:border-0">
                  <div className="space-y-2">
                    <p className="font-medium">{menuItem?.name} × {item.quantity}</p>
                    <div className="text-sm text-gray-600">
                      {Object.entries(item.customizations).map(([category, choices]) => (
                        <div key={category} className="ml-4">
                          • {category}: {choices.join(", ")}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {order.cookingInstructions && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Pencil className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Special Instructions:</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{order.cookingInstructions}</p>
              </div>
            )}
          </div>
          {isActionable && (
            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                variant="destructive"
                className="w-full py-2.5 text-sm font-medium"
              >
                Can't serve
              </Button>
              <Button
                onClick={() => handleStatusUpdate(order.id, 'completed')}
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700 py-2.5 text-sm font-medium"
              >
                Served
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const OrdersView = ({ orders, title }: { orders: Order[], title: string }) => (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
          <Badge variant="secondary" className="text-sm px-2.5">
            {orders.length}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Date Filter:</span>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={dateRange.from ? "default" : "outline"}
                className={cn(
                  "justify-start text-left font-normal text-sm h-9",
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
              <div className="p-3 border-b">
                <h3 className="font-medium text-sm">Filter Orders by Date</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a date range to view orders
                </p>
              </div>
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
                numberOfMonths={1}
                className="p-3"
              />
            </PopoverContent>
          </Popover>

          {(dateRange.from || dateRange.to) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDateRange({ from: undefined, to: undefined })}
              className="h-9 w-9"
              title="Clear date filter"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-4 pr-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {orders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No {title.toLowerCase()} at the moment
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const MainContent = () => {
    switch (currentView) {
      case 'menu':
        return <MenuView />;
      case 'active':
        return <OrdersView orders={activeOrders} title="Active Orders" />;
      case 'completed':
        return <OrdersView orders={completedOrders} title="Completed Orders" />;
      case 'cancelled':
        return <OrdersView orders={cancelledOrders} title="Cancelled Orders" />;
      default:
        return null;
    }
  };

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 mb-8">
        <ChefHat className="h-7 w-7" />
        <h1 className="text-xl font-bold">Kitchen</h1>
      </div>
      <nav className="space-y-1.5">
        <Button
          variant={currentView === 'menu' ? 'default' : 'ghost'}
          className="w-full justify-start text-sm"
          onClick={() => {
            setCurrentView('menu');
            setIsMobileMenuOpen(false);
          }}
        >
          <MenuSquare className="mr-2 h-4 w-4" />
          Menu Availability
        </Button>
        <Button
          variant={currentView === 'active' ? 'default' : 'ghost'}
          className="w-full justify-start text-sm"
          onClick={() => {
            setCurrentView('active');
            setIsMobileMenuOpen(false);
          }}
        >
          <ClipboardList className="mr-2 h-4 w-4" />
          Active Orders
          {activeOrders.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs px-1.5">
              {activeOrders.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={currentView === 'completed' ? 'default' : 'ghost'}
          className="w-full justify-start text-sm"
          onClick={() => {
            setCurrentView('completed');
            setIsMobileMenuOpen(false);
          }}
        >
          <Check className="mr-2 h-4 w-4" />
          Completed Orders
          {completedOrders.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs px-1.5">
              {completedOrders.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={currentView === 'cancelled' ? 'default' : 'ghost'}
          className="w-full justify-start text-sm"
          onClick={() => {
            setCurrentView('cancelled');
            setIsMobileMenuOpen(false);
          }}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Cancelled Orders
          {cancelledOrders.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs px-1.5">
              {cancelledOrders.length}
            </Badge>
          )}
        </Button>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Mobile Menu Button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-4">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-[240px] border-r bg-card p-4">
          <NavContent />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 pt-20 md:p-6 md:pt-6 overflow-auto w-full">
          <MainContent />
        </div>
      </div>
    </div>
  );
}