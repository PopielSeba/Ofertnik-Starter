import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  Plus, 
  Edit, 
  Copy, 
  DollarSign, 
  Trash2, 
  ArrowLeft, 
  AlertTriangle,
  Settings,
  Fuel,
  CheckCircle2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { EquipmentAdditionalManager } from "@/components/equipment-additional-manager";
import { ServiceCostsManager } from "@/components/service-costs-manager";

// Interfaces
interface EquipmentCategory {
  id: number;
  name: string;
  description: string | null;
}

interface Equipment {
  id: number;
  name: string;
  description?: string;
  model: string;
  power?: string;
  quantity: number;
  availableQuantity: number;
  category: EquipmentCategory;
  categoryId: number;
  fuelConsumption75?: number;
  dimensions?: string;
  weight?: string;
  engine?: string;
  alternator?: string;
  fuelTankCapacity?: number;
  pricing: EquipmentPricing[];
  isActive: boolean;
}

interface EquipmentPricing {
  id: number;
  equipmentId: number;
  periodStart: number;
  periodEnd?: number;
  pricePerDay: string;
  discountPercent: string;
}

// Schemas
const equipmentSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  description: z.string().optional(),
  model: z.string().min(1, "Model jest wymagany"),
  power: z.string().optional(),
  quantity: z.number().min(1, "Ilość musi być większa od 0"),
  availableQuantity: z.number().min(0, "Dostępna ilość nie może być ujemna"),
  categoryId: z.number().min(1, "Kategoria jest wymagana"),
  fuelConsumption75: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  engine: z.string().optional(),
  alternator: z.string().optional(),
  fuelTankCapacity: z.string().optional(),
});

const pricingSchema = z.object({
  equipmentId: z.number(),
  periodStart: z.number().min(1, "Początek okresu musi być większy od 0"),
  periodEnd: z.number().optional(),
  pricePerDay: z.string().min(1, "Cena jest wymagana"),
  discountPercent: z.string(),
});

