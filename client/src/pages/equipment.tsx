import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Snowflake, Flame, Lightbulb, Zap } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface EquipmentCategory {
  id: number;
  name: string;
  description?: string;
}

interface Equipment {
  id: number;
  name: string;
  description?: string;
  model?: string;
  power?: string;
  quantity: number;
  availableQuantity: number;
  category: EquipmentCategory;
  pricing: Array<{
    periodStart: number;
    periodEnd?: number;
    pricePerDay: string;
    discountPercent: string;
  }>;
}

const getCategoryColor = (categoryName: string) => {
  const colors = {
    'Klimatyzacje': 'bg-blue-100 text-blue-800',
    'Nagrzewnice': 'bg-red-100 text-red-800',
    'Maszty oświetleniowe': 'bg-yellow-100 text-yellow-800',
    'Agregaty prądotwórcze': 'bg-green-100 text-green-800',
    'Kurtyny powietrzne': 'bg-purple-100 text-purple-800',
    'Wyciągi spalin': 'bg-indigo-100 text-indigo-800',
  };
  return colors[categoryName as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getCategoryIcon = (categoryName: string) => {
  const icons = {
    'Klimatyzacje': Snowflake,
    'Nagrzewnice': Flame,
    'Maszty oświetleniowe': Lightbulb,
    'Agregaty prądotwórcze': Zap,
  };
  return icons[categoryName as keyof typeof icons] || Search;
};

const scrollToCategory = (categoryName: string) => {
  const element = document.getElementById(`category-${categoryName}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

export default function Equipment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [, navigate] = useLocation();

  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: categories = [] } = useQuery<EquipmentCategory[]>({
    queryKey: ["/api/equipment-categories"],
  });

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category.id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedEquipment = filteredEquipment.reduce((acc, item) => {
    const categoryName = item.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, Equipment[]>);

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(parseFloat(price));
  };

  const getPriceDisplay = (pricing: Equipment['pricing']) => {
    if (pricing.length === 0) return "Brak ceny";
    const basePrice = pricing.find(p => p.periodStart === 1);
    return basePrice ? `od ${formatPrice(basePrice.pricePerDay)}/doba` : "Brak ceny";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Katalog Sprzętu</h1>
            <p className="text-muted-foreground mt-2">Przeglądaj dostępny sprzęt wypożyczalni</p>
          </div>
        </div>



        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Szukaj sprzętu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-64">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Wszystkie kategorie" />
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
        </div>

        {/* Equipment Grid */}
        <div className="space-y-8">
          {Object.entries(groupedEquipment).map(([categoryName, items]) => (
            <div key={categoryName} id={`category-${categoryName}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">{categoryName}</h2>
                <Badge className={getCategoryColor(categoryName)}>
                  {items.reduce((sum, item) => sum + item.quantity, 0)} szt.
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          {item.model && (
                            <p className="text-sm text-muted-foreground mt-1">{item.model}</p>
                          )}
                          {item.power && (
                            <p className="text-sm text-muted-foreground">{item.power}</p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {item.availableQuantity}/{item.quantity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-foreground">Dostępne:</span>
                          <span className="text-sm font-medium text-green-600">
                            {item.availableQuantity} szt.
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-foreground">Cena:</span>
                          <span className="text-sm font-medium text-primary">
                            {getPriceDisplay(item.pricing)}
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        disabled={item.availableQuantity === 0}
                        onClick={() => navigate(`/create-quote?equipment=${item.id}`)}
                      >
                        {item.availableQuantity === 0 ? 'Niedostępny' : 'Dodaj do wyceny'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredEquipment.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 text-lg">
                Nie znaleziono sprzętu pasującego do kryteriów wyszukiwania
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
              >
                Wyczyść filtry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
