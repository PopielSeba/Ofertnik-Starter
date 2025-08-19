import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Database,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  
  const isDarkMode = theme === "dark";

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ustawienia</h1>
          <p className="text-gray-600 mt-2">Zarządzaj preferencjami aplikacji i ustawieniami konta</p>
        </div>

        <div className="grid gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Ustawienia ogólne
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Powiadomienia</Label>
                  <p className="text-sm text-gray-600">
                    Otrzymuj powiadomienia o nowych wycenach i aktualizacjach
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatyczne zapisywanie</Label>
                  <p className="text-sm text-gray-600">
                    Automatycznie zapisuj zmiany w wycenach podczas pracy
                  </p>
                </div>
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tryb ciemny</Label>
                  <p className="text-sm text-muted-foreground">
                    Przełącz na ciemny motyw interfejsu
                  </p>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Language and Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Język i region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Język interfejsu</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Polski (PL) - domyślny
                  </p>
                </div>
                <div>
                  <Label>Format daty</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    DD.MM.YYYY (europejski)
                  </p>
                </div>
                <div>
                  <Label>Waluta</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    PLN (Polski złoty)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Uprawnienia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Rola w systemie</Label>
                  <div className="mt-1">
                    {user.role === 'admin' ? (
                      <Badge className="bg-red-100 text-red-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Administrator
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">
                        Pracownik
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>Dostępne funkcje</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Tworzenie i edycja wycen
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Przeglądanie katalogu sprzętu
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Zarządzanie klientami
                    </div>
                    {user.role === 'admin' && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Panel administratora
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Zarządzanie sprzętem i cenami
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Zarządzanie użytkownikami
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Informacje systemowe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Wersja aplikacji</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Sebastian Popiel :: PPP :: Program v1.0.0
                  </p>
                </div>
                <div>
                  <Label>Ostatnia aktualizacja</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    15 stycznia 2025
                  </p>
                </div>
                <div>
                  <Label>Status systemu</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Działa poprawnie</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Strefa niebezpieczna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-red-700">Wyloguj się</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Zostaniesz wylogowany ze wszystkich sesji
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2 border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    Wyloguj się
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}