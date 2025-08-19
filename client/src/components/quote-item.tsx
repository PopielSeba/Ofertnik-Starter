import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Trash2, Fuel, Car, Wrench, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

  // Service items for heaters
  includeServiceItems?: boolean;
  serviceItem1Cost?: number;
  serviceItem2Cost?: number;
  serviceItem3Cost?: number;
  serviceItem4Cost?: number;
  totalServiceItemsCost?: number;

  // Maintenance/exploitation cost fields for generators
  includeMaintenanceCost?: boolean;
  maintenanceIntervalHours?: number;
  // Filter costs (6 filters)
  fuelFilter1Cost?: number;
  fuelFilter2Cost?: number;
  oilFilterCost?: number;
  airFilter1Cost?: number;
  airFilter2Cost?: number;
  engineFilterCost?: number;
  // Oil cost
  oilCost?: number;
  oilQuantityLiters?: number;
  // Service work cost
  serviceWorkHours?: number;
  serviceWorkRatePerHour?: number;
  // Service travel cost
  serviceTravelDistanceKm?: number;
  serviceTravelRatePerKm?: number;
  includeServiceTravelCost?: boolean;
  totalMaintenanceCost?: number;
  expectedMaintenanceHours?: number;

  // Additional equipment and accessories
  selectedAdditional?: number[]; // IDs of selected additional equipment
  selectedAccessories?: number[]; // IDs of selected accessories
  additionalCost?: number;
  accessoriesCost?: number;
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

interface QuoteItemProps {
  item: QuoteItemData;
  equipment: Equipment[];
  pricingSchema?: PricingSchema;
  onUpdate: (item: QuoteItemData) => void;
  onRemove: () => void;
  canRemove: boolean;
}



