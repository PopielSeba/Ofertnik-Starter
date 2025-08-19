import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ClipboardList, 
  Calendar, 
  User, 
  Building2, 
  Phone, 
  Mail,
  MapPin,
  Printer,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

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
  categoryType?: string;
}

interface NeedsAssessmentPrintProps {
  id: string;
}

export default function NeedsAssessmentPrint({ id }: NeedsAssessmentPrintProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Query for getting the specific response
  const { data: response, isLoading } = useQuery<NeedsAssessmentResponse>({
    queryKey: [`/api/needs-assessment/responses/${id}`],
    enabled: !!id && !!user,
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

  const groupResponsesByCategory = (responses: Record<string, string>) => {
    const grouped: Record<string, Array<{questionId: string, question: string, answer: string}>> = {};
    
    Object.entries(responses).forEach(([questionId, answer]) => {
      if (answer && answer.trim()) {
        const category = getQuestionCategory(questionId);
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push({
          questionId,
          question: getQuestionText(questionId),
          answer
        });
      }
    });

    return grouped;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBackToList = () => {
    setLocation("/needs-assessment-list");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie badania potrzeb...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Nie znaleziono badania</h2>
          <p className="text-muted-foreground mb-4">Badanie potrzeb o podanym ID nie istnieje.</p>
          <Button onClick={handleBackToList}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót do listy
          </Button>
        </div>
      </div>
    );
  }

  const groupedResponses = groupResponsesByCategory(response.responses);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header - hidden when printing */}
        <div className="mb-6 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ClipboardList className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Badanie Potrzeb #{response.responseNumber}
                </h1>
                <p className="text-muted-foreground">
                  Utworzone: {formatDate(response.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleBackToList}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do listy
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Drukuj
              </Button>
            </div>
          </div>
        </div>

        {/* Print Header - visible only when printing */}
        <div className="hidden print:block mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">BADANIE POTRZEB KLIENTA</h1>
          <p className="text-lg">Numer: {response.responseNumber}</p>
          <p className="text-sm text-gray-600">
            Data utworzenia: {formatDate(response.createdAt)}
          </p>
          <Separator className="my-4" />
        </div>

        {/* Company Header for Print */}
        <div className="hidden print:block mb-8 text-center">
          <h2 className="text-xl font-bold">PPP :: Program</h2>
          <p className="text-sm text-gray-600">Wynajem sprzętu</p>
          <Separator className="my-4" />
        </div>

        {/* Client Information */}
        <Card className="mb-6 print:shadow-none print:border-2 print:border-black">
          <CardHeader className="print:pb-2">
            <CardTitle className="flex items-center print:text-lg">
              <Building2 className="w-5 h-5 mr-2 print:hidden" />
              Informacje o kliencie
            </CardTitle>
          </CardHeader>
          <CardContent className="print:pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              {response.clientCompanyName && (
                <div className="flex items-center space-x-2 print:text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground print:hidden" />
                  <span className="font-medium">Firma:</span>
                  <span>{response.clientCompanyName}</span>
                </div>
              )}
              {response.clientContactPerson && (
                <div className="flex items-center space-x-2 print:text-sm">
                  <User className="w-4 h-4 text-muted-foreground print:hidden" />
                  <span className="font-medium">Kontakt:</span>
                  <span>{response.clientContactPerson}</span>
                </div>
              )}
              {response.clientPhone && (
                <div className="flex items-center space-x-2 print:text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground print:hidden" />
                  <span className="font-medium">Telefon:</span>
                  <span>{response.clientPhone}</span>
                </div>
              )}
              {response.clientEmail && (
                <div className="flex items-center space-x-2 print:text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground print:hidden" />
                  <span className="font-medium">Email:</span>
                  <span>{response.clientEmail}</span>
                </div>
              )}
            </div>
            {response.clientAddress && (
              <div className="mt-4 flex items-start space-x-2 print:mt-2 print:text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1 print:hidden" />
                <div>
                  <span className="font-medium">Adres:</span>
                  <p className="text-sm text-muted-foreground mt-1 print:text-black print:mt-0 print:inline print:ml-2">
                    {response.clientAddress}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responses by Category */}
        <div className="space-y-6 print:space-y-4">
          {Object.entries(groupedResponses).map(([category, categoryResponses]) => (
            <Card key={category} className="print:shadow-none print:border print:border-gray-400 print:break-inside-avoid">
              <CardHeader className="print:pb-2">
                <CardTitle className="print:text-base">{category}</CardTitle>
              </CardHeader>
              <CardContent className="print:pt-0">
                <div className="space-y-4 print:space-y-2">
                  {categoryResponses.map(({ questionId, question, answer }) => (
                    <div key={questionId} className="border-l-2 border-gray-200 pl-4 print:border-l print:border-gray-400 print:pl-2 print:break-inside-avoid">
                      <p className="font-medium text-sm mb-1 print:text-xs print:mb-0">{question}</p>
                      <p className="text-muted-foreground print:text-black print:text-xs">{answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer for Print */}
        <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-gray-600">
          <p>PPP :: Program - Wynajem sprzętu</p>
          <p>Data wydruku: {new Date().toLocaleDateString('pl-PL')}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          
          body {
            font-size: 12pt;
            line-height: 1.4;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:inline {
            display: inline !important;
          }
          
          .print\\:text-xs {
            font-size: 10pt;
          }
          
          .print\\:text-sm {
            font-size: 11pt;
          }
          
          .print\\:text-base {
            font-size: 12pt;
          }
          
          .print\\:text-lg {
            font-size: 14pt;
          }
          
          .print\\:text-black {
            color: black !important;
          }
          
          .print\\:border {
            border: 1px solid #000 !important;
          }
          
          .print\\:border-2 {
            border-width: 2px !important;
          }
          
          .print\\:border-black {
            border-color: black !important;
          }
          
          .print\\:border-gray-400 {
            border-color: #9ca3af !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          
          .print\\:space-y-2 > * + * {
            margin-top: 0.5rem;
          }
          
          .print\\:space-y-4 > * + * {
            margin-top: 1rem;
          }
          
          .print\\:mt-0 {
            margin-top: 0 !important;
          }
          
          .print\\:mt-2 {
            margin-top: 0.5rem !important;
          }
          
          .print\\:mb-0 {
            margin-bottom: 0 !important;
          }
          
          .print\\:pb-2 {
            padding-bottom: 0.5rem !important;
          }
          
          .print\\:pt-0 {
            padding-top: 0 !important;
          }
          
          .print\\:pl-2 {
            padding-left: 0.5rem !important;
          }
          
          .print\\:ml-2 {
            margin-left: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}