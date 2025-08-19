import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Save, FileText, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QuoteItem from "@/components/quote-item";

const clientSchema = z.object({
  companyName: z.string().optional(),
  nip: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional().refine((email) => !email || z.string().email().safeParse(email).success, {
    message: "Nieprawidłowy format email",
  }),
  address: z.string().optional(),
}).refine(
  (data) => {
    // Require at least one field to be filled
    return data.companyName || data.contactPerson || data.phone || data.email;
  },
  {
    message: "Wypełnij przynajmniej jedno pole: nazwę firmy, osobę kontaktową, telefon lub email",
    path: ["companyName"],
  }
);

interface QuoteItemData {
  id: string;
  equipmentId: number;
  quantity: number;
  rentalPeriodDays: number;
  pricePerDay: number;
  discountPercent: number;
  totalPrice: number;
  notes?: string;
  // Fuel cost fields for generators (motohours-based)
  fuelConsumptionLH?: number;
  fuelPricePerLiter?: number;
  hoursPerDay?: number;
  totalFuelCost?: number;
  includeFuelCost?: boolean;
  
  // Fuel cost fields for vehicles (kilometers-based)
  fuelConsumptionPer100km?: number;
  kilometersPerDay?: number;
  calculationType?: 'motohours' | 'kilometers';

  // Installation cost fields
  includeInstallationCost?: boolean;
  installationDistanceKm?: number;
  numberOfTechnicians?: number;
  serviceRatePerTechnician?: number;
  travelRatePerKm?: number;
  totalInstallationCost?: number;

  // Disassembly cost fields
  includeDisassemblyCost?: boolean;
  disassemblyDistanceKm?: number;
  disassemblyNumberOfTechnicians?: number;
  disassemblyServiceRatePerTechnician?: number;
  disassemblyTravelRatePerKm?: number;
  totalDisassemblyCost?: number;

  // Travel/Service cost fields
  includeTravelServiceCost?: boolean;
  travelServiceDistanceKm?: number;
  travelServiceNumberOfTechnicians?: number;
  travelServiceServiceRatePerTechnician?: number;
  travelServiceTravelRatePerKm?: number;
  travelServiceNumberOfTrips?: number;
  totalTravelServiceCost?: number;

  // Additional equipment and accessories
  selectedAdditional?: number[]; // IDs of selected additional equipment
  selectedAccessories?: number[]; // IDs of selected accessories
  additionalCost?: number;
  accessoriesCost?: number;
  
  // Maintenance and service costs
  includeMaintenanceCost?: boolean;
  totalMaintenanceCost?: number;
  includeServiceItems?: boolean;
  serviceItem1Cost?: number;
  serviceItem2Cost?: number;
  serviceItem3Cost?: number;
  totalServiceItemsCost?: number;
}

interface EquipmentAdditional {
  id: number;
  equipmentId: number;
  type: "additional" | "accessories";
  name: string;
  price: string;
  position: number;
}

interface Equipment {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
  pricing: Array<{
    periodStart: number;
    periodEnd?: number;
    pricePerDay: string;
    discountPercent: string;
  }>;
  fuelConsumption75?: number; // l/h at 75% load for generators
  additionalEquipment?: EquipmentAdditional[];
}

interface PricingSchema {
  id: number;
  name: string;
  description: string | null;
  calculationMethod: string; // "first_day" or "progressive"
  isDefault: boolean;
  isActive: boolean;
}

interface CreateQuoteProps {
  editingQuote?: any;
}

