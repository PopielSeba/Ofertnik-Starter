import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Package, 
  FileText, 
  PlusCircle, 
  Settings, 
  TrendingUp, 
  Users,
  Snowflake,
  Flame,
  Lightbulb,
  Zap,
  Calendar,
  ArrowRight,
  ClipboardList,
  Search
} from "lucide-react";

interface Quote {
  id: number;
  quoteNumber: string;
  client: {
    companyName: string;
  };
  createdAt: string;
  totalNet: string;
  status: string;
}

interface Equipment {
  id: number;
  name: string;
  category: {
    name: string;
  };
  quantity: number;
  availableQuantity: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    enabled: !!user && (user as any)?.role === 'admin', // Only fetch quotes for logged-in admins
  });

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const recentQuotes = quotes.slice(0, 3);
  
  // Calculate statistics
  const totalEquipment = equipment.reduce((sum, item) => sum + item.quantity, 0);
  const availableEquipment = equipment.reduce((sum, item) => sum + item.availableQuantity, 0);
  const categoryCounts = equipment.reduce((acc, item) => {
    const categoryName = item.category.name;
    acc[categoryName] = (acc[categoryName] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(num);
  };

  const quickActions = [
    {
      title: "Badanie Potrzeb",
      description: "Przeprowadź analizę potrzeb klienta",
      icon: ClipboardList,
      color: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700",
      path: "/needs-assessment"
    },
    {
      title: "Nowa Wycena",
      description: "Utwórz wycenę dla klienta",
      icon: PlusCircle,
      color: "bg-blue-500 hover:bg-blue-600",
      path: "/create-quote"
    },
    {
      title: "Katalog sprzętu",
      description: "Przeglądaj dostępny sprzęt",
      icon: Package,
      color: "bg-green-500 hover:bg-green-600", 
      path: "/equipment"
    }
  ];

  if ((user as any)?.role === 'admin') {
    quickActions.push({
      title: "Zapisane Wyceny",
      description: "Zarządzaj utworzonymi wycenami",
      icon: FileText,
      color: "bg-purple-500 hover:bg-purple-600",
      path: "/quotes"
    });
  }

  // Add "Zapisane Badania" for all authenticated users
  quickActions.push({
    title: "Zapisane Badania",
    description: "Przeglądaj przeprowadzone badania potrzeb",
    icon: FileText,
    color: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
    path: "/needs-assessment-list"
  });

  if ((user as any)?.role === 'admin' || (user as any)?.role === 'kierownik') {
    quickActions.push({
      title: "Zarządzanie sprzętem wypożyczalni",
      description: "Zarządzaj sprzętem i kategoriami",
      icon: Settings,
      color: "bg-orange-500 hover:bg-orange-600",
      path: "/admin"
    });
  }

  const categoryIcons = {
    'Klimatyzacje': Snowflake,
    'Nagrzewnice': Flame,
    'Maszty oświetleniowe': Lightbulb,
    'Agregaty prądotwórcze': Zap,
  };

  const categoryColors = {
    'Klimatyzacje': 'bg-blue-100 text-blue-800',
    'Nagrzewnice': 'bg-red-100 text-red-800',
    'Maszty oświetleniowe': 'bg-yellow-100 text-yellow-800',
    'Agregaty prądotwórcze': 'bg-green-100 text-green-800',
  };

  if (quotesLoading || equipmentLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white shadow-xl mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Ofertnik - System wycen dla wypożyczalni
            </h1>
            <h2 className="text-2xl font-semibold text-white/90 mb-2">
              Witaj{(user as any)?.firstName || (user as any)?.email ? `, ${(user as any)?.firstName || (user as any)?.email}` : ''}!
            </h2>
            <p className="text-white/80 text-lg">
              Od 30 minut ręcznego liczenia do 2 minut gotowej oferty z automatycznymi rabatami
            </p>
            <div className="text-white/60 text-sm mt-4">
              PPP :: Program
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-white text-center">Szybkie akcje</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <div 
                  key={action.title}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white shadow-xl cursor-pointer hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${action.color} text-white shadow-lg`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-white">{action.title}</h3>
                      <p className="text-white/70 text-sm">{action.description}</p>
                      <ArrowRight className="w-4 h-4 mt-2 text-white/60" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>



        <div className={`grid grid-cols-1 ${user && (user as any)?.role === 'admin' ? 'lg:grid-cols-2' : ''} gap-8`}>
          {/* Recent Quotes - Only for logged-in admins */}
          {user && (user as any)?.role === 'admin' ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl">
              <div className="flex flex-row items-center justify-between p-6 border-b border-white/20">
                <h3 className="text-xl font-semibold text-white">Ostatnie oferty</h3>
                <Button variant="outline" size="sm" onClick={() => navigate("/quotes")} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                  Zobacz wszystkie
                </Button>
              </div>
              <div className="p-6">
                {recentQuotes.length === 0 ? (
                  <div className="text-center py-8 text-white/70">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Brak utworzonych ofert</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate("/create-quote")}
                    >
                      Utwórz pierwszą ofertę
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentQuotes.map((quote) => (
                      <div 
                        key={quote.id}
                        className="flex items-center justify-between p-3 border border-white/20 rounded-lg hover:bg-white/10 cursor-pointer"
                        onClick={() => navigate(`/quotes/${quote.id}`)}
                      >
                        <div>
                          <p className="font-medium text-white">{quote.quoteNumber}</p>
                          <p className="text-sm text-white/70">
                            {quote.client.companyName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">{formatCurrency(quote.totalNet)}</p>
                          <p className="text-sm text-white/70">
                            {new Date(quote.createdAt).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Equipment Categories */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-xl">
            <div className="flex flex-row items-center justify-between p-6 border-b border-white/20">
              <h3 className="text-xl font-semibold text-white">Kategorie sprzętu</h3>
              <Button variant="outline" size="sm" onClick={() => navigate("/equipment")} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                Zobacz katalog
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(categoryCounts).map(([categoryName, count]) => {
                  const IconComponent = categoryIcons[categoryName as keyof typeof categoryIcons] || Package;
                  const colorClass = categoryColors[categoryName as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800';
                  
                  return (
                    <div 
                      key={categoryName}
                      className="flex items-center justify-between p-3 border border-white/20 rounded-lg hover:bg-white/10 cursor-pointer"
                      onClick={() => {
                        navigate("/equipment");
                        // Scroll to category after navigation
                        setTimeout(() => {
                          const element = document.getElementById(`category-${categoryName}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full bg-white/20`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-white">{categoryName}</span>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">{count} szt.</Badge>
                    </div>
                  );
                })}
                
                {Object.keys(categoryCounts).length === 0 && (
                  <div className="text-center py-8 text-white/70">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Brak sprzętu w systemie</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}