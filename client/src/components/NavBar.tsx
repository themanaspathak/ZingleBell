import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ClipboardList, History } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function NavBar() {
  const mobileNumber = localStorage.getItem("mobileNumber");
  const [location] = useLocation();
  const { state } = useCart();

  // Calculate total quantity across all items
  const totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);

  // Hide navigation on admin pages
  if (location.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="fixed top-0 right-0 p-4 flex gap-3 z-50 md:hidden bg-gradient-to-r from-white/80 to-white/90 backdrop-blur-sm rounded-bl-2xl shadow-lg">
      {mobileNumber && (
        <Link href={`/orders/${mobileNumber}`}>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 border-gray-200"
          >
            <History className="h-5 w-5 text-gray-700" />
          </Button>
        </Link>
      )}

      <Link href="/cart">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 border-gray-200 relative"
        >
          <ShoppingCart className="h-5 w-5 text-gray-700" />
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