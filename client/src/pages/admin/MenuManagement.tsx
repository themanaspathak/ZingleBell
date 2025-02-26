import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Pencil, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const customizationOptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  choices: z.array(z.string()).min(1, "At least one choice is required"),
  maxChoices: z.number().min(1, "Max choices must be at least 1")
});

const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number",
  }),
  isVegetarian: z.boolean().default(false),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(), //Added subcategory field
  imageUrl: z.string().min(1, "Image URL is required").url("Must be a valid URL"),
  isBestSeller: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  customizations: z.object({
    options: z.array(customizationOptionSchema)
  }).default({ options: [] })
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

export default function MenuManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newChoice, setNewChoice] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      isVegetarian: false,
      category: "",
      subcategory: "",
      imageUrl: "",
      isBestSeller: false,
      isAvailable: true,
      customizations: {
        options: []
      }
    },
  });

  const { data: menuItems, isLoading, error, refetch } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleSubmit = async (data: MenuItemFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting menu item:", data);

      const payload = {
        ...data,
        price: Number(data.price),
      };

      const endpoint = editingItem ? `/api/menu/${editingItem.id}` : "/api/menu";
      const method = editingItem ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save menu item");
      }

      const savedItem = await response.json();
      console.log("Submit response:", savedItem);

      // Invalidate and refetch menu items
      await queryClient.invalidateQueries({
        queryKey: ["/api/menu"],
        exact: true,
        refetchType: 'all'
      });

      // Ensure the menu items are refetched
      await refetch();

      toast({
        title: `Menu Item ${editingItem ? "Updated" : "Added"}`,
        description: `Successfully ${editingItem ? "updated" : "added"} ${data.name}`,
      });

      setIsAddDialogOpen(false);
      setEditingItem(null);
      form.reset();
    } catch (error: any) {
      console.error("Error submitting menu item:", error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingItem ? "update" : "add"} menu item. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;

    try {
      setIsSubmitting(true);
      console.log("Deleting menu item:", id);

      const response = await apiRequest(`/api/menu/${id}`, "DELETE");
      console.log("Delete response:", response);

      await refetch();
      await queryClient.invalidateQueries({
        queryKey: ["/api/menu"],
        exact: true,
        refetchType: 'all'
      });

      toast({
        title: "Menu Item Deleted",
        description: "Successfully deleted menu item",
      });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast({
        title: "Error",
        description: "Failed to delete menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      isVegetarian: item.isVegetarian,
      category: item.category,
      subcategory: item.subcategory || "", // Convert null to empty string
      imageUrl: item.imageUrl,
      isBestSeller: item.isBestSeller,
      isAvailable: item.isAvailable,
      customizations: item.customizations || { options: [] }
    });
    setIsAddDialogOpen(true);
  };

  const addCustomizationOption = () => {
    const currentOptions = form.getValues("customizations.options") || [];
    form.setValue("customizations.options", [
      ...currentOptions,
      { name: "", choices: [], maxChoices: 1 }
    ]);
  };

  const removeCustomizationOption = (index: number) => {
    const currentOptions = form.getValues("customizations.options");
    form.setValue(
      "customizations.options",
      currentOptions.filter((_, i) => i !== index)
    );
  };

  const addChoice = (optionIndex: number) => {
    if (!newChoice.trim()) return;
    const currentOptions = form.getValues("customizations.options");
    const updatedOptions = [...currentOptions];
    updatedOptions[optionIndex].choices = [...updatedOptions[optionIndex].choices, newChoice.trim()];
    form.setValue("customizations.options", updatedOptions);
    setNewChoice("");
  };

  const removeChoice = (optionIndex: number, choiceIndex: number) => {
    const currentOptions = form.getValues("customizations.options");
    const updatedOptions = [...currentOptions];
    updatedOptions[optionIndex].choices = updatedOptions[optionIndex].choices.filter(
      (_, i) => i !== choiceIndex
    );
    form.setValue("customizations.options", updatedOptions);
  };

  const categorizedItems = useMemo(() => {
    if (!menuItems) return {};
    return menuItems.reduce<Record<string, Record<string, MenuItem[]>>>((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          'Vegetarian': [],
          'Non-vegetarian': []
        };
      }
      const subcategory = item.isVegetarian ? 'Vegetarian' : 'Non-vegetarian';
      acc[item.category][subcategory].push(item);
      return acc;
    }, {});
  }, [menuItems]);

  const handleCategoryEdit = async (oldCategory: string, newCategory: string) => {
    if (!oldCategory || !newCategory || oldCategory === newCategory) return;

    try {
      setIsSubmitting(true);
      const itemsInCategory = menuItems?.filter(item => item.category === oldCategory) || [];

      for (const item of itemsInCategory) {
        await apiRequest(`/api/menu/${item.id}`, "PATCH", {
          ...item,
          category: newCategory
        });
      }

      await refetch();
      await queryClient.invalidateQueries({
        queryKey: ["/api/menu"],
        exact: true,
        refetchType: 'all'
      });

      toast({
        title: "Category Updated",
        description: `Successfully updated category from "${oldCategory}" to "${newCategory}"`,
      });

      setEditingCategory(null);
      setNewCategoryName("");
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (error) {
    return <div className="p-4 text-red-500">Error loading menu items. Please try again.</div>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  form.reset();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <ScrollArea className="max-h-[calc(90vh-120px)] px-1">
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4 px-3 pb-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter item name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter item description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" min="0" placeholder="Enter price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter category" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subcategory" // Added subcategory field
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcategory</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter subcategory" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter image URL" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isVegetarian"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormLabel>Vegetarian</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:!bg-green-500 data-[state=unchecked]:!bg-red-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isBestSeller"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormLabel>Best Seller</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isAvailable"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormLabel>Available</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Customization Options</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCustomizationOption}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>

                      {form.watch("customizations.options")?.map((option, optionIndex) => (
                        <div key={optionIndex} className="space-y-4 p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <FormField
                              control={form.control}
                              name={`customizations.options.${optionIndex}.name`}
                              render={({ field }) => (
                                <FormItem className="flex-1 mr-4">
                                  <FormLabel>Option Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Spice Level" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCustomizationOption(optionIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>

                          <FormField
                            control={form.control}
                            name={`customizations.options.${optionIndex}.maxChoices`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Choices</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <FormLabel>Choices</FormLabel>
                            <div className="flex flex-wrap gap-2">
                              {option.choices.map((choice, choiceIndex) => (
                                <div
                                  key={choiceIndex}
                                  className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
                                >
                                  <span>{choice}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-2"
                                    onClick={() => removeChoice(optionIndex, choiceIndex)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={newChoice}
                                onChange={(e) => setNewChoice(e.target.value)}
                                placeholder="Add new choice"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addChoice(optionIndex);
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                onClick={() => addChoice(optionIndex)}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </form>
                </ScrollArea>
                <div className="flex justify-end gap-2 pt-4 px-3 border-t mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingItem(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={form.handleSubmit(handleSubmit)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingItem ? "Update" : "Add"} Item
                  </Button>
                </div>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : menuItems?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No menu items found. Add some items to get started.
                </CardContent>
              </Card>
            ) : (
              Object.entries(categorizedItems).map(([category, subcategories]) => (
                <Collapsible
                  key={category}
                  defaultOpen={true}
                  open={expandedCategories[category]}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <div className="bg-muted/40 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary transition-colors">
                        {expandedCategories[category] ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        {editingCategory === category ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              className="h-8 w-[200px]"
                              placeholder="Enter new category name"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCategoryEdit(category, newCategoryName)}
                              disabled={isSubmitting}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCategory(null);
                                setNewCategoryName("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold">{category}</h2>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setNewCategoryName(category);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CollapsibleTrigger>
                      <Badge variant="secondary" className="text-sm px-2.5">
                        {Object.values(subcategories).reduce((sum, items) => sum + items.length, 0)} items
                      </Badge>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="space-y-4 mt-4">
                      {Object.entries(subcategories).map(([subcategory, items]) => (
                        items.length > 0 && (
                          <div key={`${category}-${subcategory}`} className="space-y-4">
                            <div className="flex items-center gap-2 pl-4">
                              <div className={`w-2 h-2 rounded-full ${
                                subcategory === 'Vegetarian' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <h3 className="text-sm font-medium text-muted-foreground">
                                {subcategory} ({items.length})
                              </h3>
                            </div>
                            {items.map((item) => (
                              <Card key={item.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-3 h-3 rounded-full ${
                                          item.isVegetarian ? "bg-green-500" : "bg-red-500"
                                        }`}
                                        title={item.isVegetarian ? "Vegetarian" : "Non-vegetarian"}
                                      />
                                      <h3 className="font-medium">{item.name}</h3>
                                      {!item.isAvailable && (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                          Unavailable
                                        </span>
                                      )}
                                      {item.isBestSeller && (
                                        <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded">
                                          Best Seller
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {item.description}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <span className="text-sm font-medium">₹{item.price}</span>
                                      <span className="text-sm text-gray-500">
                                        {item.category}
                                      </span>
                                    </div>
                                    {item.customizations?.options && item.customizations.options.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                          Customization Options: {item.customizations.options.map(opt => opt.name).join(", ")}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(item)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </AdminLayout>
  );
}