export default function AdminEquipmentManagement() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [selectedEquipmentForPricing, setSelectedEquipmentForPricing] = useState<Equipment | null>(null);
  const [localPrices, setLocalPrices] = useState<Record<number, number>>({});
  const [localDiscounts, setLocalDiscounts] = useState<Record<number, number>>({});
  const [editingPricing, setEditingPricing] = useState<any>(null);
  const [selectedEquipmentCategory, setSelectedEquipmentCategory] = useState<string>("all");
  const [isEquipmentAdditionalDialogOpen, setIsEquipmentAdditionalDialogOpen] = useState(false);
  const [selectedEquipmentForAdditional, setSelectedEquipmentForAdditional] = useState<Equipment | null>(null);
  const [selectedEquipmentForServiceCosts, setSelectedEquipmentForServiceCosts] = useState<Equipment | null>(null);

  // Redirect if not authenticated or not admin/kierownik
  if (!isAuthenticated || ((user as any)?.role !== 'admin' && (user as any)?.role !== 'kierownik')) {
    return <Redirect to="/dashboard" />;
  }

  // Queries
  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: inactiveEquipment = [], isLoading: inactiveEquipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment/inactive"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<EquipmentCategory[]>({
    queryKey: ["/api/equipment-categories"],
  });

  // Forms
  const equipmentForm = useForm<z.infer<typeof equipmentSchema>>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      description: "",
      model: "",
      power: "",
      quantity: 1,
      availableQuantity: 1,
      categoryId: 0,
      fuelConsumption75: "",
      dimensions: "",
      weight: "",
      engine: "",
      alternator: "",
      fuelTankCapacity: "",
    },
  });

  const pricingForm = useForm<z.infer<typeof pricingSchema>>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      equipmentId: 0,
      periodStart: 1,
      periodEnd: undefined,
      pricePerDay: "",
      discountPercent: "0",
    },
  });

  // Get selected category details
  const selectedCategory = categories.find(cat => cat.id.toString() === selectedEquipmentCategory);
  const selectedCategoryName = selectedCategory?.name?.toLowerCase() || "";

  // Mutations
  const createEquipmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof equipmentSchema>) => {
      const response = await apiRequest("/api/equipment", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sukces",
        description: "Sprzęt został dodany pomyślnie",
      });
      setIsEquipmentDialogOpen(false);
      setSelectedEquipment(null);
      equipmentForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się dodać sprzętu",
        variant: "destructive",
      });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof equipmentSchema> }) => {
      const response = await apiRequest(`/api/equipment/${id}`, "PUT", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sukces",
        description: "Sprzęt został zaktualizowany pomyślnie",
      });
      setIsEquipmentDialogOpen(false);
      setSelectedEquipment(null);
      equipmentForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować sprzętu",
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/equipment/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/inactive"] });
      toast({
        title: "Sukces",
        description: "Sprzęt został oznaczony jako nieaktywny",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć sprzętu",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/equipment/${id}/permanent`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/inactive"] });
      toast({
        title: "Sukces",
        description: "Nieaktywny sprzęt został całkowicie usunięty wraz ze wszystkimi powiązanymi danymi",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się całkowicie usunąć nieaktywnego sprzętu",
        variant: "destructive",
      });
    },
  });

  const createPricingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof pricingSchema>) => {
      const response = await apiRequest("/api/equipment/pricing", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sukces",
        description: "Cennik został dodany pomyślnie",
      });
      setIsPricingDialogOpen(false);
      pricingForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się dodać cennika",
        variant: "destructive",
      });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { pricePerDay: string; discountPercent: string } }) => {
      const response = await apiRequest(`/api/equipment/pricing/${id}`, "PUT", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sukces",
        description: "Cennik został zaktualizowany pomyślnie",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować cennika",
        variant: "destructive",
      });
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/equipment/pricing/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sukces",
        description: "Cennik został usunięty pomyślnie",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć cennika",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleEditEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    const formData = {
      name: equipment.name || "",
      description: equipment.description || "",
      model: equipment.model || "",
      power: equipment.power || "",
      quantity: equipment.quantity || 1,
      availableQuantity: equipment.availableQuantity || 1,
      categoryId: equipment.category?.id || 23,
      fuelConsumption75: equipment.fuelConsumption75?.toString() || "",
      dimensions: equipment.dimensions || "",
      weight: equipment.weight || "",
      engine: equipment.engine || "",
      alternator: equipment.alternator || "",
      fuelTankCapacity: equipment.fuelTankCapacity?.toString() || "",
    };
    equipmentForm.reset(formData);
    setIsEquipmentDialogOpen(true);
  };

  const handleCopyEquipment = (equipment: Equipment) => {
    try {
      setSelectedEquipment(null);
      
      const formData = {
        name: `${equipment.name} (kopia)`,
        description: equipment.description || "",
        model: equipment.model || "",
        power: equipment.power || "",
        quantity: equipment.quantity,
        availableQuantity: equipment.quantity,
        categoryId: equipment.category.id,
        fuelConsumption75: equipment.fuelConsumption75 ? equipment.fuelConsumption75.toString() : "",
        dimensions: equipment.dimensions || "",
        weight: equipment.weight || "",
        engine: equipment.engine || "",
        alternator: equipment.alternator || "",
        fuelTankCapacity: equipment.fuelTankCapacity ? equipment.fuelTankCapacity.toString() : "",
      };
      
      equipmentForm.reset(formData);
      setIsEquipmentDialogOpen(true);
    } catch (error) {
      console.error("Błąd podczas kopiowania sprzętu:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się skopiować sprzętu",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEquipment = (id: number) => {
    if (confirm("Czy na pewno chcesz usunąć ten sprzęt?")) {
      deleteEquipmentMutation.mutate(id);
    }
  };

  const onSubmitEquipment = (data: z.infer<typeof equipmentSchema>) => {
    const processedData = {
      ...data,
      fuelConsumption75: data.fuelConsumption75 ? parseFloat(data.fuelConsumption75) : undefined,
      fuelTankCapacity: data.fuelTankCapacity ? parseFloat(data.fuelTankCapacity) : undefined,
    };
    
    if (selectedEquipment) {
      updateEquipmentMutation.mutate({ id: selectedEquipment.id, data: processedData });
    } else {
      createEquipmentMutation.mutate(processedData);
    }
  };

  const onSubmitPricing = (data: z.infer<typeof pricingSchema>) => {
    createPricingMutation.mutate(data);
  };

  const handleUpdatePrice = (pricingId: number, equipmentId: number) => {
    const newPrice = localPrices[pricingId];
    const newDiscount = localDiscounts[pricingId];
    
    if (newPrice !== undefined || newDiscount !== undefined) {
      const equipment = equipmentLoading ? [] : [...equipment];
      const currentPricing = equipment
        .find(eq => eq.id === equipmentId)
        ?.pricing.find(p => p.id === pricingId);
      
      if (currentPricing) {
        updatePricingMutation.mutate({
          id: pricingId,
          data: {
            pricePerDay: newPrice !== undefined ? newPrice.toString() : currentPricing.pricePerDay,
            discountPercent: newDiscount !== undefined ? newDiscount.toString() : currentPricing.discountPercent,
          }
        });
      }
    }
  };

  const filteredEquipment = equipment.filter((item) => 
    selectedEquipmentCategory === "all" || item.category.id.toString() === selectedEquipmentCategory
  );

  if (equipmentLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with back button */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          {(user as any)?.role === 'admin' && (
            <Link href="/admin-room">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do ADMIN ROOM
              </Button>
            </Link>
          )}
        </div>
        <div className="flex items-center space-x-3 mb-2">
          <Wrench className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold text-foreground">Zarządzanie sprzętem</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Dodawaj, edytuj i zarządzaj sprzętem oraz cennikami
        </p>
      </div>

      {/* Equipment Management Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Wrench className="w-5 h-5 mr-2" />
              Zarządzanie sprzętem
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={selectedEquipmentCategory} onValueChange={setSelectedEquipmentCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtruj po kategorii" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie kategorie</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isEquipmentDialogOpen} onOpenChange={(open) => {
                setIsEquipmentDialogOpen(open);
                if (!open) {
                  setSelectedEquipment(null);
                  equipmentForm.reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Sprzęt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedEquipment ? "Edytuj sprzęt" : "Dodaj sprzęt"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
                    <Form {...equipmentForm}>
                      <form onSubmit={equipmentForm.handleSubmit(onSubmitEquipment)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={equipmentForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nazwa</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={equipmentForm.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kategoria</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value ? field.value.toString() : ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Wybierz kategorię" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={equipmentForm.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={equipmentForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ilość</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={equipmentForm.control}
                          name="availableQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dostępna ilość</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={equipmentForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opis</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Technical specifications based on category */}
                      {selectedCategoryName && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-foreground">
                            Parametry techniczne ({selectedCategory?.name})
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {/* Power field for generators, heaters, AC units */}
                            {(selectedCategoryName.includes("agregat") || 
                              selectedCategoryName.includes("nagrzewnic") || 
                              selectedCategoryName.includes("klimat")) && (
                              <FormField
                                control={equipmentForm.control}
                                name="power"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Moc</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="np. 90.18 kW" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* Fuel consumption for equipment with engines */}
                            {(selectedCategoryName.includes("agregat") || 
                              selectedCategoryName.includes("nagrzewnic") || 
                              selectedCategoryName.includes("oświetlen") || 
                              selectedCategoryName.includes("pojazd")) && (
                              <>
                                <FormField
                                  control={equipmentForm.control}
                                  name="fuelConsumption75"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {selectedCategoryName.includes("oświetlen") ? "Spalanie paliwa (l/h)" : 
                                         selectedCategoryName.includes("pojazd") ? "Spalanie paliwa (l/100km)" :
                                         "Spalanie przy 75% obciążenia (l/h)"}
                                      </FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          step="0.1"
                                          placeholder={selectedCategoryName.includes("oświetlen") ? "np. 4.2" : 
                                                     selectedCategoryName.includes("pojazd") ? "np. 8.5" :
                                                     "np. 35.3"}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentForm.control}
                                  name="fuelTankCapacity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Pojemność zbiornika paliwa (l)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          placeholder={selectedCategoryName.includes("oświetlen") ? "np. 60" : 
                                                     selectedCategoryName.includes("pojazd") ? "np. 80" :
                                                     "np. 350"}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentForm.control}
                                  name="engine"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Silnik</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="np. VOLVO TAD734GE" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentForm.control}
                                  name="alternator"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Alternator</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="np. LEROY SOMER" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </>
                            )}

                            {/* Common fields for all equipment */}
                            <FormField
                              control={equipmentForm.control}
                              name="dimensions"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Wymiary (DxSxW mm)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="np. 3600x1100x1800" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={equipmentForm.control}
                              name="weight"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Waga (kg)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="np. 1850" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

                        <Button type="submit" disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}>
                          {createEquipmentMutation.isPending || updateEquipmentMutation.isPending 
                            ? "Zapisywanie..." 
                            : selectedEquipment ? "Zaktualizuj sprzęt" : "Dodaj sprzęt"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Ilość</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category.name}</Badge>
                    </TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span>{item.availableQuantity}/{item.quantity}</span>
                        {item.availableQuantity === item.quantity ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "destructive"}>
                        {item.isActive ? "Aktywny" : "Nieaktywny"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleEditEquipment(item)}
                          title="Edytuj sprzęt"
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleCopyEquipment(item)}
                          title="Kopiuj sprzęt"
                          className="text-blue-600 hover:text-blue-700 h-7 w-7 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setSelectedEquipmentForPricing(item);
                            setTimeout(() => {
                              const pricingSection = document.querySelector('[data-pricing-section]');
                              if (pricingSection) {
                                pricingSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }, 100);
                          }}
                          title="Edytuj cennik"
                          className="text-yellow-600 hover:text-yellow-700 h-7 w-7 p-0"
                        >
                          <DollarSign className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setSelectedEquipmentForAdditional(item);
                            setIsEquipmentAdditionalDialogOpen(true);
                          }}
                          title="Wyposażenie dodatkowe i akcesoria"
                          className="text-indigo-600 hover:text-indigo-700 h-7 w-7 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setSelectedEquipmentForServiceCosts(item);
                            setTimeout(() => {
                              const serviceCostsSection = document.querySelector('[data-service-costs-section]');
                              if (serviceCostsSection) {
                                serviceCostsSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }, 100);
                          }}
                          title="Koszty serwisu"
                          className="text-purple-600 hover:text-purple-700 h-7 w-7 p-0"
                        >
                          <Wrench className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDeleteEquipment(item.id)}
                          title="Usuń sprzęt"
                          className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Management Section */}
      <div className="mb-8" data-pricing-section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Edycja cenników</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {equipment
                  .filter((item) => selectedEquipmentCategory === "all" || item.category.id.toString() === selectedEquipmentCategory)
                  .map((item) => (
                  <Button
                    key={item.id}
                    variant={selectedEquipmentForPricing?.id === item.id ? "default" : "outline"}
                    onClick={() => {
                      setSelectedEquipmentForPricing(item);
                      setLocalPrices({});
                    }}
                    className="mb-2"
                  >
                    {item.name}
                  </Button>
                ))}
              </div>

              {selectedEquipmentForPricing && (
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedEquipmentForPricing.name} - zasilane paliwem:
                  </h3>
                  
                  {/* Warning for default pricing */}
                  {selectedEquipmentForPricing.pricing.some(p => p.pricePerDay === "100.00" && p.discountPercent === "0.00") && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                            Urządzenie wymaga konfiguracji cennika
                          </h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            To urządzenie ma domyślne ceny (100 zł/doba, 0% rabat). Zaktualizuj ceny i rabaty zgodnie z rzeczywistymi wartościami przed użyciem w ofertach.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Cennik według okresów wynajmu</h4>
                      <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              pricingForm.reset({
                                equipmentId: selectedEquipmentForPricing.id,
                                periodStart: 1,
                                periodEnd: undefined,
                                pricePerDay: "",
                                discountPercent: "0",
                              });
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Dodaj okres
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Dodaj cennik</DialogTitle>
                          </DialogHeader>
                          <Form {...pricingForm}>
                            <form onSubmit={pricingForm.handleSubmit(onSubmitPricing)} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={pricingForm.control}
                                  name="periodStart"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Początek okresu (dni)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          {...field} 
                                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={pricingForm.control}
                                  name="periodEnd"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Koniec okresu (dni)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          {...field} 
                                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                          placeholder="Puste dla 30+"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={pricingForm.control}
                                name="pricePerDay"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cena za dobę (PLN)</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="350.00" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={pricingForm.control}
                                name="discountPercent"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Rabat (%)</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="0" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={createPricingMutation.isPending}>
                                {createPricingMutation.isPending ? "Dodawanie..." : "Dodaj cennik"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Okres (dni)</TableHead>
                          <TableHead>Cena za dobę (PLN)</TableHead>
                          <TableHead>Rabat (%)</TableHead>
                          <TableHead>Akcje</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEquipmentForPricing.pricing
                          .sort((a, b) => a.periodStart - b.periodStart)
                          .map((pricing) => (
                          <TableRow key={pricing.id}>
                            <TableCell>
                              {pricing.periodStart} - {pricing.periodEnd || "30+"}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                defaultValue={pricing.pricePerDay}
                                onChange={(e) => {
                                  setLocalPrices(prev => ({
                                    ...prev,
                                    [pricing.id]: parseFloat(e.target.value) || 0
                                  }));
                                }}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                defaultValue={pricing.discountPercent}
                                onChange={(e) => {
                                  setLocalDiscounts(prev => ({
                                    ...prev,
                                    [pricing.id]: parseFloat(e.target.value) || 0
                                  }));
                                }}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdatePrice(pricing.id, selectedEquipmentForPricing.id)}
                                  disabled={updatePricingMutation.isPending}
                                >
                                  Aktualizuj
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Czy na pewno chcesz usunąć ten cennik?")) {
                                      deletePricingMutation.mutate(pricing.id);
                                    }
                                  }}
                                  disabled={deletePricingMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Costs Section */}
      <div className="mb-8" data-service-costs-section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="w-5 h-5" />
              <span>Koszty serwisu</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEquipmentForServiceCosts ? (
              <ServiceCostsManager
                key={selectedEquipmentForServiceCosts.id}
                equipmentId={selectedEquipmentForServiceCosts.id}
                equipmentName={selectedEquipmentForServiceCosts.name}
              />
            ) : (
              <p className="text-muted-foreground">
                Wybierz sprzęt z listy powyżej, aby zarządzać kosztami serwisu
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inactive Equipment Section */}
      {inactiveEquipment.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Nieaktywny sprzęt
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Sprzęt oznaczony jako nieaktywny. Możesz go bezpiecznie usunąć jeśli nie jest używany w wycenach.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveEquipment.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category?.name} • {item.model}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Czy na pewno chcesz całkowicie usunąć "${item.name}"? Ta operacja jest nieodwracalna i usunie wszystkie powiązane dane.`)) {
                          permanentDeleteEquipmentMutation.mutate(item.id);
                        }
                      }}
                      disabled={permanentDeleteEquipmentMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Usuń całkowicie
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment Additional and Accessories Management Dialog */}
      <Dialog open={isEquipmentAdditionalDialogOpen} onOpenChange={setIsEquipmentAdditionalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Wyposażenie dodatkowe i akcesoria - {selectedEquipmentForAdditional?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {selectedEquipmentForAdditional && (
              <EquipmentAdditionalManager
                key={selectedEquipmentForAdditional.id}
                equipmentId={selectedEquipmentForAdditional.id}
                equipmentName={selectedEquipmentForAdditional.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}