export default function QuoteItem({ item, equipment, pricingSchema, onUpdate, onRemove, canRemove }: QuoteItemProps) {
  // Helper functions for handling notes with hidden JSON data
  const getUserNotes = (notes: string): string => {
    try {
      if (notes.startsWith('{"selectedAdditional"')) {
        const notesData = JSON.parse(notes);
        return notesData.userNotes || "";
      }
      return notes;
    } catch (e) {
      return notes;
    }
  };
  
  const handleNotesChange = (userNotes: string) => {
    try {
      let newNotes;
      if (item.notes && item.notes.startsWith('{"selectedAdditional"')) {
        const notesData = JSON.parse(item.notes);
        newNotes = JSON.stringify({
          ...notesData,
          userNotes: userNotes
        });
      } else {
        // If no technical data exists yet, just save user notes directly
        newNotes = userNotes;
      }
      onUpdate({ ...item, notes: newNotes });
    } catch (e) {
      // If parsing fails, just save user notes directly
      onUpdate({ ...item, notes: userNotes });
    }
  };

  // Initialize selectedCategory based on current equipment
  const currentEquipment = equipment.find(eq => eq.id === item.equipmentId);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    currentEquipment ? currentEquipment.category.id : null
  );

  // Get unique categories
  const categories = equipment.reduce((acc, eq) => {
    if (!acc.find(cat => cat.id === eq.category.id)) {
      acc.push(eq.category);
    }
    return acc;
  }, [] as Array<{ id: number; name: string }>);

  // Get equipment for selected category
  const categoryEquipment = selectedCategory 
    ? equipment.filter(eq => eq.category.id === selectedCategory)
    : [];

  // Update selectedCategory when equipment changes from outside (auto-add from URL)
  useEffect(() => {
    if (item.equipmentId && equipment.length > 0) {
      const currentEquipment = equipment.find(eq => eq.id === item.equipmentId);
      if (currentEquipment && selectedCategory !== currentEquipment.category.id) {
        setSelectedCategory(currentEquipment.category.id);
      }
    }
  }, [item.equipmentId, equipment, selectedCategory]);

  // Get selected equipment
  const selectedEquipment = equipment.find(eq => eq.id === item.equipmentId);
  const isGenerator = selectedEquipment?.category.name === 'Agregaty prądotwórcze';
  const isLightingTower = selectedEquipment?.category.name === 'Maszty oświetleniowe';
  const isAirConditioner = selectedEquipment?.category.name === 'Klimatyzacje';
  const isVehicle = selectedEquipment?.category.name === 'Pojazdy';
  const hasMaintenanceCosts = isGenerator || isLightingTower || isAirConditioner;



  // Query to get additional equipment and accessories
  const { data: additionalEquipment = [] } = useQuery<EquipmentAdditional[]>({
    queryKey: ["/api/equipment", item.equipmentId, "additional"],
    enabled: !!item.equipmentId && item.equipmentId > 0,
  });

  // Query to get service costs for the selected equipment
  const { data: serviceCosts } = useQuery<any>({
    queryKey: ["/api/equipment", item.equipmentId, "service-costs"],
    enabled: !!item.equipmentId && item.equipmentId > 0,
  });

  // Query to get service items for the selected equipment
  const { data: serviceItems = [], refetch: refetchServiceItems } = useQuery<any[]>({
    queryKey: ["/api/equipment", item.equipmentId, "service-items"],
    enabled: !!item.equipmentId && item.equipmentId > 0,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  // Calculate additional equipment costs when data loads or selections change
  useEffect(() => {
    if (additionalEquipment && additionalEquipment.length > 0) {
      let shouldUpdate = false;
      let updatedItem = { ...item };
      
      // Calculate additional equipment costs (multiply by quantity)
      if (item.selectedAdditional && item.selectedAdditional.length > 0) {
        const currentAdditionalCost = item.selectedAdditional.reduce((sum, id) => {
          const additionalItem = additionalEquipment.find(add => add.id === id && add.type === 'additional');
          return sum + (additionalItem ? parseFloat(additionalItem.price) : 0);
        }, 0) * item.quantity;
        
        if (currentAdditionalCost !== (item.additionalCost || 0)) {
          updatedItem.additionalCost = currentAdditionalCost;
          shouldUpdate = true;
        }
      } else if ((item.additionalCost || 0) > 0) {
        // Reset cost if no items selected
        updatedItem.additionalCost = 0;
        shouldUpdate = true;
      }
      
      // Calculate accessories costs (multiply by quantity)
      if (item.selectedAccessories && item.selectedAccessories.length > 0) {
        const currentAccessoriesCost = item.selectedAccessories.reduce((sum, id) => {
          const accessoryItem = additionalEquipment.find(acc => acc.id === id && acc.type === 'accessories');
          return sum + (accessoryItem ? parseFloat(accessoryItem.price) : 0);
        }, 0) * item.quantity;
        
        if (currentAccessoriesCost !== (item.accessoriesCost || 0)) {
          updatedItem.accessoriesCost = currentAccessoriesCost;
          shouldUpdate = true;
        }
      } else if ((item.accessoriesCost || 0) > 0) {
        // Reset cost if no items selected
        updatedItem.accessoriesCost = 0;
        shouldUpdate = true;
      }
      
      if (shouldUpdate) {
        console.log('Updating additional costs:', {
          additionalCost: updatedItem.additionalCost,
          accessoriesCost: updatedItem.accessoriesCost,
          selectedAdditional: item.selectedAdditional,
          selectedAccessories: item.selectedAccessories
        });
        onUpdate(updatedItem);
      }
    }
  }, [additionalEquipment, item.selectedAdditional, item.selectedAccessories, item.additionalCost, item.accessoriesCost, item.quantity]);

  // Auto-populate service costs from database when service items load and costs are enabled but empty
  useEffect(() => {
    if (item.includeServiceItems && serviceItems && serviceItems.length > 0) {
      // Check if values need to be populated (all are 0)
      const hasEmptyValues = (item.serviceItem1Cost || 0) === 0 && (item.serviceItem2Cost || 0) === 0 && (item.serviceItem3Cost || 0) === 0 && (item.serviceItem4Cost || 0) === 0;
      
      if (hasEmptyValues) {
        const item1Cost = serviceItems[0]?.itemCost ? parseFloat(serviceItems[0].itemCost) : 0;
        const item2Cost = serviceItems[1]?.itemCost ? parseFloat(serviceItems[1].itemCost) : 0;
        const item3Cost = serviceItems[2]?.itemCost ? parseFloat(serviceItems[2].itemCost) : 0;
        const item4Cost = serviceItems[3]?.itemCost ? parseFloat(serviceItems[3].itemCost) : 0;
        
        console.log('Auto-populating service costs from database (useEffect):', { 
          serviceItemsLength: serviceItems.length,
          item1Cost, 
          item2Cost, 
          item3Cost,
          item4Cost,
          rawServiceItems: serviceItems,
          itemNames: serviceItems.map(item => item?.itemName)
        });
        
        if (item1Cost > 0 || item2Cost > 0 || item3Cost > 0 || item4Cost > 0) {
          onUpdate({
            ...item,
            serviceItem1Cost: item1Cost,
            serviceItem2Cost: item2Cost,
            serviceItem3Cost: item3Cost,
            serviceItem4Cost: item4Cost,
          });
        }
      }
    }
  }, [serviceItems, item.includeServiceItems]);

  // Calculate price when equipment, quantity, or period changes
  useEffect(() => {
    if (selectedEquipment && item.quantity > 0 && item.rentalPeriodDays > 0) {
      const pricing = getPricingForPeriod(selectedEquipment, item.rentalPeriodDays);
      if (pricing) {
        let pricePerDay = parseFloat(pricing.pricePerDay);
        let discountPercent = parseFloat(pricing.discountPercent);
        
        // If pricing schema is provided, use it to determine calculation method
        if (pricingSchema) {
          if (pricingSchema.calculationMethod === "first_day") {
            // For first_day method: Use highest available discount from day 1, but apply base price
            const basePricing = selectedEquipment.pricing.find(p => p.periodStart === 1);
            if (basePricing) {
              const basePrice = parseFloat(basePricing.pricePerDay);
              
              // Find the pricing tier that matches this rental period
              const applicablePricing = selectedEquipment.pricing
                .filter(p => item.rentalPeriodDays >= p.periodStart && 
                           (!p.periodEnd || item.rentalPeriodDays <= p.periodEnd))[0];
              
              if (applicablePricing && parseFloat(applicablePricing.discountPercent) > 0) {
                // Apply the available discount to base price from day 1
                discountPercent = parseFloat(applicablePricing.discountPercent);
                pricePerDay = basePrice * (1 - discountPercent / 100);
              } else {
                // No discount available, use base pricing
                discountPercent = parseFloat(basePricing.discountPercent);
                pricePerDay = basePrice;
              }
            }
          } else if (pricingSchema.calculationMethod === "progressive") {
            // For progressive method: Calculate price based on progressive tiers
            let totalCost = 0;
            let currentDay = 1;
            
            // Sort pricing tiers by period start
            const sortedPricing = selectedEquipment.pricing.sort((a, b) => a.periodStart - b.periodStart);
            
            while (currentDay <= item.rentalPeriodDays) {
              // Find which tier applies to the current day
              let applicableTier = sortedPricing[0]; // default to first tier
              
              for (const tier of sortedPricing) {
                if (currentDay >= tier.periodStart && 
                    (!tier.periodEnd || currentDay <= tier.periodEnd)) {
                  applicableTier = tier;
                  break;
                }
              }
              
              const tierPrice = parseFloat(applicableTier.pricePerDay);
              totalCost += tierPrice;
              currentDay++;
            }
            
            // Calculate average price per day and effective discount
            if (totalCost > 0) {
              pricePerDay = totalCost / item.rentalPeriodDays;
              const basePricing = sortedPricing[0];
              if (basePricing) {
                const basePrice = parseFloat(basePricing.pricePerDay);
                // Use stored discount percentage instead of calculating it
                // This ensures consistency with admin panel settings
                const applicableTierForDiscount = sortedPricing.find(tier => 
                  item.rentalPeriodDays >= tier.periodStart && 
                  (!tier.periodEnd || item.rentalPeriodDays <= tier.periodEnd)
                );
                if (applicableTierForDiscount) {
                  discountPercent = parseFloat(applicableTierForDiscount.discountPercent);
                } else {
                  discountPercent = ((basePrice - pricePerDay) / basePrice) * 100;
                }
              }
            }
          }
        }
        
        if (isNaN(pricePerDay) || isNaN(discountPercent)) {
          return;
        }
        
        const totalEquipmentPrice = pricePerDay * item.quantity * item.rentalPeriodDays;
        
        // Calculate fuel cost for different equipment types
        let fuelCost = 0;
        if (item.includeFuelCost && item.fuelPricePerLiter) {
          if (selectedEquipment?.category.name === 'Pojazdy') {
            // Vehicle fuel calculation: km-based
            if (item.fuelConsumptionPer100km && item.kilometersPerDay) {
              const totalKm = item.rentalPeriodDays * item.kilometersPerDay;
              const totalFuelNeeded = (totalKm / 100) * item.fuelConsumptionPer100km * item.quantity;
              fuelCost = totalFuelNeeded * item.fuelPricePerLiter;
              
              console.log('Vehicle fuel calculation:', {
                category: selectedEquipment.category.name,
                rentalDays: item.rentalPeriodDays,
                kilometersPerDay: item.kilometersPerDay,
                totalKm,
                fuelConsumptionPer100km: item.fuelConsumptionPer100km,
                quantity: item.quantity,
                fuelPricePerLiter: item.fuelPricePerLiter,
                totalFuelNeeded,
                fuelCost
              });
            }
          } else {
            // Engine equipment fuel calculation: hour-based (generators, lighting towers, etc.)
            if (item.fuelConsumptionLH && item.hoursPerDay) {
              const totalHours = item.rentalPeriodDays * item.hoursPerDay;
              const totalFuelNeeded = totalHours * item.fuelConsumptionLH * item.quantity;
              fuelCost = totalFuelNeeded * item.fuelPricePerLiter;
              
              console.log('Engine equipment fuel calculation:', {
                category: selectedEquipment?.category.name || 'Unknown',
                rentalDays: item.rentalPeriodDays,
                hoursPerDay: item.hoursPerDay,
                totalHours,
                fuelConsumptionLH: item.fuelConsumptionLH,
                quantity: item.quantity,
                fuelPricePerLiter: item.fuelPricePerLiter,
                totalFuelNeeded,
                fuelCost
              });
            }
          }
        }

        // Calculate installation cost
        let installationCost = 0;
        if (item.includeInstallationCost) {
          // Travel cost (round trip) - kilometers should not be multiplied by technicians
          const travelCost = (item.installationDistanceKm || 0) * (item.travelRatePerKm || 1.15);
          // Service cost (per technician)
          const serviceCost = (item.numberOfTechnicians || 1) * (item.serviceRatePerTechnician || 150);
          installationCost = travelCost + serviceCost;
        }

        // Calculate disassembly cost
        let disassemblyCost = 0;
        if (item.includeDisassemblyCost) {
          // Travel cost (round trip) - kilometers should not be multiplied by technicians
          const travelCost = (item.disassemblyDistanceKm || 0) * (item.disassemblyTravelRatePerKm || 1.15);
          // Service cost (per technician)
          const serviceCost = (item.disassemblyNumberOfTechnicians || 1) * (item.disassemblyServiceRatePerTechnician || 150);
          disassemblyCost = travelCost + serviceCost;
        }

        // Calculate travel/service cost
        let travelServiceCost = 0;
        if (item.includeTravelServiceCost) {
          // Travel cost (round trip) - kilometers should not be multiplied by technicians
          const travelCost = (item.travelServiceDistanceKm || 0) * (item.travelServiceTravelRatePerKm || 1.15);
          // Service cost (per technician)
          const serviceCost = (item.travelServiceNumberOfTechnicians || 1) * (item.travelServiceServiceRatePerTechnician || 150);
          // Total cost per trip
          const costPerTrip = travelCost + serviceCost;
          // Multiply by number of trips
          travelServiceCost = costPerTrip * (item.travelServiceNumberOfTrips || 1);
        }

        // Maintenance costs removed per user request

        // Additional equipment and accessories cost (already multiplied by quantity in useEffect)
        const additionalCost = item.additionalCost || 0;
        const accessoriesCost = item.accessoriesCost || 0;
        
        // Calculate service items cost - only include if service items are enabled
        let serviceItemsCost = 0;
        if (item.includeServiceItems) {
          // Calculate service cost based on operating hours and service intervals
          let totalServiceCost = 0;
          
          // Calculate total service cost proportionally based on usage
          // Only use service items - work hours are already included in service items
          const totalServiceItemsCost = (item.serviceItem1Cost || 0) + (item.serviceItem2Cost || 0) + (item.serviceItem3Cost || 0) + ((item as any).serviceItem4Cost || 0);
          
          console.log('Service Items Debug:', {
            serviceItem1Cost: item.serviceItem1Cost,
            serviceItem2Cost: item.serviceItem2Cost,
            serviceItem3Cost: item.serviceItem3Cost,
            serviceItem4Cost: (item as any).serviceItem4Cost,
            totalServiceItemsCost,
            equipmentName: selectedEquipment?.name,
            manualSum: (item.serviceItem1Cost || 0) + (item.serviceItem2Cost || 0) + (item.serviceItem3Cost || 0) + ((item as any).serviceItem4Cost || 0),
            expectedSum: 2048 + 800 + 2937.82
          });
          
          if (serviceCosts && selectedEquipment && totalServiceItemsCost > 0) {
            const isGenerator = selectedEquipment.category.name === 'Agregaty prądotwórcze';
            const isLightingTower = selectedEquipment.category.name === 'Maszty oświetleniowe';
            const isVehicle = selectedEquipment.category.name === 'Pojazdy';
            
            if (isGenerator || isLightingTower) {
              // For engine equipment - use motohour intervals from database
              const serviceIntervalMotohours = parseInt((serviceCosts as any).serviceIntervalMotohours) || 500;
              const hoursPerDay = item.hoursPerDay || 8;
              const expectedMotohours = item.rentalPeriodDays * hoursPerDay;
              
              // Calculate proportional service cost based on actual usage vs interval
              const proportionFactor = expectedMotohours / serviceIntervalMotohours;
              totalServiceCost = totalServiceItemsCost * proportionFactor * item.quantity;
              

            } else if (isVehicle) {
              // For vehicles - use kilometer intervals
              const serviceIntervalKm = parseInt((serviceCosts as any).serviceIntervalKm) || 15000;
              const dailyKm = item.kilometersPerDay || 100;
              const expectedKm = item.rentalPeriodDays * dailyKm;
              
              // Calculate proportional service cost based on actual usage vs interval
              const proportionFactor = expectedKm / serviceIntervalKm;
              totalServiceCost = totalServiceItemsCost * proportionFactor * item.quantity;
              
              console.log('Vehicle Service Cost Calculation:', {
                categoryName: selectedEquipment.category.name,
                equipmentName: selectedEquipment.name,
                totalServiceItemsCost,
                serviceItem1Cost: item.serviceItem1Cost,
                serviceItem2Cost: item.serviceItem2Cost,
                serviceItem3Cost: item.serviceItem3Cost,
                serviceItem4Cost: (item as any).serviceItem4Cost,
                serviceIntervalKm,
                dailyKm,
                rentalDays: item.rentalPeriodDays,
                expectedKm,
                proportionFactor,
                quantity: item.quantity,
                finalCost: totalServiceCost,
                note: 'Check if all service items are included'
              });
            } else {
              // For other equipment (nagrzewnice, klimatyzacje, etc.) - use yearly intervals (365 days)
              const serviceIntervalMonths = parseInt((serviceCosts as any).serviceIntervalMonths) || 12;
              
              // For yearly service interval (12 months), calculate based on actual usage
              if (serviceIntervalMonths === 12) {
                // Calculate based on actual hours vs standard yearly hours
                const hoursPerDay = item.hoursPerDay || 8;
                const expectedHours = item.rentalPeriodDays * hoursPerDay;
                const standardYearlyHours = 365 * 12; // Standard 12 hours per day for full year (100%)
                
                // Proportional to actual usage vs standard yearly usage
                const proportionFactor = expectedHours / standardYearlyHours;
                totalServiceCost = totalServiceItemsCost * proportionFactor * item.quantity;
                console.log('Yearly Service Cost (12 months):', {
                  categoryName: selectedEquipment.category.name,
                  equipmentName: selectedEquipment.name,
                  serviceIntervalMonths,
                  totalServiceItemsCost,
                  rentalDays: item.rentalPeriodDays,
                  hoursPerDay,
                  expectedHours,
                  standardYearlyHours,
                  proportionFactor,
                  quantity: item.quantity,
                  finalCost: totalServiceCost,
                  note: 'Cost based on actual hours vs standard yearly hours (365 × 8h)'
                });
              } else {
                // For other intervals, calculate proportionally
                const hoursPerDay = item.hoursPerDay || 8;
                const expectedHours = item.rentalPeriodDays * hoursPerDay;
                const serviceIntervalHours = 365 * hoursPerDay;
                const proportionFactor = expectedHours / serviceIntervalHours;
                totalServiceCost = totalServiceItemsCost * proportionFactor * item.quantity;
              }
            }
          } else {
            // No service cost data or no service items - use base cost multiplied by quantity
            totalServiceCost = totalServiceItemsCost * item.quantity;
          }
          
          serviceItemsCost = totalServiceCost;
        } else {
          serviceItemsCost = 0;
        }
        
        // Total price (maintenance costs removed per user request)
        const totalPrice = totalEquipmentPrice + fuelCost + installationCost + disassemblyCost + travelServiceCost + serviceItemsCost + additionalCost + accessoriesCost;
        




        onUpdate({
          ...item,
          pricePerDay,
          discountPercent,
          totalPrice,
          totalFuelCost: fuelCost,
          totalInstallationCost: installationCost,
          totalDisassemblyCost: disassemblyCost,
          totalTravelServiceCost: travelServiceCost,
          totalMaintenanceCost: 0,
          totalServiceItemsCost: serviceItemsCost,
          additionalCost,
          accessoriesCost,
        });
      }
    }
  }, [
    item.equipmentId, 
    item.quantity, 
    item.rentalPeriodDays, 
    item.includeFuelCost, 
    item.fuelConsumptionLH, 
    item.fuelPricePerLiter, 
    item.hoursPerDay,
    item.fuelConsumptionPer100km,
    item.kilometersPerDay,
    item.includeInstallationCost, 
    item.installationDistanceKm, 
    item.travelRatePerKm,
    item.numberOfTechnicians,
    item.serviceRatePerTechnician,
    item.includeDisassemblyCost,
    item.disassemblyDistanceKm,
    item.disassemblyTravelRatePerKm,
    item.disassemblyNumberOfTechnicians,
    item.disassemblyServiceRatePerTechnician,
    item.includeTravelServiceCost,
    item.travelServiceDistanceKm,
    item.travelServiceTravelRatePerKm,
    item.travelServiceNumberOfTechnicians,
    item.travelServiceServiceRatePerTechnician,
    item.travelServiceNumberOfTrips,
    item.includeServiceItems,
    item.serviceItem1Cost,
    item.serviceItem2Cost, 
    item.serviceItem3Cost,
    (item as any).serviceItem4Cost,
    item.additionalCost,
    item.accessoriesCost,
    selectedEquipment,
    pricingSchema,
    serviceCosts,
  ]);

  const getPricingForPeriod = (equipment: Equipment, days: number) => {
    // Sort pricing by periodStart to ensure we get the correct tier
    const sortedPricing = equipment.pricing.sort((a, b) => a.periodStart - b.periodStart);
    
    // Find the appropriate pricing tier based on days
    for (const pricing of sortedPricing) {
      if (!pricing.periodEnd) {
        // This is the last tier (e.g., 30+ days)
        if (days >= pricing.periodStart) {
          return pricing;
        }
      } else {
        // This is a bounded tier (e.g., 1-2 days, 3-7 days, etc.)
        if (days >= pricing.periodStart && days <= pricing.periodEnd) {
          return pricing;
        }
      }
    }
    
    // Fallback: return the first pricing tier if no match found
    return sortedPricing[0];
  };

  const handleCategoryChange = (categoryId: string) => {
    const catId = parseInt(categoryId);
    setSelectedCategory(catId);
    // Reset equipment selection when category changes
    onUpdate({
      ...item,
      equipmentId: 0,
      pricePerDay: 0,
      discountPercent: 0,
      totalPrice: 0,
    });
  };

  const handleEquipmentChange = (equipmentId: string) => {
    const eqId = parseInt(equipmentId);
    const equipment = categoryEquipment.find(eq => eq.id === eqId);
    
    if (equipment) {
      // Set the category based on selected equipment
      setSelectedCategory(equipment.category.id);
      
      // Auto-fill fuel consumption and maintenance costs for generators, lighting towers, and heaters
      let fuelData = {};
      if (equipment.category.name === 'Agregaty prądotwórcze' || equipment.category.name === 'Maszty oświetleniowe' || equipment.category.name === 'Nagrzewnice' || equipment.category.name === 'Klimatyzacje') {
        fuelData = {
          includeFuelCost: true,
          fuelConsumptionLH: equipment.fuelConsumption75 || 0,
          fuelPricePerLiter: 6.50, // Default fuel price PLN/liter
          hoursPerDay: equipment.category.name === 'Klimatyzacje' ? 12 : 8,
          totalFuelCost: 0,
          // Maintenance costs removed per user request
        };
      }
      
      onUpdate({
        ...item,
        equipmentId: eqId,
        pricePerDay: 0,
        discountPercent: 0,
        totalPrice: 0,
        ...fuelData
      });
    } else {
      onUpdate({
        ...item,
        equipmentId: eqId,
        pricePerDay: 0,
        discountPercent: 0,
        totalPrice: 0,
      });
    }
  };

  const handleQuantityChange = (quantity: string) => {
    const qty = parseInt(quantity) || 1;
    onUpdate({
      ...item,
      quantity: qty,
    });
  };

  const handlePeriodChange = (days: string) => {
    const period = parseInt(days) || 1;
    onUpdate({
      ...item,
      rentalPeriodDays: period,
    });
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

  // updateMaintenanceCost function removed per user request

  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Kategoria</label>
            <Select value={selectedCategory?.toString() || ""} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Sprzęt</label>
            <Select 
              value={item.equipmentId.toString()} 
              onValueChange={handleEquipmentChange}
              disabled={!selectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCategory ? "Wybierz sprzęt" : "Najpierw wybierz kategorię"} />
              </SelectTrigger>
              <SelectContent>
                {categoryEquipment.map((equipment) => (
                  <SelectItem key={equipment.id} value={equipment.id.toString()}>
                    {equipment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Ilość</label>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Okres wynajmu (dni)</label>
            <Input
              type="number"
              min="1"
              max="365"
              value={item.rentalPeriodDays}
              onChange={(e) => handlePeriodChange(e.target.value)}
              placeholder="1"
              className="text-center"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {pricingSchema?.calculationMethod === "first_day" 
                ? `Rabat ${item.discountPercent}% (od 1. dnia)`
                : `Rabat ${item.discountPercent}%`
              }
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Cena netto</label>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-foreground">
                {formatCurrency(item.totalPrice)}
              </span>
              {canRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Rabat: {item.discountPercent}%
            </p>
          </div>
        </div>

        {/* Fuel Cost Calculation for Generators, Lighting Towers, Heaters, and Vehicles */}
        {selectedEquipment && (selectedEquipment.category.name === 'Agregaty prądotwórcze' || selectedEquipment.category.name === 'Maszty oświetleniowe' || selectedEquipment.category.name === 'Nagrzewnice' || selectedEquipment.category.name === 'Pojazdy') && (
          <div className="mt-4">
            <Separator className="my-4" />
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="includeFuelCost" 
                checked={item.includeFuelCost || false}
                onCheckedChange={(checked) => 
                  onUpdate({ 
                    ...item, 
                    includeFuelCost: checked as boolean,
                    totalFuelCost: checked ? item.totalFuelCost : 0
                  })
                }
              />
              <label htmlFor="includeFuelCost" className="text-sm font-medium text-foreground flex items-center">
                <Fuel className="w-4 h-4 mr-2" />
                Uwzględnij koszty paliwa
              </label>
            </div>
            
            {/* Advisory text for fuel-related equipment */}
            {selectedEquipment && (selectedEquipment.category.name === 'Agregaty prądotwórcze' || selectedEquipment.category.name === 'Maszty oświetleniowe' || selectedEquipment.category.name === 'Nagrzewnice') && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mb-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-600 dark:text-blue-400 mt-0.5">💡</div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Porada:</strong> W przypadku konieczności tankowania urządzeń przez pracownika, może wystąpić konieczność jego dojazdu z innej lokalizacji - uwzględnij te koszty np. w "kosztach dojazdu / serwisu"
                  </div>
                </div>
              </div>
            )}
            
            {item.includeFuelCost && (
              <div className="bg-muted/50 p-4 rounded-lg">
                {/* Show different inputs based on equipment category */}
                {selectedEquipment.category.name === 'Pojazdy' ? (
                  // Vehicle fuel calculation (kilometers-based)
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Zużycie paliwa (l/100km)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="np. 8.5"
                        value={item.fuelConsumptionPer100km || ""}
                        onChange={(e) => {
                          const consumption = parseFloat(e.target.value) || 0;
                          const days = item.rentalPeriodDays;
                          const kmPerDay = item.kilometersPerDay || 0;
                          const fuelPrice = item.fuelPricePerLiter || 6.50;
                          const totalKm = days * kmPerDay;
                          const totalFuelCost = (totalKm / 100) * consumption * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            fuelConsumptionPer100km: consumption,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'kilometers'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Kilometry dziennie
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="np. 50"
                        value={item.kilometersPerDay || ""}
                        onChange={(e) => {
                          const kmPerDay = parseInt(e.target.value) || 0;
                          const days = item.rentalPeriodDays;
                          const consumption = item.fuelConsumptionPer100km || 0;
                          const fuelPrice = item.fuelPricePerLiter || 6.50;
                          const totalKm = days * kmPerDay;
                          const totalFuelCost = (totalKm / 100) * consumption * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            kilometersPerDay: kmPerDay,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'kilometers'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Cena paliwa (zł/l)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="6.50"
                        value={item.fuelPricePerLiter || ""}
                        onChange={(e) => {
                          const fuelPrice = parseFloat(e.target.value) || 0;
                          const days = item.rentalPeriodDays;
                          const kmPerDay = item.kilometersPerDay || 0;
                          const consumption = item.fuelConsumptionPer100km || 0;
                          const totalKm = days * kmPerDay;
                          const totalFuelCost = (totalKm / 100) * consumption * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            fuelPricePerLiter: fuelPrice,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'kilometers'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Łączny koszt paliwa
                      </label>
                      <Input 
                        value={formatCurrency(item.totalFuelCost || 0)}
                        disabled
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.rentalPeriodDays * (item.kilometersPerDay || 0)} km całkowity przebieg
                      </p>
                    </div>
                  </div>
                ) : (
                  // Standard fuel calculation (motohours-based) for generators, lighting towers, heaters
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Zużycie paliwa (l/h)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="np. 35.3"
                        value={item.fuelConsumptionLH?.toString() || ""}
                        onChange={(e) => {
                          const consumption = parseFloat(e.target.value) || 0;
                          const hours = item.hoursPerDay || 8;
                          const days = item.rentalPeriodDays;
                          const fuelPrice = item.fuelPricePerLiter || 6.50;
                          const totalFuelCost = consumption * hours * days * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            fuelConsumptionLH: consumption,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'motohours'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Godziny pracy dziennie
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        placeholder="8"
                        value={item.hoursPerDay || ""}
                        onChange={(e) => {
                          const hours = parseInt(e.target.value) || 8;
                          const consumption = item.fuelConsumptionLH || 0;
                          const days = item.rentalPeriodDays;
                          const fuelPrice = item.fuelPricePerLiter || 6.50;
                          const totalFuelCost = consumption * hours * days * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            hoursPerDay: hours,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'motohours'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Cena paliwa (zł/l)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="6.50"
                        value={item.fuelPricePerLiter?.toString() || ""}
                        onChange={(e) => {
                          const fuelPrice = parseFloat(e.target.value) || 0;
                          const consumption = item.fuelConsumptionLH || 0;
                          const hours = item.hoursPerDay || 8;
                          const days = item.rentalPeriodDays;
                          const totalFuelCost = consumption * hours * days * fuelPrice;
                          onUpdate({ 
                            ...item, 
                            fuelPricePerLiter: fuelPrice,
                            totalFuelCost: totalFuelCost,
                            calculationType: 'motohours'
                          });
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Łączny koszt paliwa
                      </label>
                      <Input 
                        value={formatCurrency(item.totalFuelCost || 0)}
                        disabled
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.rentalPeriodDays * (item.hoursPerDay || 8)} mth łącznie
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Installation Cost Section */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox 
              id="includeInstallationCost" 
              checked={item.includeInstallationCost || false}
              onCheckedChange={(checked) => {
                let totalCost = 0;
                if (checked) {
                  const travelCost = (item.installationDistanceKm || 0) * (item.travelRatePerKm || 1.15);
                  const serviceCost = (item.numberOfTechnicians || 1) * (item.serviceRatePerTechnician || 150);
                  totalCost = travelCost + serviceCost;
                }
                onUpdate({ 
                  ...item, 
                  includeInstallationCost: checked as boolean,
                  installationDistanceKm: checked ? (item.installationDistanceKm || 0) : 0,
                  numberOfTechnicians: checked ? (item.numberOfTechnicians || 1) : 1,
                  serviceRatePerTechnician: checked ? (item.serviceRatePerTechnician || 150) : 150,
                  travelRatePerKm: checked ? (item.travelRatePerKm || 1.15) : 1.15,
                  totalInstallationCost: totalCost
                });
              }}
            />
            <label htmlFor="includeInstallationCost" className="text-sm font-medium text-foreground flex items-center">
              <Car className="w-4 h-4 mr-2" />
              Uwzględnij koszty montażu
            </label>
          </div>
          
          {item.includeInstallationCost && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ilość kilometrów (tam i z powrotem)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={item.installationDistanceKm || ""}
                    onChange={(e) => {
                      const distance = parseFloat(e.target.value) || 0;
                      const travelCost = distance * (item.travelRatePerKm || 1.15);
                      const serviceCost = (item.numberOfTechnicians || 1) * (item.serviceRatePerTechnician || 150);
                      const totalCost = travelCost + serviceCost;
                      onUpdate({
                        ...item,
                        installationDistanceKm: distance,
                        totalInstallationCost: totalCost
                      });
                    }}
                    placeholder="np. 50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ilość techników
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.numberOfTechnicians || 1}
                    onChange={(e) => {
                      const technicians = parseInt(e.target.value) || 1;
                      const travelCost = (item.installationDistanceKm || 0) * (item.travelRatePerKm || 1.15);
                      const serviceCost = technicians * (item.serviceRatePerTechnician || 150);
                      const totalCost = travelCost + serviceCost;
                      onUpdate({
                        ...item,
                        numberOfTechnicians: technicians,
                        totalInstallationCost: totalCost
                      });
                    }}
                    placeholder="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Koszt usługi jednego pracownika (zł)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceRatePerTechnician || 150}
                    onChange={(e) => {
                      const serviceRate = parseFloat(e.target.value) || 150;
                      const travelCost = (item.installationDistanceKm || 0) * (item.travelRatePerKm || 1.15);
                      const serviceCost = (item.numberOfTechnicians || 1) * serviceRate;
                      const totalCost = travelCost + serviceCost;
                      onUpdate({
                        ...item,
                        serviceRatePerTechnician: serviceRate,
                        totalInstallationCost: totalCost
                      });
                    }}
                    placeholder="150.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Stawka za km (zł)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.travelRatePerKm || 1.15}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 1.15;
                      const travelCost = (item.installationDistanceKm || 0) * rate;
                      const serviceCost = (item.numberOfTechnicians || 1) * (item.serviceRatePerTechnician || 150);
                      const totalCost = travelCost + serviceCost;
                      onUpdate({
                        ...item,
                        travelRatePerKm: rate,
                        totalInstallationCost: totalCost
                      });
                    }}
                    placeholder="1.15"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Koszt montażu
                  </label>
                  <div className="text-lg font-medium text-foreground bg-background p-2 rounded border">
                    {formatCurrency(item.totalInstallationCost || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    W obie strony
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Disassembly Cost Section */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox 
              id="includeDisassemblyCost" 
              checked={item.includeDisassemblyCost || false}
              onCheckedChange={(checked) => {
                let totalCost = 0;
                if (checked) {
                  const travelCost = (item.disassemblyDistanceKm || 0) * (item.disassemblyTravelRatePerKm || 1.15);
                  const serviceCost = (item.disassemblyNumberOfTechnicians || 1) * (item.disassemblyServiceRatePerTechnician || 150);
                  totalCost = travelCost + serviceCost;
                }
                onUpdate({ 
                  ...item, 
                  includeDisassemblyCost: checked as boolean,
                  disassemblyDistanceKm: checked ? (item.disassemblyDistanceKm || 0) : 0,
                  disassemblyNumberOfTechnicians: checked ? (item.disassemblyNumberOfTechnicians || 1) : 1,
                  disassemblyServiceRatePerTechnician: checked ? (item.disassemblyServiceRatePerTechnician || 150) : 150,
                  disassemblyTravelRatePerKm: checked ? (item.disassemblyTravelRatePerKm || 1.15) : 1.15,
                  totalDisassemblyCost: totalCost
                });
              }}
            />
            <label htmlFor="includeDisassemblyCost" className="text-sm font-medium text-foreground flex items-center">
              <Car className="w-4 h-4 mr-2" />
              Uwzględnij koszty demontażu
            </label>
          </div>
          
          {item.includeDisassemblyCost && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ilość kilometrów (tam i z powrotem)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={item.disassemblyDistanceKm || ""}
                    onChange={(e) => {
                      const distance = parseFloat(e.target.value) || 0;
                      const travelCost = distance * (item.disassemblyTravelRatePerKm || 1.15);
                      const serviceCost = (item.disassemblyNumberOfTechnicians || 1) * (item.disassemblyServiceRatePerTechnician || 150);
                      const totalCost = travelCost + serviceCost;
                      onUpdate({
                        ...item,
                        disassemblyDistanceKm: distance,
                        totalDisassemblyCost: totalCost
                      });
                    }}
                    placeholder="np. 50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ilość techników
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.disassemblyNumberOfTechnicians || 1}
                    onChange={(e) => {
                      const technicians = parseInt(e.target.value) || 1;
                      const travelCost = (item.disassemblyDistanceKm || 0) * (item.disassemblyTravelRatePerKm || 1.15);
                      const serviceCost = technicians * (item.disassemblyServiceRatePerTechnician || 150);
                      const totalCost = travelCost + serviceCost;
                      onUpdate({
                        ...item,
                        disassemblyNumberOfTechnicians: technicians,
                        totalDisassemblyCost: totalCost
                      });
                    }}
                    placeholder="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Koszt usługi jednego pracownika (zł)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.disassemblyServiceRatePerTechnician || 150}
                    onChange={(e) => {
                      const serviceRate = parseFloat(e.target.value) || 150;
                      const travelCost = (item.disassemblyDistanceKm || 0) * (item.disassemblyTravelRatePerKm || 1.15);
                      const serviceCost = (item.disassemblyNumberOfTechnicians || 1) * serviceRate;
                      const totalCost = travelCost + serviceCost;
                      onUpdate({
                        ...item,
                        disassemblyServiceRatePerTechnician: serviceRate,
                        totalDisassemblyCost: totalCost
                      });
                    }}
                    placeholder="150.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Stawka za km (zł)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.disassemblyTravelRatePerKm || 1.15}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 1.15;
                      const travelCost = (item.disassemblyDistanceKm || 0) * rate;
                      const serviceCost = (item.disassemblyNumberOfTechnicians || 1) * (item.disassemblyServiceRatePerTechnician || 150);
                      const totalCost = travelCost + serviceCost;
                      onUpdate({
                        ...item,
                        disassemblyTravelRatePerKm: rate,
                        totalDisassemblyCost: totalCost
                      });
                    }}
                    placeholder="1.15"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Koszt demontażu
                  </label>
                  <div className="text-lg font-medium text-foreground bg-background p-2 rounded border">
                    {formatCurrency(item.totalDisassemblyCost || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    W obie strony
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Travel/Service Cost Section */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox 
              id="includeTravelServiceCost" 
              checked={item.includeTravelServiceCost || false}
              onCheckedChange={(checked) => {
                let totalCost = 0;
                if (checked) {
                  const travelCost = (item.travelServiceDistanceKm || 0) * (item.travelServiceTravelRatePerKm || 1.15);
                  const serviceCost = (item.travelServiceNumberOfTechnicians || 1) * (item.travelServiceServiceRatePerTechnician || 150);
                  const costPerTrip = travelCost + serviceCost;
                  totalCost = costPerTrip * (item.travelServiceNumberOfTrips || 1);
                }
                onUpdate({ 
                  ...item, 
                  includeTravelServiceCost: checked as boolean,
                  travelServiceDistanceKm: checked ? (item.travelServiceDistanceKm || 0) : 0,
                  travelServiceNumberOfTechnicians: checked ? (item.travelServiceNumberOfTechnicians || 1) : 1,
                  travelServiceServiceRatePerTechnician: checked ? (item.travelServiceServiceRatePerTechnician || 150) : 150,
                  travelServiceTravelRatePerKm: checked ? (item.travelServiceTravelRatePerKm || 1.15) : 1.15,
                  travelServiceNumberOfTrips: checked ? (item.travelServiceNumberOfTrips || 1) : 1,
                  totalTravelServiceCost: totalCost
                });
              }}
            />
            <label htmlFor="includeTravelServiceCost" className="text-sm font-medium text-foreground flex items-center">
              <Car className="w-4 h-4 mr-2" />
              Uwzględnij koszt dojazdu / serwis
            </label>
          </div>
          
          {item.includeTravelServiceCost && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ilość kilometrów (tam i z powrotem)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={item.travelServiceDistanceKm || ""}
                    onChange={(e) => {
                      const distance = parseFloat(e.target.value) || 0;
                      const travelCost = distance * (item.travelServiceTravelRatePerKm || 1.15);
                      const serviceCost = (item.travelServiceNumberOfTechnicians || 1) * (item.travelServiceServiceRatePerTechnician || 150);
                      const costPerTrip = travelCost + serviceCost;
                      const totalCost = costPerTrip * (item.travelServiceNumberOfTrips || 1);
                      onUpdate({
                        ...item,
                        travelServiceDistanceKm: distance,
                        totalTravelServiceCost: totalCost
                      });
                    }}
                    placeholder="np. 50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ilość techników
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.travelServiceNumberOfTechnicians || 1}
                    onChange={(e) => {
                      const technicians = parseInt(e.target.value) || 1;
                      const travelCost = (item.travelServiceDistanceKm || 0) * (item.travelServiceTravelRatePerKm || 1.15);
                      const serviceCost = technicians * (item.travelServiceServiceRatePerTechnician || 150);
                      const costPerTrip = travelCost + serviceCost;
                      const totalCost = costPerTrip * (item.travelServiceNumberOfTrips || 1);
                      onUpdate({
                        ...item,
                        travelServiceNumberOfTechnicians: technicians,
                        totalTravelServiceCost: totalCost
                      });
                    }}
                    placeholder="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Koszt usługi jednego pracownika (zł)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.travelServiceServiceRatePerTechnician || 150}
                    onChange={(e) => {
                      const serviceRate = parseFloat(e.target.value) || 150;
                      const travelCost = (item.travelServiceDistanceKm || 0) * (item.travelServiceTravelRatePerKm || 1.15);
                      const serviceCost = (item.travelServiceNumberOfTechnicians || 1) * serviceRate;
                      const costPerTrip = travelCost + serviceCost;
                      const totalCost = costPerTrip * (item.travelServiceNumberOfTrips || 1);
                      onUpdate({
                        ...item,
                        travelServiceServiceRatePerTechnician: serviceRate,
                        totalTravelServiceCost: totalCost
                      });
                    }}
                    placeholder="150.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Stawka za km (zł)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.travelServiceTravelRatePerKm || 1.15}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 1.15;
                      const travelCost = (item.travelServiceDistanceKm || 0) * rate;
                      const serviceCost = (item.travelServiceNumberOfTechnicians || 1) * (item.travelServiceServiceRatePerTechnician || 150);
                      const costPerTrip = travelCost + serviceCost;
                      const totalCost = costPerTrip * (item.travelServiceNumberOfTrips || 1);
                      onUpdate({
                        ...item,
                        travelServiceTravelRatePerKm: rate,
                        totalTravelServiceCost: totalCost
                      });
                    }}
                    placeholder="1.15"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ilość wyjazdów
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.travelServiceNumberOfTrips || 1}
                    onChange={(e) => {
                      const trips = parseInt(e.target.value) || 1;
                      const travelCost = (item.travelServiceDistanceKm || 0) * (item.travelServiceTravelRatePerKm || 1.15);
                      const serviceCost = (item.travelServiceNumberOfTechnicians || 1) * (item.travelServiceServiceRatePerTechnician || 150);
                      const costPerTrip = travelCost + serviceCost;
                      const totalCost = costPerTrip * trips;
                      onUpdate({
                        ...item,
                        travelServiceNumberOfTrips: trips,
                        totalTravelServiceCost: totalCost
                      });
                    }}
                    placeholder="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Koszt dojazdu / serwis
                  </label>
                  <div className="text-lg font-medium text-foreground bg-background p-2 rounded border">
                    {formatCurrency(item.totalTravelServiceCost || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    W obie strony
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Service Items Enable Section (for all equipment categories) */}
        {selectedEquipment && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="includeServiceItems" 
                checked={item.includeServiceItems || false}
                onCheckedChange={(checked) => {
                  let updatedItem = { ...item };
                  
                  if (checked) {
                    // Load values from database if available
                    if (serviceItems && (serviceItems as any[]).length > 0) {
                      const item1Cost = (serviceItems as any[])[0]?.itemCost ? parseFloat((serviceItems as any[])[0].itemCost) : 0;
                      const item2Cost = (serviceItems as any[])[1]?.itemCost ? parseFloat((serviceItems as any[])[1].itemCost) : 0;
                      const item3Cost = (serviceItems as any[])[2]?.itemCost ? parseFloat((serviceItems as any[])[2].itemCost) : 0;
                      const item4Cost = (serviceItems as any[])[3]?.itemCost ? parseFloat((serviceItems as any[])[3].itemCost) : 0;
                      
                      console.log('Loading service costs on enable:', { 
                        item1Cost, 
                        item2Cost, 
                        item3Cost, 
                        serviceItemsData: serviceItems,
                        firstItem: (serviceItems as any[])[0],
                        secondItem: (serviceItems as any[])[1],
                        firstItemName: (serviceItems as any[])[0]?.itemName,
                        secondItemName: (serviceItems as any[])[1]?.itemName,
                        allItemNames: (serviceItems as any[]).map(item => item?.itemName)
                      });
                      
                      // Refetch latest data from server
                      refetchServiceItems();
                      
                      updatedItem = {
                        ...updatedItem,
                        serviceItem1Cost: item1Cost,
                        serviceItem2Cost: item2Cost,
                        serviceItem3Cost: item3Cost,
                        serviceItem4Cost: item4Cost,
                      };
                    } else {
                      // No data available yet, set to 0
                      updatedItem = {
                        ...updatedItem,
                        serviceItem1Cost: 0,
                        serviceItem2Cost: 0,
                        serviceItem3Cost: 0,
                        serviceItem4Cost: 0,
                      };
                    }
                    
                    // Don't calculate totalServiceItemsCost here - let the useEffect calculate it proportionally
                    updatedItem.totalServiceItemsCost = 0; // Will be calculated by useEffect
                  } else {
                    updatedItem.totalServiceItemsCost = 0;
                  }
                  
                  updatedItem.includeServiceItems = checked as boolean;
                  onUpdate(updatedItem);
                }}
              />
              <label htmlFor="includeServiceItems" className="text-sm font-medium text-foreground">
                Uwzględnij koszty serwisowe
              </label>
            </div>
          </div>
        )}

        {/* Service Items Configuration Section (for all equipment) */}
        {selectedEquipment && item.includeServiceItems && (
          <div className="mt-4">
            <div className="space-y-4 bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium text-foreground">Koszty serwisowe</h4>
              </div>

              {/* Operating Hours Per Day Configuration - show different fields for vehicles vs equipment */}
              <div className="mb-4 p-3 bg-background rounded border">
                <h5 className="text-sm font-medium text-foreground mb-2">
                  {isVehicle ? 'Założenia eksploatacji pojazdu' : 'Założenia pracy urządzenia'}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isVehicle ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Kilometry dziennie
                        </label>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          value={item.kilometersPerDay || 100}
                          onChange={(e) => {
                            const km = parseFloat(e.target.value) || 100;
                            onUpdate({
                              ...item,
                              kilometersPerDay: km
                            });
                          }}
                          placeholder="100"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Przewidywane kilometry dziennie
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Łączne kilometry
                        </label>
                        <div className="text-lg font-medium text-foreground bg-muted p-2 rounded border">
                          {(item.rentalPeriodDays * (item.kilometersPerDay || 100)).toFixed(0)} km
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.rentalPeriodDays} dni × {item.kilometersPerDay || 100} km/dzień
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Godziny pracy dziennie
                        </label>
                        <Input
                          type="number"
                          step="0.5"
                          min="1"
                          max="24"
                          value={item.hoursPerDay || 8}
                          onChange={(e) => {
                            const hours = parseFloat(e.target.value) || 8;
                            onUpdate({
                              ...item,
                              hoursPerDay: hours
                            });
                          }}
                          placeholder="8"
                        />

                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Łączne motogodziny
                        </label>
                        <div className="text-lg font-medium text-foreground bg-muted p-2 rounded border">
                          {(item.rentalPeriodDays * (item.hoursPerDay || 8)).toFixed(0)}h
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.rentalPeriodDays} dni × {item.hoursPerDay || 8}h/dzień
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {serviceItems?.[0]?.itemName || 'Pozycja serwisowa 1'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceItem1Cost || 0}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      // Don't update totalServiceItemsCost here - let useEffect calculate it proportionally
                      onUpdate({
                        ...item,
                        serviceItem1Cost: cost
                      });
                    }}
                    placeholder={serviceItems[0]?.itemCost ? parseFloat(serviceItems[0].itemCost).toFixed(2) : "0.00"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {serviceItems?.[1]?.itemName || 'Pozycja serwisowa 2'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceItem2Cost || 0}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      // Don't update totalServiceItemsCost here - let useEffect calculate it proportionally
                      onUpdate({
                        ...item,
                        serviceItem2Cost: cost
                      });
                    }}
                    placeholder={serviceItems[1]?.itemCost ? parseFloat(serviceItems[1].itemCost).toFixed(2) : "0.00"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {serviceItems?.[2]?.itemName || 'Pozycja serwisowa 3'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceItem3Cost || 0}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      // Don't update totalServiceItemsCost here - let useEffect calculate it proportionally
                      onUpdate({
                        ...item,
                        serviceItem3Cost: cost
                      });
                    }}
                    placeholder={serviceItems[2]?.itemCost ? parseFloat(serviceItems[2].itemCost).toFixed(2) : "0.00"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {serviceItems?.[3]?.itemName || 'Pozycja serwisowa 4'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.serviceItem4Cost || 0}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      onUpdate({
                        ...item,
                        serviceItem4Cost: cost
                      });
                    }}
                    placeholder={serviceItems[3]?.itemCost ? parseFloat(serviceItems[3].itemCost).toFixed(2) : "0.00"}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Całkowity koszt serwisowy
                </label>
                <div className="text-lg font-medium text-foreground bg-background p-2 rounded border">
                  {formatCurrency(item.totalServiceItemsCost || 0)}
                </div>
                
                {/* Service calculation details */}
                {serviceCosts && (
                  <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                    <h5 className="font-medium mb-2">Szczegóły kalkulacji serwisu:</h5>
                    <div className="text-xs text-muted-foreground mb-2 italic">
                      Bazowe założenie:<br />
                      Nagrzewnice i Klimatyzacje - Serwis standardowy przy 12h pracy dziennie przez 365 dni = 100% kosztów serwisowych.<br />
                      Agregaty i Maszty Oświetleniowe - przyjęty interwał zgodny z zaleceniami producenta.
                    </div>
                    <div className="space-y-1 text-muted-foreground">
                      {isVehicle ? (
                        <>
                          <div>Interwał serwisu: {serviceCosts?.serviceIntervalKm || 15000} km</div>
                          <div>Przewidywane kilometry: {item.rentalPeriodDays * (item.kilometersPerDay || 100)} km</div>
                          <div>Proporcja użytkowania: {((item.rentalPeriodDays * (item.kilometersPerDay || 100)) / (serviceCosts?.serviceIntervalKm || 15000) * 100).toFixed(2)}%</div>
                          <div>Koszt serwisu na okres: {formatCurrency(item.totalServiceItemsCost || 0)}</div>
                        </>
                      ) : isGenerator || isLightingTower ? (
                        <>
                          <div>Interwał serwisu: {serviceCosts?.serviceIntervalMotohours || 500} mth (motogodzin)</div>
                          <div>Przewidywane motogodziny: {item.rentalPeriodDays * (item.hoursPerDay || 8)} mth</div>
                          <div>Proporcja użytkowania: {((item.rentalPeriodDays * (item.hoursPerDay || 8)) / (serviceCosts?.serviceIntervalMotohours || 500) * 100).toFixed(2)}%</div>
                          <div>Koszt serwisu na okres: {formatCurrency(item.totalServiceItemsCost || 0)}</div>
                        </>
                      ) : (
                        <>
                          <div>Interwał serwisu: {serviceCosts?.serviceIntervalMonths || 12} miesięcy</div>
                          <div>Przewidywane godziny pracy: {item.rentalPeriodDays * (item.hoursPerDay || 8)} h</div>
                          <div>Proporcja użytkowania: {(() => {
                            const serviceIntervalMonths = serviceCosts?.serviceIntervalMonths || 12;
                            if (serviceIntervalMonths === 12) {
                              // For yearly service interval, show proportion based on actual hours vs standard yearly hours
                              const expectedHours = item.rentalPeriodDays * (item.hoursPerDay || 8);
                              const standardYearlyHours = 365 * 12; // Standard 12 hours per day for full year (100%)
                              return (expectedHours / standardYearlyHours * 100).toFixed(2);
                            } else {
                              // For other intervals, use the original calculation
                              return ((item.rentalPeriodDays * (item.hoursPerDay || 8)) / (serviceIntervalMonths * 30 * (item.hoursPerDay || 8)) * 100).toFixed(2);
                            }
                          })()}%</div>
                          <div>Koszt serwisu na okres: {formatCurrency(item.totalServiceItemsCost || 0)}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Maintenance costs section removed per user request */}
        {false && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="includeMaintenanceCost" 
                checked={item.includeMaintenanceCost || false}
                onCheckedChange={(checked) => {
                  let totalCost = 0;
                  if (checked) {
                    // Calculate total filters cost
                    const filtersCost = 
                      (item.fuelFilter1Cost || 49) +
                      (item.fuelFilter2Cost || 118) +
                      (item.oilFilterCost || 45) +
                      (item.airFilter1Cost || 105) +
                      (item.airFilter2Cost || 54) +
                      (item.engineFilterCost || 150);
                    
                    // Calculate oil cost 
                    const oilTotalCost = (item.oilCost || 162.44);
                    
                    // Calculate service work cost using actual values or defaults
                    const serviceWorkCost = (item.serviceWorkHours !== undefined ? item.serviceWorkHours : 2) * (item.serviceWorkRatePerHour !== undefined ? item.serviceWorkRatePerHour : 100);
                    
                    // No travel cost for maintenance
                    
                    // Total maintenance cost for 500 hours
                    const maintenanceCostPer500h = filtersCost + oilTotalCost + serviceWorkCost;
                    
                    // Calculate how much of maintenance cost applies to rental period
                    const expectedHours = item.expectedMaintenanceHours || (item.rentalPeriodDays * (item.hoursPerDay || 8));
                    if (expectedHours > 0) {
                      totalCost = (maintenanceCostPer500h / 500) * expectedHours;
                    }
                  }
                  onUpdate({ 
                    ...item, 
                    includeMaintenanceCost: checked as boolean,
                    fuelFilter1Cost: checked ? (item.fuelFilter1Cost || 49) : undefined,
                    fuelFilter2Cost: checked ? (item.fuelFilter2Cost || 118) : undefined,
                    oilFilterCost: checked ? (item.oilFilterCost || 45) : undefined,
                    airFilter1Cost: checked ? (item.airFilter1Cost || 105) : undefined,
                    airFilter2Cost: checked ? (item.airFilter2Cost || 54) : undefined,
                    engineFilterCost: checked ? (item.engineFilterCost || 150) : undefined,
                    oilCost: checked ? (item.oilCost || 162.44) : undefined,
                    oilQuantityLiters: checked ? (item.oilQuantityLiters || 14.7) : undefined,
                    serviceWorkHours: checked ? (item.serviceWorkHours !== undefined ? item.serviceWorkHours : 2) : undefined,
                    serviceWorkRatePerHour: checked ? (item.serviceWorkRatePerHour !== undefined ? item.serviceWorkRatePerHour : 100) : undefined,

                    maintenanceIntervalHours: checked ? (item.maintenanceIntervalHours || 500) : undefined,
                    expectedMaintenanceHours: checked ? (item.expectedMaintenanceHours || (item.rentalPeriodDays * (item.hoursPerDay || 8))) : undefined,
                    totalMaintenanceCost: checked ? totalCost : 0
                  });
                }}
              />
              <label htmlFor="includeMaintenanceCost" className="text-sm font-medium text-foreground flex items-center">
                <Wrench className="w-4 h-4 mr-2" />
                Uwzględnij koszty eksploatacji{isAirConditioner ? ' (wymiana filtrów)' : ' (co 500 mth)'}
              </label>
            </div>
            
            {item.includeMaintenanceCost && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-4">
                    <h4 className="font-medium text-foreground mb-3">Filtra (6 szt.)</h4>
                  </div>
                  
                  {/* Filter costs - 6 filters */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Paliwa 1"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.fuelFilter1Cost || 49}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 49;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="49.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Paliwa 2"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.fuelFilter2Cost || 118}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 118;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="118.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Oleju"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.oilFilterCost || 45}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 45;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="45.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Powietrza 1"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.airFilter1Cost || 105}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 105;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="105.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Powietrza 2"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.airFilter2Cost || 54}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 54;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="54.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {"Filtr Silnika"} (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.engineFilterCost || 150}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 150;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="150.00"
                    />
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Suma filtrów:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(
                        (item.fuelFilter1Cost || 49) + 
                        (item.fuelFilter2Cost || 118) + 
                        (item.oilFilterCost || 45) + 
                        (item.airFilter1Cost || 105) + 
                        (item.airFilter2Cost || 54) + 
                        (item.engineFilterCost || 150)
                      )}
                    </span>
                  </div>
                </div>

                {!isAirConditioner && (
                  <>
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="md:col-span-3">
                        <h4 className="font-medium text-foreground mb-3">Olej</h4>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Koszt oleju (zł)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.oilCost || 162.44}
                          onChange={(e) => {
                            const cost = parseFloat(e.target.value) || 162.44;
                            // Maintenance costs removed per user request
                          }}
                          placeholder="162.44"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Ilość oleju (l)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={item.oilQuantityLiters || 14.7}
                          onChange={(e) => {
                            const quantity = parseFloat(e.target.value) || 14.7;
                            // Maintenance costs removed per user request
                          }}
                          placeholder="14.7"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-foreground mb-3">Koszt pracy serwisanta</h4>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Czas pracy (h)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.serviceWorkHours ?? 2}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value);
                        // Maintenance costs removed per user request
                      }}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Stawka za godzinę (zł)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.serviceWorkRatePerHour ?? 100}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value);
                        // Maintenance costs removed per user request
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Przewidywane motogodziny
                    </label>
                    <Input
                      type="number"
                      value={item.expectedMaintenanceHours || (item.rentalPeriodDays * (item.hoursPerDay || 8))}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 0;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="Dni × godz/dzień"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Domyślnie: {item.rentalPeriodDays} dni × {item.hoursPerDay || 8} h/dzień
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Interwał serwisu (mth)
                    </label>
                    <Input
                      type="number"
                      value={item.maintenanceIntervalHours || 500}
                      onChange={(e) => {
                        const interval = parseInt(e.target.value) || 500;
                        // Maintenance costs removed per user request
                      }}
                      placeholder="500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Koszt eksploatacji
                    </label>
                    <div className="text-lg font-bold text-primary bg-primary/10 p-3 rounded-lg border-2 border-primary/20">
                      {formatCurrency(item.totalMaintenanceCost || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Za okres wynajmu
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Equipment and Accessories */}
        {additionalEquipment.length > 0 && (
          <div className="space-y-4">
            {additionalEquipment.filter(item => item.type === "additional").length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`additional-${item.id}`}
                  checked={additionalEquipment.filter(item => item.type === "additional").some(add => item.selectedAdditional?.includes(add.id))}
                  onCheckedChange={(checked) => {
                    const additionalItems = additionalEquipment.filter(item => item.type === "additional");
                    const allSelected = additionalItems.every(add => item.selectedAdditional?.includes(add.id));
                    
                    if (checked && !allSelected) {
                      // Select all additional items
                      const newSelected = [...(item.selectedAdditional || []), ...additionalItems.map(add => add.id)];
                      const cost = additionalItems.reduce((sum, add) => sum + parseFloat(add.price), 0);
                      onUpdate({
                        ...item,
                        selectedAdditional: newSelected,
                        additionalCost: cost
                      });
                    } else {
                      // Deselect all additional items
                      const additionalIds = additionalItems.map(add => add.id);
                      const newSelected = (item.selectedAdditional || []).filter(id => !additionalIds.includes(id));
                      onUpdate({
                        ...item,
                        selectedAdditional: newSelected,
                        additionalCost: 0
                      });
                    }
                  }}
                />
                <label htmlFor={`additional-${item.id}`} className="text-lg font-semibold">
                  Wyposażenie dodatkowe
                </label>
              </div>
            )}

            {additionalEquipment.filter(item => item.type === "additional").map((additional) => (
              <div key={additional.id} className="ml-6 flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`additional-item-${additional.id}`}
                    checked={item.selectedAdditional?.includes(additional.id) || false}
                    onCheckedChange={(checked) => {
                      const currentSelected = item.selectedAdditional || [];
                      let newSelected;
                      let newCost = item.additionalCost || 0;
                      
                      if (checked) {
                        newSelected = [...currentSelected, additional.id];
                        newCost += parseFloat(additional.price);
                      } else {
                        newSelected = currentSelected.filter(id => id !== additional.id);
                        newCost -= parseFloat(additional.price);
                      }
                      
                      // Save selected items info in notes as JSON (hidden from user)
                      const currentNotes = item.notes || "";
                      const hiddenData = {
                        selectedAdditional: newSelected,
                        selectedAccessories: item.selectedAccessories || [],
                        userNotes: currentNotes.startsWith('{"selectedAdditional"') ? 
                          JSON.parse(currentNotes).userNotes || "" : currentNotes
                      };
                      
                      onUpdate({
                        ...item,
                        selectedAdditional: newSelected,
                        additionalCost: Math.max(0, newCost),
                        notes: JSON.stringify(hiddenData)
                      });
                    }}
                  />
                  <label htmlFor={`additional-item-${additional.id}`} className="font-medium">
                    {additional.name}
                  </label>
                </div>
                <div className="text-sm font-semibold">
                  {parseFloat(additional.price).toFixed(2)} zł
                </div>
              </div>
            ))}

            {additionalEquipment.filter(item => item.type === "accessories").length > 0 && (
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id={`accessories-${item.id}`}
                  checked={additionalEquipment.filter(item => item.type === "accessories").some(acc => item.selectedAccessories?.includes(acc.id))}
                  onCheckedChange={(checked) => {
                    const accessoryItems = additionalEquipment.filter(item => item.type === "accessories");
                    const allSelected = accessoryItems.every(acc => item.selectedAccessories?.includes(acc.id));
                    
                    if (checked && !allSelected) {
                      // Select all accessories
                      const newSelected = [...(item.selectedAccessories || []), ...accessoryItems.map(acc => acc.id)];
                      const cost = accessoryItems.reduce((sum, acc) => sum + parseFloat(acc.price), 0);
                      onUpdate({
                        ...item,
                        selectedAccessories: newSelected,
                        accessoriesCost: cost
                      });
                    } else {
                      // Deselect all accessories
                      const accessoryIds = accessoryItems.map(acc => acc.id);
                      const newSelected = (item.selectedAccessories || []).filter(id => !accessoryIds.includes(id));
                      onUpdate({
                        ...item,
                        selectedAccessories: newSelected,
                        accessoriesCost: 0
                      });
                    }
                  }}
                />
                <label htmlFor={`accessories-${item.id}`} className="text-lg font-semibold">
                  Akcesoria
                </label>
              </div>
            )}

            {additionalEquipment.filter(item => item.type === "accessories").map((accessory) => (
              <div key={accessory.id} className="ml-6 flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`accessory-item-${accessory.id}`}
                    checked={item.selectedAccessories?.includes(accessory.id) || false}
                    onCheckedChange={(checked) => {
                      const currentSelected = item.selectedAccessories || [];
                      let newSelected;
                      let newCost = item.accessoriesCost || 0;
                      
                      if (checked) {
                        newSelected = [...currentSelected, accessory.id];
                        newCost += parseFloat(accessory.price);
                      } else {
                        newSelected = currentSelected.filter(id => id !== accessory.id);
                        newCost -= parseFloat(accessory.price);
                      }
                      
                      // Save selected items info in notes as JSON (hidden from user)  
                      const currentNotes = item.notes || "";
                      const hiddenData = {
                        selectedAdditional: item.selectedAdditional || [],
                        selectedAccessories: newSelected,
                        userNotes: currentNotes.startsWith('{"selectedAdditional"') ? 
                          JSON.parse(currentNotes).userNotes || "" : currentNotes
                      };
                      
                      onUpdate({
                        ...item,
                        selectedAccessories: newSelected,
                        accessoriesCost: Math.max(0, newCost),
                        notes: JSON.stringify(hiddenData)
                      });
                    }}
                  />
                  <label htmlFor={`accessory-item-${accessory.id}`} className="font-medium">
                    {accessory.name}
                  </label>
                </div>
                <div className="text-sm font-semibold">
                  {parseFloat(accessory.price).toFixed(2)} zł
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-foreground mb-2">Uwagi</label>
          <Textarea
            value={getUserNotes(item.notes || "")}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Dodatkowe uwagi do pozycji"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
