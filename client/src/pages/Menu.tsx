import { useState, useMemo } from "react";
import { MenuItem } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Minus, Plus, Search, History } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Footer } from "@/components/ui/footer";
import { Logo } from "@/components/Logo";

export default function Menu() {
  const { state, dispatch } = useCart();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    vegOnly: false,
    nonVegOnly: false,
    bestSeller: false
  });
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, string[]>>({});
  const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);

  const getItemQuantity = (itemId: number, customizations:Record<string, string[]> = {}) => {
    return state.items.reduce((total, item) => {
      if (item.menuItem.id === itemId && JSON.stringify(item.customizations) === JSON.stringify(customizations)) {
        return total + item.quantity;
      }
      return total;
    }, 0);
  };

  const handleCustomizedAddToCart = () => {
    if (!selectedItem) return;

    dispatch({
      type: "ADD_ITEM",
      item: {
        menuItem: selectedItem,
        quantity,
        customizations: selectedCustomizations,
      },
    });

    toast({
      title: "Added to cart",
      description: `${selectedItem.name} has been added to your cart.`,
    });

    setSelectedItem(null);
    setQuantity(1);
    setSelectedCustomizations({});
    setIsCustomizationDialogOpen(false);
  };

  const findMatchingCartItem = (item: MenuItem, customizations: Record<string, string[]>) => {
    return state.items.find(cartItem => {
      if (cartItem.menuItem.id !== item.id) return false;
      return JSON.stringify(cartItem.customizations) === JSON.stringify(customizations);
    });
  };

  const updateQuantity = (item: MenuItem, newQuantity: number) => {
    if (newQuantity === 0) {
      dispatch({
        type: "REMOVE_ITEM",
        menuItemId: item.id,
      });
      toast({
        title: "Removed from cart",
        description: `${item.name} has been removed from your cart.`,
      });
    } else {
      if (item.customizations?.options?.length > 0) {
        setSelectedItem(item);
        setQuantity(newQuantity); 
        setSelectedCustomizations({});
        setIsCustomizationDialogOpen(true);
      } else {
        dispatch({
          type: "UPDATE_QUANTITY",
          menuItemId: item.id,
          quantity: newQuantity,
        });
      }
    }
  };

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const categorizedItems = useMemo(() => {
    if (!menuItems) return {};

    const filtered = menuItems.filter(item => {
      if (filters.vegOnly && !item.isVegetarian) return false;
      if (filters.nonVegOnly && item.isVegetarian) return false;
      if (filters.bestSeller && !item.isBestSeller) return false;
      if (searchQuery) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });

    return filtered.reduce((acc, item) => {
      const key = `${item.category}-${item.isVegetarian ? 'veg' : 'nonveg'}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems, filters, searchQuery]);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setSelectedCustomizations({});
  };

  const renderItemButton = (item: MenuItem) => {
    const quantity = getItemQuantity(item.id, {});

    if (!item.isAvailable) {
      return (
        <Button
          disabled
          className="min-w-[80px] bg-gray-300 text-gray-500 cursor-not-allowed"
        >
          UNAVAILABLE
        </Button>
      );
    }

    if (quantity === 0) {
      return (
        <Button
          onClick={() => {
            if (item.customizations?.options?.length > 0) {
              setSelectedItem(item);
              setQuantity(1);
              setSelectedCustomizations({});
              setIsCustomizationDialogOpen(true);
            } else {
              updateQuantity(item, 1);
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white min-w-[80px]"
        >
          ADD
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(item, Math.max(0, quantity - 1))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(item, quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  };


  if (isLoading) {
    return <div className="p-4">Loading menu...</div>;
  }

  const categoryOrder = ["Starters", "Main Course", "Rice and Biryani", "South Indian", "Fast Food", "Desserts"];

  return (
    <>
      <div className="container mx-auto px-4 pb-16 max-w-5xl">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 backdrop-blur py-4 -mx-4 px-4 md:hidden">
          <h1 className="text-2xl font-bold">Menu</h1>
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/order-history">
              <Button variant="outline" size="icon" className="relative">
                <History className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {state.items.length > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {state.items.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Menu</h1>
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/order-history">
              <Button variant="outline" className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Order History
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({state.items.length})
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search for dishes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={filters.vegOnly ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, vegOnly: !prev.vegOnly, nonVegOnly: false }))}
              className="rounded-full flex items-center gap-2 whitespace-nowrap"
            >
              <div className="w-4 h-4 border-2 border-green-600 p-0.5">
                <div className="w-full h-full rounded-full bg-green-600" />
              </div>
              <span className="text-sm">Veg</span>
            </Button>

            <Button
              variant={filters.nonVegOnly ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, nonVegOnly: !prev.nonVegOnly, vegOnly: false }))}
              className="rounded-full flex items-center gap-2 whitespace-nowrap"
            >
              <div className="w-4 h-4 border-2 border-red-600 p-0.5">
                <div className="w-full h-full rounded-full bg-red-600" />
              </div>
              <span className="text-sm">Non-Veg</span>
            </Button>

            <Button
              variant={filters.bestSeller ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, bestSeller: !prev.bestSeller }))}
              className="rounded-full whitespace-nowrap"
            >
              Best Seller
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {categoryOrder.map(category => {
            const vegItems = categorizedItems[`${category}-veg`] || [];
            const nonVegItems = categorizedItems[`${category}-nonveg`] || [];

            if (!vegItems.length && !nonVegItems.length) return null;

            return (
              <section key={category}>
                <h2 className="text-2xl font-bold mb-6">{category}</h2>

                {vegItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-green-600">
                      {category} (Veg)
                    </h3>
                    <div className="space-y-4">
                      {vegItems.map((item) => (
                        <Card key={item.id} className={`relative overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="w-full md:w-24 h-48 md:h-24 relative rounded-lg overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className={`w-full h-full object-cover ${!item.isAvailable ? 'grayscale' : ''}`}
                                />
                                <div className="absolute top-2 right-2 bg-white p-1 rounded-md shadow">
                                  <div className="w-4 h-4 border-2 border-green-600 p-0.5">
                                    <div className="w-full h-full rounded-full bg-green-600" />
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex flex-col h-full justify-between">
                                  <div>
                                    {item.isBestSeller && (
                                      <span className="text-[#ff645a] text-sm font-medium bg-[#fff3f3] px-2 py-0.5 rounded inline-block mb-2">
                                        ★ Bestseller
                                      </span>
                                    )}
                                    <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                                    <div className="text-xl font-bold mb-3">₹{Math.round(item.price)}</div>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Customizable</span>
                                    {renderItemButton(item)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {nonVegItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-red-600">
                      {category} (Non-Veg)
                    </h3>
                    <div className="space-y-4">
                      {nonVegItems.map((item) => (
                        <Card key={item.id} className={`relative overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="w-full md:w-24 h-48 md:h-24 relative rounded-lg overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className={`w-full h-full object-cover ${!item.isAvailable ? 'grayscale' : ''}`}
                                />
                                <div className="absolute top-2 right-2 bg-white p-1 rounded-md shadow">
                                  <div className="w-4 h-4 border-2 border-red-600 p-0.5">
                                    <div className="w-full h-full rounded-full bg-red-600" />
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex flex-col h-full justify-between">
                                  <div>
                                    {item.isBestSeller && (
                                      <span className="text-[#ff645a] text-sm font-medium bg-[#fff3f3] px-2 py-0.5 rounded inline-block mb-2">
                                        ★ Bestseller
                                      </span>
                                    )}
                                    <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                                    <div className="text-xl font-bold mb-3">₹{Math.round(item.price)}</div>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Customizable</span>
                                    {renderItemButton(item)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <Dialog open={isCustomizationDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
            setQuantity(1);
            setSelectedCustomizations({});
            setIsCustomizationDialogOpen(false);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedItem?.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {selectedItem?.customizations?.options.map((option, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="font-medium">{option.name}</h3>
                  <p className="text-sm text-gray-500">
                    Select {option.maxChoices === 1 ? 'one option' : `up to ${option.maxChoices} options`}
                  </p>
                  <RadioGroup
                    value={selectedCustomizations[option.name]?.[0] || ''}
                    onValueChange={(value) => {
                      setSelectedCustomizations(prev => ({
                        ...prev,
                        [option.name]: [value]
                      }));
                    }}
                  >
                    {option.choices.map((choice, choiceIndex) => (
                      <div key={choiceIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={choice} id={`${option.name}-${choice}`} />
                        <Label htmlFor={`${option.name}-${choice}`}>{choice}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleCustomizedAddToCart}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add Item | ₹{Math.round(selectedItem?.price || 0) * quantity}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </>
  );
}