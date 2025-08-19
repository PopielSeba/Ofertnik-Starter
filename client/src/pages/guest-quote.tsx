import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Trash2, 
  Calculator, 
  FileText, 
  Mail,
  Building,
  User,
  Phone,
  MapPin
} from "lucide-react";

interface Equipment {
  id: number;
  name: string;
  description?: string;
  model?: string;
  power?: string;
  category: {
    id: number;
    name: string;
  };
  pricing: Array<{
    id: number;
    periodStart: number;
    periodEnd?: number;
    pricePerDay: string;
    discountPercent: string;
  }>;
}

interface QuoteItem {
  equipmentId: number;
  equipment?: Equipment;
  quantity: number;
  rentalPeriodDays: number;
  pricePerDay: number;
  totalPrice: number;
  notes?: string;
}

interface ClientData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  nip?: string;
}

export default function GuestQuote() {
  const { toast } = useToast();
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [clientData, setClientData] = useState<ClientData>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    nip: ""
  });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const createGuestQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/quotes/guest", data);
      return response.json();
    },
    onSuccess: (quote) => {
      toast({
        title: "Sukces",
        description: "Wycena została utworzona pomyślnie",
      });
      
      // Reset form
      setQuoteItems([]);
      setClientData({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        nip: ""
      });
      setNotes("");
      setGuestEmail("");
      
      // Show quote number
      toast({
        title: "Numer wyceny",
        description: `Twoja wycena: ${quote.quoteNumber}`,
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć wyceny",
        variant: "destructive",
      });
    },
  });

  const addQuoteItem = () => {
    setQuoteItems([...quoteItems, {
      equipmentId: 0,
      quantity: 1,
      rentalPeriodDays: 1,
      pricePerDay: 0,
      totalPrice: 0,
      notes: ""
    }]);
  };

  const removeQuoteItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const updateQuoteItem = (index: number, field: string, value: any) => {
    const updatedItems = [...quoteItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'equipmentId') {
      const selectedEquipment = equipment.find(e => e.id === value);
      if (selectedEquipment) {
        updatedItems[index].equipment = selectedEquipment;
        // Set default price from first pricing tier
        if (selectedEquipment.pricing.length > 0) {
          updatedItems[index].pricePerDay = parseFloat(selectedEquipment.pricing[0].pricePerDay);
        }
      }
    }

    // Recalculate total price
    if (field === 'quantity' || field === 'rentalPeriodDays' || field === 'pricePerDay') {
      const item = updatedItems[index];
      item.totalPrice = item.quantity * item.rentalPeriodDays * item.pricePerDay;
    }

    setQuoteItems(updatedItems);
  };

  const calculateTotalNet = () => {
    return quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateTotalGross = () => {
    const net = calculateTotalNet();
    return net * 1.23; // 23% VAT
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!guestEmail || !clientData.companyName || quoteItems.length === 0) {
      toast({
        title: "Błąd",
        description: "Wypełnij wszystkie wymagane pola",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const totalNet = calculateTotalNet();
    const totalGross = calculateTotalGross();

    const quoteData = {
      guestEmail,
      clientData,
      totalNet: totalNet.toFixed(2),
      totalGross: totalGross.toFixed(2),
      notes,
      items: quoteItems.map(item => ({
        equipmentId: item.equipmentId,
        quantity: item.quantity,
        rentalPeriodDays: item.rentalPeriodDays,
        pricePerDay: item.pricePerDay.toFixed(2),
        totalPrice: item.totalPrice.toFixed(2),
        notes: item.notes
      }))
    };

    try {
      await createGuestQuoteMutation.mutateAsync(quoteData);
    } catch (error) {
      console.error("Error creating guest quote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Kalkulator Wyceny</h1>
          <p className="text-gray-600 mt-2">Utwórz wycenę na wynajem sprzętu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Guest Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Twoje dane kontaktowe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guestEmail">Email do kontaktu *</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="twoj@email.com"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Dane klienta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Nazwa firmy *</Label>
                  <Input
                    id="companyName"
                    value={clientData.companyName}
                    onChange={(e) => setClientData({...clientData, companyName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Osoba kontaktowa</Label>
                  <Input
                    id="contactPerson"
                    value={clientData.contactPerson}
                    onChange={(e) => setClientData({...clientData, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({...clientData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={clientData.phone}
                    onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="nip">NIP</Label>
                  <Input
                    id="nip"
                    value={clientData.nip}
                    onChange={(e) => setClientData({...clientData, nip: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    value={clientData.address}
                    onChange={(e) => setClientData({...clientData, address: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Selection */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Wybór sprzętu
                </CardTitle>
                <Button type="button" onClick={addQuoteItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj sprzęt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quoteItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Pozycja {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuoteItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Sprzęt</Label>
                        <Select
                          value={item.equipmentId.toString()}
                          onValueChange={(value) => updateQuoteItem(index, 'equipmentId', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz sprzęt" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipment.map((eq) => (
                              <SelectItem key={eq.id} value={eq.id.toString()}>
                                {eq.name} {eq.model && `(${eq.model})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Ilość</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuoteItem(index, 'quantity', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div>
                        <Label>Okres wynajmu (dni)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.rentalPeriodDays}
                          onChange={(e) => updateQuoteItem(index, 'rentalPeriodDays', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Cena za dzień (PLN)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.pricePerDay}
                          onChange={(e) => updateQuoteItem(index, 'pricePerDay', parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div>
                        <Label>Łączna cena (PLN)</Label>
                        <Input
                          type="number"
                          value={item.totalPrice.toFixed(2)}
                          readOnly
                          className="bg-gray-100"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Uwagi</Label>
                      <Textarea
                        value={item.notes}
                        onChange={(e) => updateQuoteItem(index, 'notes', e.target.value)}
                        placeholder="Dodatkowe uwagi do tej pozycji..."
                      />
                    </div>
                  </div>
                ))}
                
                {quoteItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Dodaj sprzęt do wyceny</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Dodatkowe uwagi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dodatkowe uwagi do całej wyceny..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          {quoteItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Podsumowanie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Wartość netto:</span>
                    <span className="font-medium">{calculateTotalNet().toFixed(2)} PLN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (23%):</span>
                    <span className="font-medium">{(calculateTotalGross() - calculateTotalNet()).toFixed(2)} PLN</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Wartość brutto:</span>
                    <span>{calculateTotalGross().toFixed(2)} PLN</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              disabled={isSubmitting || quoteItems.length === 0}
              className="min-w-48"
            >
              {isSubmitting ? "Tworzenie wyceny..." : "Utwórz wycenę"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}