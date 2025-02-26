import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ClipboardList, LogOut } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function NavBar() {
  const verifiedMobile = localStorage.getItem("verifiedMobile");
  const [location] = useLocation();
  const { state } = useCart();

  // Calculate total quantity across all items
  const totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    localStorage.removeItem("verifiedMobile");
    localStorage.removeItem("verifiedEmail");
    localStorage.removeItem("customerName");
    window.location.href = "/";
  };

  // Hide navigation on admin pages
  if (location.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="fixed top-0 right-0 p-4 flex gap-3 z-50 md:hidden bg-gradient-to-r from-white/80 to-white/90 backdrop-blur-sm rounded-bl-2xl shadow-lg">
      {verifiedMobile && (
        <>
          <Link href="/order-history">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 border-gray-200"
              title="Order History"
            >
              <ClipboardList className="h-4 w-4 text-gray-700" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 border-gray-200"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4 text-gray-700" />
          </Button>
        </>
      )}

      <Link href="/cart">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 border-gray-200 relative"
          title="Shopping Cart"
        >
          <ShoppingCart className="h-4 w-4 text-gray-700" />
          {totalQuantity > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center animate-in fade-in zoom-in duration-300 shadow-md">
              {totalQuantity}
            </span>
          )}
        </Button>
      </Link>
    </nav>
  );
}