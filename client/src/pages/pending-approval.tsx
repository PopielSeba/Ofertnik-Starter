import { Clock, Phone } from "lucide-react";

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="max-w-lg w-full mx-auto p-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center text-white shadow-xl">
          {/* Header */}
          <h1 className="text-2xl font-bold mb-8 text-white">
            Ofertnik - System wycen dla wypożyczalni
          </h1>
          
          {/* Main content */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white/20 mb-6">
            <Clock className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-6">
            Oczekiwanie na akceptację rejestracji przez administratora
          </h2>
          
          {/* Phone contact info */}
          <div className="bg-blue-600/30 backdrop-blur-sm rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <Phone className="w-5 h-5 text-blue-200" />
              <div>
                <p className="text-blue-100 font-medium">
                  W celu przyspieszenia rejestracji - zadzwoń
                </p>
                <p className="text-white text-lg font-bold">
                  tel. 500-600-525
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-white/80 text-sm">
            PPP :: Program
          </div>
        </div>
      </div>
    </div>
  );
}