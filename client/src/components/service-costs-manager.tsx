import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Save, Edit, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import type { 
  EquipmentWithCategory, 
  EquipmentServiceCosts, 
  EquipmentServiceItems,
  InsertEquipmentServiceCosts,
  InsertEquipmentServiceItems
} from "@shared/schema";

interface ServiceCostsManagerProps {
  equipment: EquipmentWithCategory;
  onClose: () => void;
}

export function ServiceCostsManager({ equipment, onClose }: ServiceCostsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch service costs
  const { data: serviceCosts, isLoading: serviceCostsLoading } = useQuery<EquipmentServiceCosts | null>({
    queryKey: [`/api/equipment/${equipment.id}/service-costs`],
  });

  // Fetch service items
  const { data: serviceItems = [], isLoading: serviceItemsLoading } = useQuery<EquipmentServiceItems[]>({
    queryKey: [`/api/equipment/${equipment.id}/service-items`],
  });

  // Local state for service costs form
  const [serviceCostsForm, setServiceCostsForm] = useState({
    serviceIntervalMonths: 0,
    serviceIntervalKm: 0,
    serviceIntervalMotohours: 0,
    workerHours: 2,
    workerCostPerHour: 100,
  });

  // Check equipment category for different interval types
  const isVehicle = equipment.category.name === 'Pojazdy';
  const isEngineEquipment = equipment.category.name === 'Agregaty prądotwórcze' || equipment.category.name === 'Maszty oświetleniowe';

  // Local state for service items
  const [localServiceItems, setLocalServiceItems] = useState<EquipmentServiceItems[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [newItemForm, setNewItemForm] = useState({
    itemName: "",
    itemCost: "0",
    sortOrder: 0,
  });
  const [showNewItemForm, setShowNewItemForm] = useState(false);

  // Update forms when data loads
  useEffect(() => {
    if (serviceCosts) {
      setServiceCostsForm({
        serviceIntervalMonths: serviceCosts.serviceIntervalMonths || 0,
        serviceIntervalKm: (serviceCosts as any).serviceIntervalKm || 0,
        serviceIntervalMotohours: (serviceCosts as any).serviceIntervalMotohours || 0,
        workerHours: parseFloat(serviceCosts.workerHours.toString()),
        workerCostPerHour: parseFloat(serviceCosts.workerCostPerHour.toString()),
      });
    }
  }, [serviceCosts]);

  useEffect(() => {
    setLocalServiceItems([...serviceItems]);
  }, [serviceItems]);

  // Mutations
  const updateServiceCostsMutation = useMutation({
    mutationFn: async (data: InsertEquipmentServiceCosts) => {
      return await apiRequest(`/api/equipment/${equipment.id}/service-costs`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/equipment/${equipment.id}/service-costs`] });
      toast({
        title: "Sukces",
        description: "Koszty serwisu zostały zaktualizowane",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować kosztów serwisu",
        variant: "destructive",
      });
    },
  });

  const addServiceItemMutation = useMutation({
    mutationFn: async (data: InsertEquipmentServiceItems) => {
      return await apiRequest(`/api/equipment/${equipment.id}/service-items`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/equipment/${equipment.id}/service-items`] });
      setShowNewItemForm(false);
      setNewItemForm({ itemName: "", itemCost: "0", sortOrder: 0 });
      toast({
        title: "Sukces",
        description: "Element serwisu został dodany",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać elementu serwisu",
        variant: "destructive",
      });
    },
  });

  const updateServiceItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEquipmentServiceItems> }) => {
      return await apiRequest(`/api/equipment-service-items/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/equipment/${equipment.id}/service-items`] });
      setEditingItemId(null);
      toast({
        title: "Sukces",
        description: "Element serwisu został zaktualizowany",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować elementu serwisu",
        variant: "destructive",
      });
    },
  });

  const deleteServiceItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/equipment-service-items/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/equipment/${equipment.id}/service-items`] });
      toast({
        title: "Sukces",
        description: "Element serwisu został usunięty",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć elementu serwisu",
        variant: "destructive",
      });
    },
  });

  const handleSaveServiceCosts = () => {
    const data: any = {
      equipmentId: equipment.id,
      workerHours: serviceCostsForm.workerHours.toString(),
      workerCostPerHour: serviceCostsForm.workerCostPerHour.toString(),
    };
    
    if (isVehicle) {
      data.serviceIntervalKm = serviceCostsForm.serviceIntervalKm;
    } else if (isEngineEquipment) {
      data.serviceIntervalMotohours = serviceCostsForm.serviceIntervalMotohours;
    } else {
      data.serviceIntervalMonths = serviceCostsForm.serviceIntervalMonths;
    }
    
    updateServiceCostsMutation.mutate(data);
  };

  const handleAddServiceItem = () => {
    const maxOrder = Math.max(0, ...localServiceItems.map(item => item.sortOrder));
    addServiceItemMutation.mutate({
      equipmentId: equipment.id,
      itemName: newItemForm.itemName,
      itemCost: newItemForm.itemCost,
      sortOrder: maxOrder + 1,
    });
  };

  const handleUpdateServiceItem = (id: number, itemName: string, itemCost: string) => {
    updateServiceItemMutation.mutate({
      id,
      data: { itemName, itemCost },
    });
  };

  const handleDeleteServiceItem = (id: number) => {
    if (confirm("Czy na pewno chcesz usunąć ten element serwisu?")) {
      deleteServiceItemMutation.mutate(id);
    }
  };

  if (serviceCostsLoading || serviceItemsLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Ładowanie...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Koszty serwisu - {equipment.name}</CardTitle>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Costs Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Konfiguracja serwisu</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="serviceInterval">
                {isVehicle ? "Interwał serwisu (km)" : 
                 isEngineEquipment ? "Interwał serwisu (mth)" :
                 "Interwał serwisu (miesiące)"}
              </Label>
              <Input
                id="serviceInterval"
                type="number"
                value={
                  isVehicle ? serviceCostsForm.serviceIntervalKm :
                  isEngineEquipment ? serviceCostsForm.serviceIntervalMotohours :
                  serviceCostsForm.serviceIntervalMonths
                }
                onChange={(e) => setServiceCostsForm(prev => ({
                  ...prev,
                  ...(isVehicle 
                    ? { serviceIntervalKm: parseInt(e.target.value) || 0 }
                    : isEngineEquipment
                    ? { serviceIntervalMotohours: parseInt(e.target.value) || 0 }
                    : { serviceIntervalMonths: parseInt(e.target.value) || 0 }
                  )
                }))}
                min="0"
                placeholder={
                  isVehicle ? "np. 15000" :
                  isEngineEquipment ? "np. 500" :
                  "np. 12"
                }
              />
            </div>
            <div>
              <Label htmlFor="workerHours">Roboczogodziny</Label>
              <Input
                id="workerHours"
                type="number"
                value={serviceCostsForm.workerHours}
                onChange={(e) => setServiceCostsForm(prev => ({
                  ...prev,
                  workerHours: parseFloat(e.target.value) || 0
                }))}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <Label htmlFor="workerCost">Koszt za godzinę (zł)</Label>
              <Input
                id="workerCost"
                type="number"
                value={serviceCostsForm.workerCostPerHour}
                onChange={(e) => setServiceCostsForm(prev => ({
                  ...prev,
                  workerCostPerHour: parseFloat(e.target.value) || 0
                }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <Button 
            onClick={handleSaveServiceCosts}
            disabled={updateServiceCostsMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateServiceCostsMutation.isPending ? "Zapisywanie..." : "Zapisz konfigurację"}
          </Button>
        </div>

        <Separator />

        {/* Service Items Management */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Elementy serwisu</h3>
            <Button 
              onClick={() => setShowNewItemForm(true)}
              disabled={showNewItemForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Dodaj element
            </Button>
          </div>

          {/* New Item Form */}
          {showNewItemForm && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newItemName">Nazwa elementu</Label>
                    <Input
                      id="newItemName"
                      value={newItemForm.itemName}
                      onChange={(e) => setNewItemForm(prev => ({
                        ...prev,
                        itemName: e.target.value
                      }))}
                      placeholder="np. Filtry, Oleje, itp."
                    />
                  </div>
                  <div>
                    <Label htmlFor="newItemCost">Koszt (zł)</Label>
                    <Input
                      id="newItemCost"
                      type="number"
                      value={newItemForm.itemCost}
                      onChange={(e) => setNewItemForm(prev => ({
                        ...prev,
                        itemCost: e.target.value
                      }))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={handleAddServiceItem}
                    disabled={!newItemForm.itemName || addServiceItemMutation.isPending}
                  >
                    {addServiceItemMutation.isPending ? "Dodawanie..." : "Dodaj"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowNewItemForm(false);
                      setNewItemForm({ itemName: "", itemCost: "0", sortOrder: 0 });
                    }}
                  >
                    Anuluj
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Items List */}
          <div className="space-y-2">
            {localServiceItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Brak skonfigurowanych elementów serwisu
              </p>
            ) : (
              localServiceItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    {editingItemId === item.id ? (
                      <EditServiceItemForm
                        item={item}
                        onSave={(itemName, itemCost) => handleUpdateServiceItem(item.id, itemName, itemCost)}
                        onCancel={() => setEditingItemId(null)}
                        isLoading={updateServiceItemMutation.isPending}
                      />
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{item.itemName}</span>
                          <span className="text-gray-500 ml-4">
                            {parseFloat(item.itemCost).toFixed(2)} zł
                          </span>
                          {item.itemName === "Roboczogodziny serwisowe" && (
                            <span className="text-xs text-muted-foreground ml-2 italic">
                              (automatycznie kalkulowane)
                            </span>
                          )}
                        </div>
                        {item.itemName !== "Roboczogodziny serwisowe" ? (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingItemId(item.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteServiceItem(item.id)}
                              disabled={deleteServiceItemMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Nie można edytować
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EditServiceItemFormProps {
  item: EquipmentServiceItems;
  onSave: (itemName: string, itemCost: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditServiceItemForm({ item, onSave, onCancel, isLoading }: EditServiceItemFormProps) {
  const [itemName, setItemName] = useState(item.itemName);
  const [itemCost, setItemCost] = useState(item.itemCost);

  const handleSave = () => {
    if (itemName.trim()) {
      onSave(itemName.trim(), itemCost);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="editItemName">Nazwa elementu</Label>
          <Input
            id="editItemName"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="editItemCost">Koszt (zł)</Label>
          <Input
            id="editItemCost"
            type="number"
            value={itemCost}
            onChange={(e) => setItemCost(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={handleSave}
          disabled={!itemName.trim() || isLoading}
          size="sm"
        >
          {isLoading ? "Zapisywanie..." : "Zapisz"}
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          size="sm"
        >
          Anuluj
        </Button>
      </div>
    </div>
  );
}