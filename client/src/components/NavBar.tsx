import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ClipboardList } from "lucide-react";
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
    <nav className="fixed top-0 right-0 p-4 flex gap-2 z-50 md:hidden">
      {verifiedEmail && (
        <Link href={`/orders/${encodeURIComponent(verifiedEmail)}`}>
          <Button variant="outline" size="icon" className="rounded-full bg-white shadow-sm">
            <ClipboardList className="h-5 w-5" />
          </Button>
        </Link>
      )}

      <Link href="/cart">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-white shadow-sm relative"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalQuantity > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center animate-in fade-in duration-300">
              {totalQuantity}
            </span>
          )}
        </Button>
      </Link>
    </nav>
  );
}