import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Menu from "@/pages/Menu";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/Dashboard";
import Kitchen from "@/pages/Kitchen";
import MenuManagement from "@/pages/admin/MenuManagement";
import OrderPayment from "@/pages/admin/OrderPayment";
import Orders from "@/pages/admin/Orders";
import OrderConfirmed from "@/pages/OrderConfirmed";
import OrderHistory from "@/pages/OrderHistory";
import { CartProvider } from "@/contexts/CartContext";
import NavBar from "@/components/NavBar";

function Router() {
  const [location] = useLocation();
  const showNavBar = !['/kitchen'].includes(location);

  return (
    <>
      {showNavBar && <NavBar />}
      <Switch>
        {/* Customer Routes */}
        <Route path="/" component={Menu} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-confirmed" component={OrderConfirmed} />
        <Route path="/orders/:mobile" component={OrderHistory} />
        <Route path="/kitchen" component={Kitchen} />

        {/* Admin Routes */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/menu" component={MenuManagement} />
        <Route path="/admin/orders" component={Orders} />
        <Route path="/admin/order-payment" component={OrderPayment} />

        {/* 404 Route */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Router />
        <Toaster />
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;