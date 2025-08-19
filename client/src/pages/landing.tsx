import { Button } from "@/components/ui/button";
import { Settings, Calculator, UserPlus, Info } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center text-white mb-16">
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Settings className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Ofertnik - System wycen dla wypożyczalni</h1>
            <p className="text-xl opacity-90">Od 30 minut ręcznego liczenia do 2 minut gotowej oferty z automatycznymi rabatami</p>
          </div>
          


          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-2">
              Dostęp wymaga logowania
            </h2>
            <p className="text-white/80 mb-4">
              Aby uzyskać dostęp do systemu zarządzania wypożyczalnią, konieczne jest zalogowanie się przez Replit.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3 text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              Zaloguj się do systemu
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 font-semibold px-8 py-3 text-lg backdrop-blur-sm"
              onClick={() => window.location.href = '/api/login'}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Nowy użytkownik
            </Button>
          </div>

          <div className="mt-6 bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-200 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-white mb-1">Informacja dla nowych użytkowników</h3>
                <p className="text-blue-100 text-sm">
                  Po pierwszym logowaniu Twoje konto wymaga zatwierdzenia przez administratora. 
                  Po akceptacji otrzymasz pełen dostęp do systemu wycen wypożyczalni.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-white/80">
          <p className="text-sm">
            Bezpieczny system logowania przez Replit Auth
          </p>
          <div className="text-white/60 text-xs mt-2">
            PPP :: Program
          </div>
        </div>
      </div>
    </div>
  );
}
