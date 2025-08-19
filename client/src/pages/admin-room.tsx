import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, ClipboardList, Key, AlertTriangle, UserCheck, UserX, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
}

interface EquipmentCategory {
  id: number;
  name: string;
  description: string | null;
}

const categorySchema = z.object({
  name: z.string().min(1, "Nazwa kategorii jest wymagana"),
  description: z.string().optional(),
});

export default function AdminRoom() {
  const { user, isAuthenticated } = useAuth();

  // Redirect if not authenticated or not an admin (kierownik doesn't have access to ADMIN ROOM)
  if (!isAuthenticated || (user as any)?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">ADMIN ROOM</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Zaawansowane narzędzia administracyjne i zarządzanie systemem
        </p>
      </div>



      {/* Pending Users Section - Skopiowane z Admin - PRZENIESIONE NA GÓRĘ */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Użytkownicy oczekujący na akceptację
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Nowi użytkownicy wymagają zatwierdzenia przez administratora
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PendingUsersSection />
          </CardContent>
        </Card>
      </div>

      {/* User Management Section - Skopiowane z Admin */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Zarządzanie użytkownikami
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Użytkownicy są automatycznie dodawani podczas pierwszego logowania
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UserManagementSection />
          </CardContent>
        </Card>
      </div>



      {/* Needs Assessment Management - Skopiowane z Admin */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="w-5 h-5 mr-2" />
              Zarządzanie Badaniem Potrzeb
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Zarządzaj pytaniami badania potrzeb</h3>
              <p className="text-muted-foreground mb-4">
                Dodawaj, edytuj i usuwaj pytania dla różnych kategorii sprzętu. 
                Twórz nowe kategorie sprzętu dla badania potrzeb.
              </p>
              <Link href="/admin/needs-assessment">
                <Button className="mt-4">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Przejdź do zarządzania
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Management - Skopiowane z Admin */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Zarządzanie Kluczami API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Key className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Zarządzaj kluczami API</h3>
              <p className="text-muted-foreground mb-4">
                Twórz i zarządzaj kluczami API dla zewnętrznych integracji. 
                Inne strony mogą używać API do tworzenia wycen i badań potrzeb.
              </p>
              <Link href="/admin/api-keys">
                <Button className="mt-4">
                  <Key className="w-4 h-4 mr-2" />
                  Przejdź do zarządzania
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}



///////////////////// User Management Component - Skopiowane z Admin /////////////////////
function UserManagementSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await apiRequest(`/api/users/${id}/role`, "PUT", { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sukces",
        description: "Rola użytkownika została zaktualizowana",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować roli użytkownika",
        variant: "destructive",
      });
    },
  });

  // Toggle user active mutation
  const toggleUserActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/users/${id}/toggle-active`, "PUT");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sukces",
        description: "Status aktywności użytkownika został zmieniony",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu aktywności użytkownika",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/users/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sukces",
        description: "Użytkownik został usunięty",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć użytkownika",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (id: string, userName: string) => {
    if (confirm(`Czy na pewno chcesz usunąć użytkownika ${userName}?`)) {
      deleteUserMutation.mutate(id);
    }
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Użytkownik</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="font-medium">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.email?.split('@')[0] || 'Nieznany użytkownik'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {user.id}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Badge variant={user.role === 'admin' ? 'default' : user.role === 'kierownik' ? 'outline' : 'secondary'}>
                    {user.role === 'admin' && (
                      <Shield className="w-3 h-3 mr-1" />
                    )}
                    {user.role === 'admin' ? 'Admin' : user.role === 'kierownik' ? 'Kierownik' : 'Pracownik'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                  {user.isActive ? (
                    <UserCheck className="w-3 h-3 mr-1" />
                  ) : (
                    <UserX className="w-3 h-3 mr-1" />
                  )}
                  {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Select 
                    value={user.role} 
                    onValueChange={(role) => updateUserRoleMutation.mutate({ id: user.id, role })}
                    disabled={updateUserRoleMutation.isPending}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Pracownik</SelectItem>
                      <SelectItem value="kierownik">Kierownik</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUserActiveMutation.mutate(user.id)}
                    disabled={toggleUserActiveMutation.isPending}
                    title={user.isActive ? "Deaktywuj użytkownika" : "Aktywuj użytkownika"}
                  >
                    {user.isActive ? (
                      <UserX className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id, user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0] || 'Nieznany użytkownik')}
                    disabled={deleteUserMutation.isPending}
                    title="Usuń użytkownika"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

///////////////////// Pending Users Component - Skopiowane z Admin /////////////////////
function PendingUsersSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for pending users
  const { data: pendingUsers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/users/pending"],
  });

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/users/${id}/approve`, "POST");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sukces",
        description: "Użytkownik został zaakceptowany",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaakceptować użytkownika",
        variant: "destructive",
      });
    },
  });

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/users/${id}/reject`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sukces",
        description: "Użytkownik został odrzucony i usunięty",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się odrzucić użytkownika",
        variant: "destructive",
      });
    },
  });

  const handleRejectUser = (id: string, name: string) => {
    if (confirm(`Czy na pewno chcesz odrzucić i usunąć użytkownika "${name}"? Tej operacji nie można cofnąć.`)) {
      rejectUserMutation.mutate(id);
    }
  };

  if (pendingLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Brak użytkowników oczekujących na akceptację</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Użytkownik</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Data rejestracji</TableHead>
            <TableHead>Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingUsers.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <div>
                    <p className="font-medium">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.email?.split('@')[0] || 'Nieznany użytkownik'
                      }
                    </p>
                    {user.profileImageUrl && (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Avatar" 
                        className="w-6 h-6 rounded-full inline-block ml-2"
                      />
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pl-PL') : 'Nieznana'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => approveUserMutation.mutate(user.id)}
                    disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                    title="Zaakceptuj użytkownika"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Akceptuj
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRejectUser(
                      user.id, 
                      user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.email?.split('@')[0] || 'Nieznany użytkownik'
                    )}
                    disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                    title="Odrzuć użytkownika"
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Odrzuć
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}