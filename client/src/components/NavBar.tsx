import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ScrollText } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function NavBar() {
  const verifiedEmail = localStorage.getItem("verifiedEmail");
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
      {verifiedEmail && (
        <Link href={`/orders/${encodeURIComponent(verifiedEmail)}`}>
          <Button 
            variant="outline" 
            size="icon" 
            className="relative rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 border-gray-200 group"
          >
            <ScrollText className="h-5 w-5 text-gray-700 group-hover:scale-110 transition-transform duration-200" />
            <span className="absolute inset-0 bg-primary/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-200" />
          </Button>
        </Link>
      )}

      <Link href="/cart">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 border-gray-200 relative group"
        >
          <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:scale-110 transition-transform duration-200" />
          {totalQuantity > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center animate-in fade-in zoom-in duration-300 shadow-md">
              {totalQuantity}
            </span>
          )}
          <span className="absolute inset-0 bg-primary/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-200" />
        </Button>
      </Link>
    </nav>
  );
}