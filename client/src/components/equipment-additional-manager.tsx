import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Trash2, Plus } from "lucide-react";

interface EquipmentAdditional {
  id: number;
  equipmentId: number;
  type: "additional" | "accessories";
  name: string;
  price: string;
  position: number;
}

interface EquipmentAdditionalManagerProps {
  equipmentId: number;
  equipmentName: string;
}

function EquipmentAdditionalManager({ equipmentId, equipmentName }: EquipmentAdditionalManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAdditional, setShowAdditional] = useState(false);
  const [showAccessories, setShowAccessories] = useState(false);

  const { data: additionalItems = [] } = useQuery<EquipmentAdditional[]>({
    queryKey: ["/api/equipment", equipmentId, "additional"],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/${equipmentId}/additional`);
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { type: string; name: string; price: string; position: number }) => {
      const response = await apiRequest("/api/equipment-additional", "POST", {
        equipmentId,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId, "additional"] });
      toast({
        title: "Sukces",
        description: "Pozycja została dodana",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Brak autoryzacji",
          description: "Sesja wygasła. Przekierowywanie do logowania...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się dodać pozycji",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; price: string }) => {
      const response = await apiRequest(`/api/equipment-additional/${data.id}`, "PATCH", {
        name: data.name,
        price: data.price,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId, "additional"] });
      toast({
        title: "Sukces",
        description: "Pozycja została zaktualizowana",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Brak autoryzacji",
          description: "Sesja wygasła. Przekierowywanie do logowania...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować pozycji",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/equipment-additional/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId, "additional"] });
      toast({
        title: "Sukces",
        description: "Pozycja została usunięta",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Brak autoryzacji",
          description: "Sesja wygasła. Przekierowywanie do logowania...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć pozycji",
        variant: "destructive",
      });
    },
  });

  const additionalEquipment = additionalItems.filter(item => item.type === "additional");
  const accessories = additionalItems.filter(item => item.type === "accessories");

  const handleAddItem = (type: "additional" | "accessories") => {
    const existingItems = type === "additional" ? additionalEquipment : accessories;
    const nextPosition = existingItems.length + 1;
    
    if (nextPosition > 4) {
      toast({
        title: "Limit osiągnięty",
        description: "Możesz dodać maksymalnie 4 pozycje",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      type,
      name: `Nowa pozycja ${nextPosition}`,
      price: "0",
      position: nextPosition,
    });
  };

  const handleUpdateItem = (id: number, name: string, price: string) => {
    updateMutation.mutate({ id, name, price });
  };

  const handleDeleteItem = (id: number) => {
    if (confirm("Czy na pewno chcesz usunąć tę pozycję?")) {
      deleteMutation.mutate(id);
    }
  };

  const renderItemsSection = (
    title: string,
    items: EquipmentAdditional[],
    type: "additional" | "accessories",
    show: boolean,
    setShow: (show: boolean) => void
  ) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`show-${type}`}
          checked={show}
          onCheckedChange={setShow}
        />
        <Label htmlFor={`show-${type}`} className="text-lg font-semibold">
          {title}
        </Label>
      </div>

      {show && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">{title}</CardTitle>
            <Button
              size="sm"
              onClick={() => handleAddItem(type)}
              disabled={items.length >= 4 || createMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj pozycję
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Brak pozycji do wyświetlenia
              </p>
            ) : (
              items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  isUpdating={updateMutation.isPending}
                  isDeleting={deleteMutation.isPending}
                />
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Wyposażenie dodatkowe - {equipmentName}
        </h3>
      </div>

      {renderItemsSection(
        "Wyposażenie dodatkowe",
        additionalEquipment,
        "additional",
        showAdditional,
        setShowAdditional
      )}

      {renderItemsSection(
        "Akcesoria",
        accessories,
        "accessories",
        showAccessories,
        setShowAccessories
      )}
    </div>
  );
}

interface ItemRowProps {
  item: EquipmentAdditional;
  onUpdate: (id: number, name: string, price: string) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function ItemRow({ item, onUpdate, onDelete, isUpdating, isDeleting }: ItemRowProps) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price);
  const [hasChanges, setHasChanges] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(value !== item.name || price !== item.price);
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);
    setHasChanges(name !== item.name || value !== item.price);
  };

  const handleSave = () => {
    onUpdate(item.id, name, price);
    setHasChanges(false);
  };

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg">
      <div className="flex-1">
        <Label htmlFor={`name-${item.id}`}>Nazwa</Label>
        <Input
          id={`name-${item.id}`}
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Nazwa pozycji"
        />
      </div>
      <div className="w-32">
        <Label htmlFor={`price-${item.id}`}>Cena (zł)</Label>
        <Input
          id={`price-${item.id}`}
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => handlePriceChange(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="flex space-x-2">
        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isUpdating}
          >
            Zapisz
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(item.id)}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export { EquipmentAdditionalManager };
export default EquipmentAdditionalManager;