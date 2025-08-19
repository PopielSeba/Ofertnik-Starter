import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import CreateQuote from "./create-quote";

export default function EditQuote() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if not authenticated or not admin/employee
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'employee'))) {
      toast({
        title: "Brak uprawnień",
        description: "Dostęp do edycji wycen jest dostępny tylko dla pracowników i administratorów.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, user, authLoading, toast]);

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ["/api/quotes", id],
    enabled: !!id && isAuthenticated,
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
        </div>
      </div>
    );
  }

  // Pass the quote data to CreateQuote component for editing
  return <CreateQuote editingQuote={quote} />;
}