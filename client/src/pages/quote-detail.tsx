import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  Building2, 
  Calendar, 
  DollarSign,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  Plus
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface QuoteDetail {
  id: number;
  quoteNumber: string;
  client: {
    id: number;
    companyName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    nip?: string;
  };
  createdBy?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  status: string;
  totalNet: string;
  totalGross: string;
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
  items: Array<{
    id: number;
    quantity: number;
    rentalPeriodDays: number;
    pricePerDay: number;
    discountPercent: number;
    totalPrice: number;
    notes?: string;
    equipment: {
      id: number;
      name: string;
      category: {
        name: string;
      };
    };
    // Fuel costs
    includeFuelCost?: boolean;
    fuelConsumptionLH?: number;
    fuelPricePerLiter?: number;
    hoursPerDay?: number;
    totalFuelCost?: number;
    
    // Installation costs
    includeInstallationCost?: boolean;
    installationDistanceKm?: number;
    numberOfTechnicians?: number;
    serviceRatePerTechnician?: number;
    travelRatePerKm?: number;
    totalInstallationCost?: number;
    
    // Maintenance costs
    includeMaintenanceCost?: boolean;
    totalMaintenanceCost?: number;
    
    // Service items (heaters)
    includeServiceItems?: boolean;
    serviceItem1Cost?: number;
    serviceItem2Cost?: number;
    serviceItem3Cost?: number;
    totalServiceItemsCost?: number;
  }>;
}

export default function QuoteDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if not authenticated or not admin/employee
  useEffect(() => {
    if (!authLoading && !isAuthenticated && process.env.NODE_ENV === 'production') {
      toast({
        title: "Brak uprawnień",
        description: "Dostęp do wycen jest dostępny tylko dla pracowników i administratorów.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, user, authLoading, toast]);

  const { data: quote, isLoading, error } = useQuery<QuoteDetail>({
    queryKey: ["/api/quotes", id],
    enabled: !!id,
    retry: false,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie wyceny...</p>
        </div>
      </div>
    );
  }

  if (error) {
    if (isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return null;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Błąd ładowania wyceny</h1>
          <p className="text-muted-foreground mb-4">Nie udało się załadować danych wyceny.</p>
          <Link href="/quotes">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do listy wycen
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground mb-4">Wycena nie znaleziona</h1>
          <p className="text-muted-foreground mb-4">Nie można znaleźć wyceny o podanym ID.</p>
          <Link href="/quotes">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do listy wycen
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Wersja robocza", variant: "secondary" as const },
      pending: { label: "Oczekująca", variant: "default" as const },
      approved: { label: "Zatwierdzona", variant: "default" as const },
      rejected: { label: "Odrzucona", variant: "destructive" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getRentalPeriodText = (days: number) => {
    if (days === 1) return "1 dzień";
    if (days < 5) return `${days} dni`;
    return `${days} dni`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/quotes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do listy
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Wycena {quote.quoteNumber}</h1>
              <p className="text-muted-foreground">Szczegóły wyceny</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => window.open(`/api/quotes/${quote.id}/print`, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Drukuj
            </Button>
            <Link href={`/quotes/${quote.id}/edit`}>
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                Edytuj
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quote Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Szczegóły wyceny
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Numer wyceny</label>
                    <p className="text-lg font-semibold">{quote.quoteNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(quote.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data utworzenia</label>
                    <p className="text-lg">{formatDate(quote.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Utworzył</label>
                    <p className="text-lg">
                      {quote.createdBy 
                        ? (quote.createdBy.firstName && quote.createdBy.lastName 
                            ? `${quote.createdBy.firstName} ${quote.createdBy.lastName}`
                            : quote.createdBy.email || 'Nieznany użytkownik')
                        : 'Wycena gościnna'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quote Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Pozycje wyceny
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quote.items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg mb-2">Brak pozycji w wycenie</p>
                      <p className="text-sm mb-4">Dodaj sprzęt do wyceny, aby rozpocząć kalkulację kosztów.</p>
                      <Link href={`/quotes/${quote.id}/edit`}>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Dodaj pierwszą pozycję
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    quote.items.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{item.equipment.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.equipment.category.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatCurrency(item.totalPrice)}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} szt. × {getRentalPeriodText(item.rentalPeriodDays)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Cena za dzień:</span>
                            <p>{formatCurrency(item.pricePerDay)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Rabat:</span>
                            <p>{item.discountPercent}%</p>
                          </div>
                          <div>
                            <span className="font-medium">Okres wynajmu:</span>
                            <p>{getRentalPeriodText(item.rentalPeriodDays)}</p>
                          </div>
                        </div>

                        {/* Additional costs */}
                        <div className="mt-3 space-y-2">
                          {item.includeFuelCost && item.totalFuelCost && (
                            <div className="flex justify-between text-sm">
                              <span>Koszt paliwa:</span>
                              <span>{formatCurrency(item.totalFuelCost)}</span>
                            </div>
                          )}
                          {item.includeInstallationCost && item.totalInstallationCost && (
                            <div className="flex justify-between text-sm">
                              <span>Koszt montażu:</span>
                              <span>{formatCurrency(item.totalInstallationCost)}</span>
                            </div>
                          )}
                          {item.includeMaintenanceCost && item.totalMaintenanceCost && (
                            <div className="flex justify-between text-sm">
                              <span>Koszt eksploatacji:</span>
                              <span>{formatCurrency(item.totalMaintenanceCost)}</span>
                            </div>
                          )}
                          {item.includeServiceItems && item.totalServiceItemsCost && (
                            <div className="flex justify-between text-sm">
                              <span>Koszty serwisowe:</span>
                              <span>{formatCurrency(item.totalServiceItemsCost)}</span>
                            </div>
                          )}
                        </div>

                        {item.notes && (
                          <div className="mt-3 p-3 bg-muted rounded">
                            <p className="text-sm"><strong>Uwagi:</strong> {item.notes}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Dane klienta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-lg font-semibold">{quote.client.companyName}</p>
                  {quote.client.nip && (
                    <p className="text-sm text-muted-foreground">NIP: {quote.client.nip}</p>
                  )}
                </div>
                
                {quote.client.contactPerson && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{quote.client.contactPerson}</span>
                  </div>
                )}
                
                {quote.client.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{quote.client.email}</span>
                  </div>
                )}
                
                {quote.client.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{quote.client.phone}</span>
                  </div>
                )}
                
                {quote.client.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{quote.client.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quote Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Podsumowanie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Wartość netto:</span>
                  <span className="font-medium">{formatCurrency(quote.totalNet)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Wartość brutto:</span>
                  <span className="font-medium">{formatCurrency(quote.totalGross)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Liczba pozycji:</span>
                  <span className="font-medium">{quote.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ostatnia modyfikacja:</span>
                  <span className="font-medium">{formatDate(quote.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}