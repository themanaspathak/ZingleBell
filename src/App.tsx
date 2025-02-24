import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "./contexts/CartContext";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";

// Import pages
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderConfirmed from "./pages/OrderConfirmed";
import OrderHistory from "./pages/OrderHistory";
import Kitchen from "./pages/Kitchen";
import NotFound from "./pages/not-found";
import EmailVerification from "./pages/EmailVerification";
import MobileVerification from "./pages/MobileVerification";

// Admin pages
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminKitchen from "./pages/admin/Kitchen";
import MenuManagement from "./pages/admin/MenuManagement";
import OrderPayment from "./pages/admin/OrderPayment";

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="min-h-screen bg-background">
          <Switch>
            <Route path="/" component={Menu} />
            <Route path="/cart" component={Cart} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/payment" component={Payment} />
            <Route path="/order-confirmed" component={OrderConfirmed} />
            <Route path="/order-history" component={OrderHistory} />
            <Route path="/kitchen" component={Kitchen} />
            <Route path="/email-verification" component={EmailVerification} />
            <Route path="/mobile-verification" component={MobileVerification} />
            
            {/* Admin routes */}
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/kitchen" component={AdminKitchen} />
            <Route path="/admin/menu" component={MenuManagement} />
            <Route path="/admin/payment" component={OrderPayment} />
            
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </div>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
