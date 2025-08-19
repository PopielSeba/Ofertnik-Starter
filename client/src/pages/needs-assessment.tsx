import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Save, FileText, User, Building } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const clientSchema = z.object({
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
}).refine(
  (data) => {
    return data.companyName || data.contactPerson || data.phone || data.email;
  },
  {
    message: "Wypełnij przynajmniej jedno pole: nazwę firmy, osobę kontaktową, telefon lub email",
    path: ["companyName"],
  }
);

interface NeedsAssessmentQuestion {
  id: number;
  category: string;
  question: string;
  type: string;
  options?: any;
  isRequired: boolean;
  position: number;
  isActive: boolean;
  categoryType?: string;
}

// Te listy będą budowane dynamicznie z rzeczywistych danych z bazy

const mandatoryCategories = [
  "Informacje ogólne",
  "Warunki otoczenia",
  "Logistyka i dodatkowe usługi",
  "Dodatkowe informacje"
];

export default function NeedsAssessment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});

  const clientForm = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  // Query for getting questions
  const { data: questions = [], isLoading } = useQuery<NeedsAssessmentQuestion[]>({
    queryKey: ["/api/needs-assessment/questions"],
  });

  // Separate questions by category type  
  const generalQuestions = questions.filter(q => q.categoryType === 'general' || !q.categoryType);
  const equipmentQuestions = questions.filter(q => q.categoryType === 'equipment');

  // Build dynamic list of all categories with proper ordering
  const allCategories = useMemo(() => {
    // First get general categories
    const generalCats = Array.from(new Set(generalQuestions.map(q => q.category)));
    // Then get equipment categories
    const equipmentCats = Array.from(new Set(equipmentQuestions.map(q => q.category)));
    
    // Sort general categories to ensure mandatory categories appear first
    const sortedGeneralCats = generalCats.sort((a, b) => {
      const aIsMandatory = mandatoryCategories.includes(a);
      const bIsMandatory = mandatoryCategories.includes(b);
      
      if (aIsMandatory && !bIsMandatory) return -1;
      if (!aIsMandatory && bIsMandatory) return 1;
      
      if (aIsMandatory && bIsMandatory) {
        return mandatoryCategories.indexOf(a) - mandatoryCategories.indexOf(b);
      }
      
      return a.localeCompare(b);
    });
    
    // Sort equipment categories alphabetically
    const sortedEquipmentCats = equipmentCats.sort((a, b) => a.localeCompare(b));
    
    // Return general categories first, then equipment categories
    return [...sortedGeneralCats, ...sortedEquipmentCats];
  }, [generalQuestions, equipmentQuestions]);

  // Group questions by category with conditional equipment sections (use useMemo for reactivity)
  const questionsByCategory = useMemo(() => {
    const result = allCategories.map(category => {
      // Check if this is an equipment accessory category
      const isEquipmentAccessory = category.includes(' - wyposażenie');
      
      if (isEquipmentAccessory) {
        // Extract the base equipment category and handle name variations
        let baseCategory = category.replace(' - wyposażenie', '');
        
        // Handle the name mapping differences between database categories
        if (baseCategory === 'Maszty oświetleniowe') {
          baseCategory = 'Maszt oświetleniowy';
        } else if (baseCategory === 'Nagrzewnice') {
          baseCategory = 'Nagrzewnica';
        }
        
        // Only include this accessory category if the base equipment category is selected
        if (!selectedCategories[baseCategory]) {
          return null; // Don't show equipment accessories if base equipment not selected
        }
      }
      
      return {
        category,
        questions: questions.filter(q => q.category === category && q.isActive)
          .sort((a, b) => a.position - b.position)
      };
    }).filter(group => group !== null && group.questions.length > 0);
    
    return result;
  }, [questions, selectedCategories, allCategories]); // Re-calculate when questions or selectedCategories change

  const currentCategory = questionsByCategory[currentStep];

  // Effect to handle currentStep adjustment when categories change due to equipment selection
  useEffect(() => {
    // If current step is beyond available categories, adjust it
    if (currentStep >= questionsByCategory.length && questionsByCategory.length > 0) {
      setCurrentStep(questionsByCategory.length - 1);
    }
  }, [questionsByCategory.length, currentStep]);

  const handleResponseChange = (questionId: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: checked
    }));
    
    // If unchecking a category, clear all responses for that category AND its equipment accessories
    if (!checked) {
      const categoryQuestions = questions.filter(q => q.category === category);
      const equipmentAccessoryQuestions = questions.filter(q => q.category === `${category} - wyposażenie`);
      
      setResponses(prev => {
        const newResponses = { ...prev };
        // Clear main category questions
        categoryQuestions.forEach(q => {
          delete newResponses[q.id];
        });
        // Clear equipment accessory questions
        equipmentAccessoryQuestions.forEach(q => {
          delete newResponses[q.id];
        });
        return newResponses;
      });
    }
  };

  const isCategorySelected = (category: string) => {
    // Mandatory categories are always "selected"
    if (mandatoryCategories.includes(category)) {
      return true;
    }
    return selectedCategories[category] === true;
  };

  const isCategoryMandatory = (category: string) => {
    return mandatoryCategories.includes(category);
  };

  const saveResponsesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/needs-assessment/responses", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sukces",
        description: `Badanie potrzeb zostało zapisane z numerem ${data.responseNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/needs-assessment/responses"] });
      
      // Przekieruj do wydruku badania
      setLocation(`/needs-assessment/${data.id}/print`);
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zapisać badania potrzeb",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const clientData = clientForm.getValues();
    
    // Validate that at least one client field is filled
    if (!clientData.companyName && !clientData.contactPerson && !clientData.phone && !clientData.email) {
      toast({
        title: "Błąd",
        description: "Wypełnij przynajmniej jedno pole klienta",
        variant: "destructive",
      });
      return;
    }

    const assessmentData = {
      clientCompanyName: clientData.companyName,
      clientContactPerson: clientData.contactPerson,
      clientPhone: clientData.phone,
      clientEmail: clientData.email,
      clientAddress: clientData.address,
      responses: responses,
    };

    saveResponsesMutation.mutate(assessmentData);
  };

  const canGoNext = () => {
    if (!currentCategory) return false;
    
    // If category is not selected, we can skip it
    if (!isCategorySelected(currentCategory.category)) {
      return true;
    }
    
    // If category is selected, check required questions are answered
    const requiredQuestions = currentCategory.questions.filter(q => q.isRequired);
    return requiredQuestions.every(q => responses[q.id]?.trim());
  };

  const canGoPrevious = () => currentStep > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <ClipboardList className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Badanie Potrzeb</h1>
          </div>
          <p className="text-muted-foreground">
            Przeprowadź szczegółową analizę potrzeb klienta aby przygotować najlepszą ofertę
          </p>
        </div>

        {/* Client Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Informacje o kliencie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Nazwa firmy</Label>
                <Input
                  id="companyName"
                  {...clientForm.register("companyName")}
                  placeholder="np. ABC Sp. z o.o."
                />
              </div>
              <div>
                <Label htmlFor="contactPerson">Osoba kontaktowa</Label>
                <Input
                  id="contactPerson"
                  {...clientForm.register("contactPerson")}
                  placeholder="np. Jan Kowalski"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  {...clientForm.register("phone")}
                  placeholder="np. +48 123 456 789"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...clientForm.register("email")}
                  placeholder="np. kontakt@abc.pl"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Adres</Label>
              <Textarea
                id="address"
                {...clientForm.register("address")}
                placeholder="Pełny adres lokalizacji..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Progress indicator */}
        {questionsByCategory.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Krok {currentStep + 1} z {questionsByCategory.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(((currentStep + 1) / questionsByCategory.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / questionsByCategory.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Current Category Questions */}
        {currentCategory && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {!isCategoryMandatory(currentCategory.category) && (
                    <Checkbox
                      id={`category-${currentStep}`}
                      checked={isCategorySelected(currentCategory.category)}
                      onCheckedChange={(checked) => 
                        handleCategoryToggle(currentCategory.category, checked as boolean)
                      }
                    />
                  )}
                  <span>{currentCategory.category}</span>
                  {isCategoryMandatory(currentCategory.category) && (
                    <Badge variant="default" className="ml-2">Wymagane</Badge>
                  )}
                </div>
                <Badge variant="secondary">
                  {currentCategory.questions.length} pytań
                </Badge>
              </CardTitle>
              {!isCategoryMandatory(currentCategory.category) && (
                <p className="text-sm text-muted-foreground mt-2">
                  Zaznacz checkbox powyżej jeśli klient potrzebuje tego typu urządzenia
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {currentCategory.questions.map((question) => (
                <div key={question.id} className={`space-y-2 ${question.type === 'equipment_option' ? 'ml-6' : ''}`}>
                  {/* Equipment option - render as inline checkbox */}
                  {question.type === 'equipment_option' ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`q-${question.id}`}
                        checked={responses[question.id] === 'true'}
                        onCheckedChange={(checked) => 
                          handleResponseChange(question.id, checked ? 'true' : 'false')
                        }
                        disabled={!isCategorySelected(currentCategory.category)}
                      />
                      <Label htmlFor={`q-${question.id}`} className="text-sm font-normal">
                        {question.question}
                      </Label>
                    </div>
                  ) : question.type === 'multiple_choice' ? (
                    /* Multiple choice header - just display as heading */
                    <div className="font-medium text-base text-gray-800 mb-2">
                      {question.question}
                    </div>
                  ) : question.type === 'radio' ? (
                    /* Radio buttons */
                    <div>
                      <Label className="text-base font-medium">
                        {question.question}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <RadioGroup
                        value={responses[question.id] || ''}
                        onValueChange={(value) => handleResponseChange(question.id, value)}
                        disabled={!isCategorySelected(currentCategory.category)}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="tak" id={`${question.id}-tak`} />
                          <Label htmlFor={`${question.id}-tak`}>Tak</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nie" id={`${question.id}-nie`} />
                          <Label htmlFor={`${question.id}-nie`}>Nie</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ) : question.type === 'select' ? (
                    /* Select dropdown */
                    <div>
                      <Label className="text-base font-medium">
                        {question.question}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Select
                        value={responses[question.id] || ''}
                        onValueChange={(value) => handleResponseChange(question.id, value)}
                        disabled={!isCategorySelected(currentCategory.category)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Wybierz opcję" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="umiarkowana">Strefa umiarkowana</SelectItem>
                          <SelectItem value="kontynentalna">Strefa kontynentalna</SelectItem>
                          <SelectItem value="nadmorska">Strefa nadmorska</SelectItem>
                          <SelectItem value="górska">Strefa górska</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : question.type === 'number' ? (
                    /* Number input */
                    <div>
                      <Label className="text-base font-medium">
                        {question.question}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        type="number"
                        value={responses[question.id] || ""}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        placeholder="Wprowadź liczbę"
                        disabled={!isCategorySelected(currentCategory.category)}
                        className={!isCategorySelected(currentCategory.category) ? 'bg-gray-100 text-gray-400' : ''}
                      />
                    </div>
                  ) : question.type === 'checkbox' ? (
                    /* Single checkbox */
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`q-${question.id}`}
                        checked={responses[question.id] === 'true'}
                        onCheckedChange={(checked) => 
                          handleResponseChange(question.id, checked ? 'true' : 'false')
                        }
                        disabled={!isCategorySelected(currentCategory.category)}
                      />
                      <Label htmlFor={`q-${question.id}`} className="text-base font-medium">
                        {question.question}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                    </div>
                  ) : (
                    /* Default text inputs */
                    <div>
                      <Label className="text-base font-medium">
                        {question.question}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      
                      {question.type === "textarea" ? (
                        <Textarea
                          value={responses[question.id] || ""}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          placeholder="Wpisz swoją odpowiedź..."
                          rows={3}
                          disabled={!isCategorySelected(currentCategory.category)}
                          className={!isCategorySelected(currentCategory.category) ? 'bg-gray-100 text-gray-400' : ''}
                        />
                      ) : (
                        <Input
                          value={responses[question.id] || ""}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          placeholder="Wpisz swoją odpowiedź..."
                          disabled={!isCategorySelected(currentCategory.category)}
                          className={!isCategorySelected(currentCategory.category) ? 'bg-gray-100 text-gray-400' : ''}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Navigation and Save */}
        <div className="flex items-center justify-between">
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={!canGoPrevious()}
            >
              Poprzedni
            </Button>
            
            {currentStep < questionsByCategory.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canGoNext()}
              >
                Następny
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saveResponsesMutation.isPending || !canGoNext()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveResponsesMutation.isPending ? "Zapisywanie..." : "Zapisz badanie"}
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Odpowiedzi: {Object.keys(responses).length} / {questions.length}
          </div>
        </div>
      </div>
    </div>
  );
}