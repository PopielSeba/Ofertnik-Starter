import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Calendar } from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge className="bg-red-100 text-red-800">
        <Shield className="w-3 h-3 mr-1" />
        Administrator
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800">
        <User className="w-3 h-3 mr-1" />
        Pracownik
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profil użytkownika</h1>
          <p className="text-gray-600 mt-2">Zarządzaj swoimi danymi osobowymi i ustawieniami konta</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informacje osobowe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary text-white text-xl">
                    <User className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Imię</Label>
                      <Input
                        id="firstName"
                        value={user.firstName || ''}
                        disabled={!isEditing}
                        className="mt-1"
                        placeholder="Nie podano"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nazwisko</Label>
                      <Input
                        id="lastName"
                        value={user.lastName || ''}
                        disabled={!isEditing}
                        className="mt-1"
                        placeholder="Nie podano"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        value={user.email || ''}
                        disabled
                        className="flex-1"
                        placeholder="Nie podano"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Rola w systemie</Label>
                    <div className="mt-1">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Anuluj
                    </Button>
                    <Button onClick={() => setIsEditing(false)}>
                      Zapisz zmiany
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Edytuj profil
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informacje o koncie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data utworzenia konta</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.createdAt ? formatDate(user.createdAt) : 'Nie podano'}
                  </p>
                </div>
                <div>
                  <Label>Ostatnia aktualizacja</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.updatedAt ? formatDate(user.updatedAt) : 'Nie podano'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Bezpieczeństwo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Sposób logowania</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Replit Authentication (OpenID Connect)
                  </p>
                </div>
                <div>
                  <Label>Identyfikator użytkownika</Label>
                  <p className="text-sm text-gray-600 mt-1 font-mono">
                    {user.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}