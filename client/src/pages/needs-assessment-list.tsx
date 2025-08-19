import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ClipboardList, 
  Eye, 
  Calendar, 
  User, 
  Building2, 
  Phone, 
  Mail,
  MapPin,
  Printer,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NeedsAssessmentResponse {
  id: number;
  responseNumber: string;
  clientCompanyName?: string;
  clientContactPerson?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  responses: Record<string, string>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface NeedsAssessmentQuestion {
  id: number;
  category: string;
  question: string;
  type: string;
  position: number;
}

export default function NeedsAssessmentList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedResponse, setSelectedResponse] = useState<NeedsAssessmentResponse | null>(null);

  // Query for getting all responses (for all authenticated users)
  const { data: responses = [], isLoading } = useQuery<NeedsAssessmentResponse[]>({
    queryKey: ["/api/needs-assessment/responses"],
    enabled: !!user,
  });

  // Query for getting questions to display question text
  const { data: questions = [] } = useQuery<NeedsAssessmentQuestion[]>({
    queryKey: ["/api/needs-assessment/questions"],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQuestionText = (questionId: string) => {
    const question = questions.find(q => q.id.toString() === questionId);
    return question ? question.question : `Pytanie ${questionId}`;
  };

  const getQuestionCategory = (questionId: string) => {
    const question = questions.find(q => q.id.toString() === questionId);
    return question ? question.category : 'Nieznana kategoria';
  };

  // Delete mutation for admin users
  const deleteResponseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/needs-assessment/responses/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sukces",
        description: "Badanie potrzeb zostało usunięte",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/needs-assessment/responses"] });
      setSelectedResponse(null);
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć badania potrzeb",
        variant: "destructive",
      });
    },
  });

  const groupResponsesByCategory = (responses: Record<string, string>) => {
    const grouped: Record<string, Array<{questionId: string, answer: string, question: string}>> = {};
    
    Object.entries(responses).forEach(([questionId, answer]) => {
      if (answer && answer.trim()) {
        const category = getQuestionCategory(questionId);
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push({
          questionId,
          answer,
          question: getQuestionText(questionId)
        });
      }
    });
    
    return grouped;
  };

  if (!user) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Brak dostępu</h2>
              <p className="text-muted-foreground">
                Musisz być zalogowany aby przeglądać zapisane badania potrzeb.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedResponse) {
    const groupedResponses = groupResponsesByCategory(selectedResponse.responses);

    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ClipboardList className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Badanie Potrzeb #{selectedResponse.responseNumber}
                  </h1>
                  <p className="text-muted-foreground">
                    Utworzone: {formatDate(selectedResponse.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedResponse(null)}
                >
                  Powrót do listy
                </Button>
                {(user as any)?.role === 'admin' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Usuń badanie
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Potwierdź usunięcie</AlertDialogTitle>
                        <AlertDialogDescription>
                          Czy na pewno chcesz usunąć badanie potrzeb #{selectedResponse.responseNumber}? 
                          Ta akcja jest nieodwracalna.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteResponseMutation.mutate(selectedResponse.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Usuń
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>

          {/* Client Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Informacje o kliencie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedResponse.clientCompanyName && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Firma:</span>
                    <span>{selectedResponse.clientCompanyName}</span>
                  </div>
                )}
                {selectedResponse.clientContactPerson && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Kontakt:</span>
                    <span>{selectedResponse.clientContactPerson}</span>
                  </div>
                )}
                {selectedResponse.clientPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Telefon:</span>
                    <span>{selectedResponse.clientPhone}</span>
                  </div>
                )}
                {selectedResponse.clientEmail && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{selectedResponse.clientEmail}</span>
                  </div>
                )}
              </div>
              {selectedResponse.clientAddress && (
                <div className="mt-4 flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="font-medium">Adres:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResponse.clientAddress}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responses by Category */}
          <div className="space-y-6">
            {Object.entries(groupedResponses).map(([category, categoryResponses]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryResponses.map(({ questionId, question, answer }) => (
                      <div key={questionId} className="border-l-2 border-gray-200 pl-4">
                        <p className="font-medium text-sm mb-1">{question}</p>
                        <p className="text-muted-foreground">{answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <ClipboardList className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Zapisane Badania Potrzeb</h1>
          </div>
          <p className="text-muted-foreground">
            Przeglądaj wszystkie przeprowadzone badania potrzeb klientów
          </p>
        </div>

        {/* Responses List */}
        {responses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Brak zapisanych badań</h3>
              <p className="text-muted-foreground">
                Nie ma jeszcze żadnych przeprowadzonych badań potrzeb.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {responses.map((response) => {
              const answeredQuestions = Object.values(response.responses).filter(answer => answer && answer.trim()).length;
              
              return (
                <Card key={response.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            #{response.responseNumber}
                          </h3>
                          <Badge variant="secondary">
                            {answeredQuestions} odpowiedzi
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {response.clientCompanyName && (
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4" />
                              <span>{response.clientCompanyName}</span>
                            </div>
                          )}
                          {response.clientContactPerson && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{response.clientContactPerson}</span>
                            </div>
                          )}
                          {response.clientPhone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{response.clientPhone}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(response.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedResponse(response)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Podgląd
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Drukuj badanie potrzeb"
                          className="bg-green-50 hover:bg-green-100 border-green-200"
                          onClick={() => window.open(`/api/needs-assessment/responses/${response.id}/print`, '_blank')}
                        >
                          <Printer className="w-4 h-4 text-green-600" />
                        </Button>
                        {(user as any)?.role === 'admin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Potwierdź usunięcie</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Czy na pewno chcesz usunąć badanie potrzeb #{response.responseNumber}? 
                                  Ta akcja jest nieodwracalna.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteResponseMutation.mutate(response.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Usuń
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}