export default function CreateQuote({ editingQuote }: CreateQuoteProps = {}) {
  const [quoteItems, setQuoteItems] = useState<QuoteItemData[]>([]);
  const [selectedPricingSchemaId, setSelectedPricingSchemaId] = useState<number | null>(null);
  
  // Initialize quote items when editing
  useEffect(() => {
    if (editingQuote && editingQuote.items && quoteItems.length === 0) {
      const initialItems = editingQuote.items.map((item: any) => ({
        id: item.id.toString(),
        equipmentId: item.equipment.id,
        quantity: item.quantity,
        rentalPeriodDays: item.rentalPeriodDays,
        pricePerDay: parseFloat(item.pricePerDay),
        discountPercent: parseFloat(item.discountPercent),
        totalPrice: parseFloat(item.totalPrice),
        notes: item.notes || "",
        fuelConsumptionLH: parseFloat(item.fuelConsumptionLH) || 0,
        fuelPricePerLiter: parseFloat(item.fuelPricePerLiter) || 6.50,
        hoursPerDay: item.hoursPerDay || 8,
        totalFuelCost: parseFloat(item.totalFuelCost) || 0,
        includeFuelCost: item.includeFuelCost || false,
        includeInstallationCost: item.includeTravelCost || false,
        installationDistanceKm: parseFloat(item.travelDistanceKm) || 0,
        numberOfTechnicians: item.numberOfTechnicians || 1,
        serviceRatePerTechnician: parseFloat(item.hourlyRatePerTechnician) || 150,
        travelRatePerKm: parseFloat(item.travelRatePerKm) || 1.15,
        totalInstallationCost: parseFloat(item.totalTravelCost) || 0,
        selectedAdditional: (() => {
          try {
            if (item.notes && item.notes.startsWith('{"selectedAdditional"')) {
              const notesData = JSON.parse(item.notes);
              return notesData.selectedAdditional || [];
            }
          } catch (e) {
            console.log('Error parsing notes for additional equipment:', e);
          }
          return [];
        })(),
        selectedAccessories: (() => {
          try {
            if (item.notes && item.notes.startsWith('{"selectedAdditional"')) {
              const notesData = JSON.parse(item.notes);
              return notesData.selectedAccessories || [];
            }
          } catch (e) {
            console.log('Error parsing notes for accessories:', e);
          }
          return [];
        })(),
        additionalCost: parseFloat(item.additionalCost) || 0,
        accessoriesCost: parseFloat(item.accessoriesCost) || 0,
        includeMaintenanceCost: item.includeMaintenanceCost || false,
        totalMaintenanceCost: parseFloat(item.totalMaintenanceCost) || 0,
        includeServiceItems: item.includeServiceItems || false,
        serviceItem1Cost: parseFloat(item.serviceItem1Cost) || 0,
        serviceItem2Cost: parseFloat(item.serviceItem2Cost) || 0,
        serviceItem3Cost: parseFloat(item.serviceItem3Cost) || 0,
        totalServiceItemsCost: parseFloat(item.totalServiceItemsCost) || 0,
        // Vehicle-specific fields
        fuelConsumptionPer100km: parseFloat(item.fuelConsumptionPer100km) || 0,
        kilometersPerDay: parseInt(item.kilometersPerDay) || 0,
        calculationType: item.calculationType || 'motohours',
      }));
      setQuoteItems(initialItems);
    }
  }, [editingQuote]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get equipment ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const equipmentIdFromUrl = urlParams.get('equipment');

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: pricingSchemas = [] } = useQuery<PricingSchema[]>({
    queryKey: ["/api/pricing-schemas"],
  });

  // Set default pricing schema when data loads
  useEffect(() => {
    if (pricingSchemas.length > 0 && selectedPricingSchemaId === null) {
      const defaultSchema = pricingSchemas.find(schema => schema.isDefault) || pricingSchemas[0];
      setSelectedPricingSchemaId(defaultSchema.id);
    }
  }, [pricingSchemas, selectedPricingSchemaId]);
  
  // Auto-add equipment when coming from equipment page
  useEffect(() => {
    if (equipmentIdFromUrl && equipment.length > 0 && quoteItems.length === 0) {
      const selectedEquipment = equipment.find(eq => eq.id === parseInt(equipmentIdFromUrl));
      if (selectedEquipment) {
        console.log('Auto-adding equipment:', selectedEquipment.name);
        const newItem: QuoteItemData = {
          id: Date.now().toString(),
          equipmentId: selectedEquipment.id,
          quantity: 1,
          rentalPeriodDays: 1,
          pricePerDay: 0,
          discountPercent: 0,
          totalPrice: 0,
          notes: "",
          fuelConsumptionLH: selectedEquipment.fuelConsumption75 || 0,
          fuelPricePerLiter: 6.50, // Default fuel price
          hoursPerDay: selectedEquipment.category.name === 'Klimatyzacje' ? 12 : 8,
          totalFuelCost: 0,
          includeFuelCost: selectedEquipment.category.name === 'Agregaty prądotwórcze' || selectedEquipment.category.name === 'Maszty oświetleniowe' || selectedEquipment.category.name === 'Pojazdy' || selectedEquipment.category.name === 'Klimatyzacje',
          // Vehicle-specific fields
          fuelConsumptionPer100km: 0,
          kilometersPerDay: 0,
          calculationType: selectedEquipment.category.name === 'Pojazdy' ? 'kilometers' : 'motohours',
          includeInstallationCost: false,
          installationDistanceKm: 0,
          numberOfTechnicians: 1,
          serviceRatePerTechnician: 150,
          travelRatePerKm: 1.15,
          totalInstallationCost: 0,
          selectedAdditional: [],
          selectedAccessories: [],
          additionalCost: 0,
          accessoriesCost: 0
        };
        setQuoteItems([newItem]);
        
        // Remove equipment param from URL after a delay to ensure state is updated
        setTimeout(() => {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }, 100);
      }
    }
  }, [equipmentIdFromUrl, equipment, quoteItems.length]);

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      companyName: "",
      nip: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  // Update form values when editing quote data is available
  useEffect(() => {
    if (editingQuote?.client) {
      form.reset({
        companyName: editingQuote.client.companyName || "",
        nip: editingQuote.client.nip || "",
        contactPerson: editingQuote.client.contactPerson || "",
        phone: editingQuote.client.phone || "",
        email: editingQuote.client.email || "",
        address: editingQuote.client.address || "",
      });
    }
  }, [editingQuote, form]);

  const createClientMutation = useMutation({
    mutationFn: async (clientData: z.infer<typeof clientSchema>) => {
      const response = await apiRequest("/api/clients", "POST", clientData);
      return response.json();
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (quoteData: any) => {
      const method = editingQuote ? "PUT" : "POST";
      const url = editingQuote ? `/api/quotes/${editingQuote.id}` : "/api/quotes";
      const response = await apiRequest(url, method, quoteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Sukces",
        description: editingQuote ? "Wycena została zaktualizowana pomyślnie" : "Wycena została utworzona pomyślnie",
      });
      if (!editingQuote) {
        // Reset form only for new quotes
        form.reset();
        setQuoteItems([]);
      }
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: editingQuote ? "Nie udało się zaktualizować wyceny" : "Nie udało się utworzyć wyceny",
        variant: "destructive",
      });
    },
  });

  const addQuoteItem = () => {
    const newItem: QuoteItemData = {
      id: Date.now().toString(),
      equipmentId: 0,
      quantity: 1,
      rentalPeriodDays: 1,
      pricePerDay: 0,
      discountPercent: 0,
      totalPrice: 0,
      notes: "",
      fuelConsumptionLH: 0,
      fuelPricePerLiter: 6.50,
      hoursPerDay: 8,
      totalFuelCost: 0,
      includeFuelCost: false,

      includeInstallationCost: false,
      installationDistanceKm: 0,
      numberOfTechnicians: 1,
      serviceRatePerTechnician: 150,
      travelRatePerKm: 1.15,
      totalInstallationCost: 0,
      selectedAdditional: [],
      selectedAccessories: [],
      additionalCost: 0,
      accessoriesCost: 0
    };
    setQuoteItems([...quoteItems, newItem]);
  };

  const removeQuoteItem = (id: string) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter(item => item.id !== id));
    }
  };

  const updateQuoteItem = (id: string, updatedItem: QuoteItemData) => {
    // Force complete deep copy using JSON serialization to ensure React detects all changes
    const deepCopy = JSON.parse(JSON.stringify(updatedItem));
    deepCopy._timestamp = Date.now(); // Add unique identifier to force re-render
    
    setQuoteItems(prevItems => {
      const newItems = prevItems.map(item => 
        item.id === id ? deepCopy : item
      );
      return newItems;
    });
  };

  const calculateTotals = () => {
    const totalNet = quoteItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const vatAmount = totalNet * 0.23;
    const totalGross = totalNet + vatAmount;
    
    return {
      totalNet,
      vatAmount,
      totalGross,
    };
  };

  const { totalNet, vatAmount, totalGross } = calculateTotals();

  const onSubmit = async (clientData: z.infer<typeof clientSchema>) => {
    if (quoteItems.length === 0) {
      toast({
        title: "Błąd",
        description: "Dodaj przynajmniej jedną pozycję do wyceny",
        variant: "destructive",
      });
      return;
    }

    if (quoteItems.some(item => item.equipmentId === 0)) {
      toast({
        title: "Błąd",
        description: "Wszystkie pozycje muszą mieć wybrany sprzęt",
        variant: "destructive",
      });
      return;
    }

    try {
      let clientId: number;
      
      if (editingQuote) {
        // Update existing client data
        const updateClientResponse = await apiRequest(`/api/clients/${editingQuote.client.id}`, "PUT", clientData);
        const updatedClient = await updateClientResponse.json();
        clientId = updatedClient.id;
      } else {
        // Create new client
        const client = await createClientMutation.mutateAsync(clientData);
        clientId = client.id;
      }
      
      // Create or update quote
      const quoteData = {
        clientId,
        status: "draft",
        totalNet: totalNet.toString(),
        vatRate: "23",
        totalGross: totalGross.toString(),
        notes: "",
      };

      const quote = await createQuoteMutation.mutateAsync(quoteData);
      
      if (editingQuote) {
        // Delete existing quote items first
        for (const existingItem of editingQuote.items) {
          await apiRequest(`/api/quote-items/${existingItem.id}`, "DELETE", null);
        }
      }
      
      // Create new quote items
      for (const item of quoteItems) {
        console.log("Creating quote item:", item);
        const itemData = {
          quoteId: quote.id,
          equipmentId: item.equipmentId,
          quantity: item.quantity,
          rentalPeriodDays: item.rentalPeriodDays,
          pricePerDay: item.pricePerDay.toString(),
          discountPercent: item.discountPercent.toString(),
          totalPrice: item.totalPrice.toString(),
          notes: item.notes || "",
          includeFuelCost: item.includeFuelCost,
          fuelConsumptionLH: item.fuelConsumptionLH?.toString() || "0",
          fuelPricePerLiter: item.fuelPricePerLiter?.toString() || "6.50",
          hoursPerDay: item.hoursPerDay || 8,
          totalFuelCost: (item.totalFuelCost || 0).toString(),
          // Vehicle-specific fields for kilometers-based calculation
          fuelConsumptionPer100km: item.fuelConsumptionPer100km?.toString() || "0",
          kilometersPerDay: item.kilometersPerDay || 0,
          calculationType: item.calculationType || "motohours",
          includeInstallationCost: item.includeInstallationCost,
          installationDistanceKm: (item.installationDistanceKm || 0).toString(),
          numberOfTechnicians: item.numberOfTechnicians || 1,
          serviceRatePerTechnician: (item.serviceRatePerTechnician || 150).toString(),
          travelRatePerKm: (item.travelRatePerKm || 1.15).toString(),
          totalInstallationCost: (item.totalInstallationCost || 0).toString(),
          // Disassembly cost fields
          includeDisassemblyCost: item.includeDisassemblyCost,
          disassemblyDistanceKm: (item.disassemblyDistanceKm || 0).toString(),
          disassemblyNumberOfTechnicians: item.disassemblyNumberOfTechnicians || 1,
          disassemblyServiceRatePerTechnician: (item.disassemblyServiceRatePerTechnician || 150).toString(),
          disassemblyTravelRatePerKm: (item.disassemblyTravelRatePerKm || 1.15).toString(),
          totalDisassemblyCost: (item.totalDisassemblyCost || 0).toString(),
          // Travel/Service cost fields
          includeTravelServiceCost: item.includeTravelServiceCost,
          travelServiceDistanceKm: (item.travelServiceDistanceKm || 0).toString(),
          travelServiceNumberOfTechnicians: item.travelServiceNumberOfTechnicians || 1,
          travelServiceServiceRatePerTechnician: (item.travelServiceServiceRatePerTechnician || 150).toString(),
          travelServiceTravelRatePerKm: (item.travelServiceTravelRatePerKm || 1.15).toString(),
          travelServiceNumberOfTrips: item.travelServiceNumberOfTrips || 1,
          totalTravelServiceCost: (item.totalTravelServiceCost || 0).toString(),
          includeMaintenanceCost: item.includeMaintenanceCost || false,
          totalMaintenanceCost: (item.totalMaintenanceCost || 0).toString(),
          includeServiceItems: item.includeServiceItems || false,
          serviceItem1Cost: (item.serviceItem1Cost || 0).toString(),
          serviceItem2Cost: (item.serviceItem2Cost || 0).toString(),
          serviceItem3Cost: (item.serviceItem3Cost || 0).toString(),
          totalServiceItemsCost: (item.totalServiceItemsCost || 0).toString(),
          // Additional equipment and accessories costs
          additionalCost: (item.additionalCost || 0).toString(),
          accessoriesCost: (item.accessoriesCost || 0).toString(),
        };
        
        console.log("Item data being sent:", itemData);
        const response = await apiRequest("/api/quote-items", "POST", itemData);
        console.log("Quote item created successfully:", response);
      }
      
      toast({
        title: "Sukces",
        description: editingQuote ? "Wycena została zaktualizowana pomyślnie" : "Wycena została utworzona pomyślnie",
        variant: "default",
      });
      
      // Navigate to the quote
      window.location.href = `/quotes/${quote.id}`;
      
    } catch (error) {
      console.error("Error saving quote:", error);
      toast({
        title: "Błąd",
        description: editingQuote ? "Nie udało się zaktualizować wyceny" : "Nie udało się utworzyć wyceny",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) {
      return "0,00 zł";
    }
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            {editingQuote ? "Edycja Wyceny" : "Tworzenie Nowej Wyceny"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {editingQuote 
              ? "Edytuj poniższe informacje, aby zaktualizować wycenę"
              : "Wypełnij poniższe informacje, aby utworzyć nową wycenę dla klienta"
            }
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Pricing Schema Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Schemat cenowy
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Wybierz schemat cenowy, który zostanie użyty do kalkulacji rabatów
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Schemat rabatowy</label>
                    <Select
                      value={selectedPricingSchemaId?.toString() || ""}
                      onValueChange={(value) => setSelectedPricingSchemaId(parseInt(value))}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Wybierz schemat cenowy" />
                      </SelectTrigger>
                      <SelectContent>
                        {pricingSchemas.map((schema) => (
                          <SelectItem key={schema.id} value={schema.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{schema.name}</span>
                              {schema.description && (
                                <span className="text-sm text-muted-foreground">{schema.description}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedPricingSchemaId && pricingSchemas.length > 0 && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Metoda naliczania rabatu:</h4>
                      <div className="text-sm">
                        {(() => {
                          const selectedSchema = pricingSchemas.find(schema => schema.id === selectedPricingSchemaId);
                          if (selectedSchema?.calculationMethod === "first_day") {
                            return (
                              <div className="space-y-1">
                                <p className="font-medium text-green-600">✓ Rabat od pierwszego dnia</p>
                                <p className="text-xs text-muted-foreground">
                                  Rabat jest naliczany od pierwszego dnia wynajmu zgodnie z indywidualnymi ustawieniami rabatu każdego urządzenia.
                                </p>
                              </div>
                            );
                          } else {
                            return (
                              <div className="space-y-1">
                                <p className="font-medium text-blue-600">✓ Rabat progowy</p>
                                <p className="text-xs text-muted-foreground">
                                  Rabat jest naliczany po osiągnięciu określonych progów dni zgodnie z indywidualnymi ustawieniami każdego urządzenia.
                                </p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informacje o kliencie</CardTitle>
                <p className="text-sm text-muted-foreground">Wypełnij przynajmniej jedno pole</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nazwa firmy</FormLabel>
                        <FormControl>
                          <Input placeholder="Wprowadź nazwę firmy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="nip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIP</FormLabel>
                        <FormControl>
                          <Input placeholder="123-456-78-90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Osoba kontaktowa</FormLabel>
                        <FormControl>
                          <Input placeholder="Imię i nazwisko" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input placeholder="+48 123 456 789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@firma.pl" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres</FormLabel>
                        <FormControl>
                          <Input placeholder="Ulica, miasto, kod pocztowy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quote Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Pozycje wyceny</CardTitle>
                  <Button type="button" onClick={addQuoteItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj pozycję
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quoteItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Brak pozycji w wycenie</p>
                      <Button type="button" onClick={addQuoteItem} className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Dodaj pierwszą pozycję
                      </Button>
                    </div>
                  ) : (
                    quoteItems.map((item) => (
                      <QuoteItem
                        key={item.id}
                        item={item}
                        equipment={equipment}
                        pricingSchema={pricingSchemas.find(schema => schema.id === selectedPricingSchemaId)}
                        onUpdate={(updatedItem) => updateQuoteItem(item.id, updatedItem)}
                        onRemove={() => removeQuoteItem(item.id)}
                        canRemove={quoteItems.length > 1}
                      />
                    ))
                  )}
                </div>

                {/* Summary */}
                {quoteItems.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-900">Wartość netto:</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(totalNet)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">VAT (23%):</span>
                        <span className="text-sm text-gray-600">{formatCurrency(vatAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-900">Wartość brutto:</span>
                        <span className="text-xl font-bold text-gray-900">{formatCurrency(totalGross)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Anuluj
              </Button>
              <Button type="button" variant="secondary">
                <Save className="w-4 h-4 mr-2" />
                Zapisz jako wersję roboczą
              </Button>
              <Button 
                type="submit" 
                disabled={createClientMutation.isPending || createQuoteMutation.isPending}
              >
                <FileText className="w-4 h-4 mr-2" />
                {createClientMutation.isPending || createQuoteMutation.isPending 
                  ? (editingQuote ? "Zapisywanie..." : "Tworzenie...") 
                  : (editingQuote ? "Zapisz zmiany" : "Utwórz wycenę")
                }
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
