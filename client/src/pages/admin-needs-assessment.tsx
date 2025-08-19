import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ClipboardList, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const questionSchema = z.object({
  category: z.string().min(1, "Kategoria jest wymagana"),
  question: z.string().min(1, "Pytanie jest wymagane"),
  type: z.enum(["text", "textarea", "checkbox", "radio", "select", "number", "multiple_choice", "equipment_option"]),
  position: z.number().min(1),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
  categoryType: z.enum(["general", "equipment"]).default("general"),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface NeedsAssessmentQuestion {
  id: number;
  category: string;
  question: string;
  type: string;
  position: number;
  isRequired: boolean;
  isActive: boolean;
  categoryType: string;
}

const questionTypes = [
  { value: "text", label: "Tekst" },
  { value: "textarea", label: "Długi tekst" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio (Tak/Nie)" },
  { value: "select", label: "Lista wyboru" },
  { value: "number", label: "Liczba" },
  { value: "multiple_choice", label: "Nagłówek wyboru" },
  { value: "equipment_option", label: "Opcja wyposażenia" },
];

// Tę listę będziemy budować dynamicznie z rzeczywistych danych

export default function AdminNeedsAssessment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<NeedsAssessmentQuestion | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("general");
  const [categoryToDelete, setCategoryToDelete] = useState("");

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      category: "",
      question: "",
      type: "text",
      position: 1,
      isRequired: false,
      isActive: true,
      categoryType: "general",
    },
  });

  const { data: questions = [], isLoading } = useQuery<NeedsAssessmentQuestion[]>({
    queryKey: ["/api/needs-assessment/questions"],
  });

  // Budujemy listę kategorii z rzeczywistych danych z bazy
  const allCategories = useMemo(() => {
    if (!questions) return [];
    const uniqueCategories = new Set(questions.map(q => q.category));
    const categories = Array.from(uniqueCategories);
    return categories.sort();
  }, [questions]);

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const response = await apiRequest("/api/needs-assessment/questions", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sukces", description: "Pytanie zostało dodane" });
      queryClient.invalidateQueries({ queryKey: ["/api/needs-assessment/questions"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Błąd", description: error.message, variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<QuestionFormData> }) => {
      const response = await apiRequest(`/api/needs-assessment/questions/${id}`, "PATCH", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sukces", description: "Pytanie zostało zaktualizowane" });
      queryClient.invalidateQueries({ queryKey: ["/api/needs-assessment/questions"] });
      setEditingQuestion(null);
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Błąd", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/needs-assessment/questions/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Sukces", description: "Pytanie zostało usunięte" });
      queryClient.invalidateQueries({ queryKey: ["/api/needs-assessment/questions"] });
    },
    onError: (error: any) => {
      toast({ title: "Błąd", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest(`/api/needs-assessment/questions/${id}`, "PATCH", { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/needs-assessment/questions"] });
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const handleEdit = (question: NeedsAssessmentQuestion) => {
    setEditingQuestion(question);
    form.reset({
      category: question.category,
      question: question.question,
      type: question.type as any,
      position: question.position,
      isRequired: question.isRequired,
      isActive: question.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Czy na pewno chcesz usunąć to pytanie?")) {
      deleteQuestionMutation.mutate(id);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      form.setValue("category", newCategory.trim());
      setNewCategory("");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      // Tworzymy pytanie typu "multiple_choice" jako nagłówek kategorii
      const categoryData = {
        category: newCategoryName.trim(),
        question: `Wybierz opcje dla kategorii: ${newCategoryName.trim()}`,
        type: "multiple_choice" as const,
        position: 1,
        isRequired: false,
        isActive: true,
        categoryType: newCategoryType as "general" | "equipment",
      };
      
      await createQuestionMutation.mutateAsync(categoryData);
      
      // Automatycznie tworzymy też kategorię wyposażenia (tylko dla kategorii sprzętu)
      if (newCategoryType === "equipment") {
        const equipmentCategoryData = {
          category: `${newCategoryName.trim()} - wyposażenie`,
          question: `Dodatkowe wyposażenie i akcesoria dla: ${newCategoryName.trim()}`,
          type: "multiple_choice" as const, 
          position: 1,
          isRequired: false,
          isActive: true,
          categoryType: "equipment" as const,
        };
        
        await createQuestionMutation.mutateAsync(equipmentCategoryData);
      }
      
      const message = newCategoryType === "equipment" 
        ? `Kategoria "${newCategoryName}" i "${newCategoryName} - wyposażenie" zostały utworzone`
        : `Kategoria "${newCategoryName}" została utworzona`;
      
      toast({ 
        title: "Sukces", 
        description: message
      });
      
      setNewCategoryName("");
      setNewCategoryType("general");
      setIsCategoryDialogOpen(false);
    } catch (error) {
      toast({ 
        title: "Błąd", 
        description: "Nie udało się utworzyć kategorii",
        variant: "destructive" 
      });
    }
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      await apiRequest(`/api/needs-assessment/categories/${encodeURIComponent(categoryName)}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Sukces", description: "Kategoria została usunięta" });
      queryClient.invalidateQueries({ queryKey: ["/api/needs-assessment/questions"] });
      setIsDeleteCategoryDialogOpen(false);
      setCategoryToDelete("");
    },
    onError: (error: any) => {
      toast({ title: "Błąd", description: error.message, variant: "destructive" });
    },
  });

  const handleDeleteCategory = () => {
    if (categoryToDelete.trim()) {
      deleteCategoryMutation.mutate(categoryToDelete);
    }
  };

  const groupedQuestions = questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, NeedsAssessmentQuestion[]>);

  if (isLoading) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <ClipboardList className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Zarządzanie Badaniem Potrzeb</h1>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingQuestion(null); form.reset(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj pytanie
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj kategorię
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dodaj nową kategorię sprzętu</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newCategoryName">Nazwa kategorii</Label>
                    <Input
                      id="newCategoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="np. Samochody"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCategoryType">Typ kategorii</Label>
                    <Select value={newCategoryType} onValueChange={setNewCategoryType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz typ kategorii" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Kategoria ogólna</SelectItem>
                        <SelectItem value="equipment">Kategoria sprzętu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCategoryDialogOpen(false)}
                    >
                      Anuluj
                    </Button>
                    <Button
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      Dodaj kategorię
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Usuń kategorię
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Usuń kategorię</DialogTitle>
                  <DialogDescription>
                    Wybierz kategorię do usunięcia. Wszystkie pytania w tej kategorii zostaną usunięte.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryToDelete">Kategoria do usunięcia</Label>
                    <Select value={categoryToDelete} onValueChange={setCategoryToDelete}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz kategorię" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsDeleteCategoryDialogOpen(false);
                        setCategoryToDelete("");
                      }}
                    >
                      Anuluj
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteCategory}
                      disabled={!categoryToDelete.trim()}
                    >
                      Usuń kategorię
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? "Edytuj pytanie" : "Dodaj nowe pytanie"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="category">Kategoria</Label>
                  <div className="flex space-x-2">
                    <Select
                      value={form.watch("category")}
                      onValueChange={(value) => form.setValue("category", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Wybierz kategorię" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex space-x-2 mt-2">
                    <Input
                      placeholder="Lub dodaj nową kategorię"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddCategory} variant="outline">
                      Dodaj
                    </Button>
                  </div>
                  {form.formState.errors.category && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="question">Pytanie</Label>
                  <Textarea
                    {...form.register("question")}
                    placeholder="Wpisz treść pytania..."
                    rows={3}
                  />
                  {form.formState.errors.question && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.question.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Typ pytania</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(value) => form.setValue("type", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoryType">Typ kategorii</Label>
                  <Select
                    value={form.watch("categoryType")}
                    onValueChange={(value) => form.setValue("categoryType", value as "general" | "equipment")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Kategoria ogólna</SelectItem>
                      <SelectItem value="equipment">Kategoria sprzętu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="position">Pozycja</Label>
                  <Input
                    type="number"
                    {...form.register("position", { valueAsNumber: true })}
                    min="1"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRequired"
                      checked={form.watch("isRequired")}
                      onCheckedChange={(checked) => form.setValue("isRequired", checked as boolean)}
                    />
                    <Label htmlFor="isRequired">Wymagane</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={form.watch("isActive")}
                      onCheckedChange={(checked) => form.setValue("isActive", checked as boolean)}
                    />
                    <Label htmlFor="isActive">Aktywne</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="submit"
                    disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                  >
                    {editingQuestion ? "Zapisz zmiany" : "Dodaj pytanie"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category}</span>
                  <Badge variant="secondary">
                    {categoryQuestions.length} pytań
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pozycja</TableHead>
                      <TableHead>Pytanie</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryQuestions
                      .sort((a, b) => a.position - b.position)
                      .map((question) => (
                        <TableRow key={question.id}>
                          <TableCell>{question.position}</TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate">{question.question}</div>
                            {question.isRequired && (
                              <Badge variant="outline" className="mt-1">
                                Wymagane
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {questionTypes.find(t => t.value === question.type)?.label || question.type}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={question.isActive}
                                onCheckedChange={(checked) =>
                                  toggleActiveStatusMutation.mutate({
                                    id: question.id,
                                    isActive: checked as boolean,
                                  })
                                }
                              />
                              <span className={question.isActive ? "text-green-600" : "text-gray-400"}>
                                {question.isActive ? "Aktywne" : "Nieaktywne"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(question)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(question.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}