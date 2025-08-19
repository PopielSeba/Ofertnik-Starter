import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Plus,
  Key,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";

interface ApiKey {
  id: number;
  name: string;
  keyValue: string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  lastUsedAt?: string;
}

const apiKeySchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  permissions: z.array(z.string()).min(1, "Wybierz przynajmniej jedno uprawnienie"),
});

const availablePermissions = [
  { id: "quotes:create", label: "Tworzenie wycen", description: "Pozwala na tworzenie wycen poprzez API" },
  { id: "assessments:create", label: "Tworzenie badań potrzeb", description: "Pozwala na tworzenie badań potrzeb poprzez API" },
  { id: "*", label: "Wszystkie uprawnienia", description: "Pełen dostęp do wszystkich funkcji API" }
];

export default function AdminApiKeys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/admin/api-keys"],
  });

  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof apiKeySchema>) => {
      const response = await apiRequest("/api/admin/api-keys", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({
        title: "Sukces",
        description: "Klucz API został utworzony pomyślnie. Kliknij ikonę oka aby go podejrzeć lub ikonę kopiowania aby skopiować.",
      });
      setCreateDialogOpen(false);
      form.reset();
      
      // Show the full key temporarily
      setVisibleKeys(prev => new Set([...Array.from(prev), data.id]));
      setTimeout(() => {
        setVisibleKeys(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(data.id);
          return newSet;
        });
      }, 30000); // Hide after 30 seconds
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Sesja wygasła. Przekierowywanie do logowania...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć klucza API",
        variant: "destructive",
      });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/api-keys/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({
        title: "Sukces",
        description: "Klucz API został usunięty pomyślnie",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Sesja wygasła. Przekierowywanie do logowania...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć klucza API",
        variant: "destructive",
      });
    },
  });

  const toggleApiKeyStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest(`/api/admin/api-keys/${id}`, "PATCH", { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({
        title: "Sukces",
        description: "Status klucza API został zaktualizowany",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Sesja wygasła. Przekierowywanie do logowania...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować statusu klucza API",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Skopiowano",
        description: `Klucz API został skopiowany: ${text.substring(0, 12)}...`,
      });
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          title: "Skopiowano",
          description: `Klucz API został skopiowany: ${text.substring(0, 12)}...`,
        });
      } catch (fallbackErr) {
        toast({
          title: "Błąd",
          description: "Nie udało się skopiować klucza API",
          variant: "destructive",
        });
      }
      document.body.removeChild(textArea);
    }
  };

  const toggleKeyVisibility = (keyId: number) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do panelu
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Zarządzanie Kluczami API</h1>
              <p className="text-muted-foreground mt-2">Twórz i zarządzaj kluczami API dla zewnętrznych integracji</p>
            </div>
          </div>
        </div>

        {/* API Documentation Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dokumentacja API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Publiczne API umożliwia zewnętrznym stronom tworzenie wycen i badań potrzeb. 
                Dokumentacja jest dostępna pod adresem:
              </p>
              <div className="bg-muted p-3 rounded-md font-mono text-sm">
                GET /api/public/docs
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Dostępne endpointy:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>GET /api/public/equipment - Lista dostępnego sprzętu z cenami</li>
                  <li>POST /api/public/quotes - Tworzenie wycen</li>
                  <li>GET /api/public/needs-assessment/questions - Pytania do badania potrzeb</li>
                  <li>POST /api/public/needs-assessment - Tworzenie badań potrzeb</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Klucze API
              </CardTitle>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj klucz API
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dodaj nowy klucz API</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createApiKeyMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nazwa</FormLabel>
                            <FormControl>
                              <Input placeholder="np. Integracja strony głównej" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Uprawnienia</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {availablePermissions.map((permission) => (
                                  <div key={permission.id} className="flex items-start space-x-2">
                                    <Checkbox
                                      id={permission.id}
                                      checked={field.value.includes(permission.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, permission.id]);
                                        } else {
                                          field.onChange(field.value.filter(p => p !== permission.id));
                                        }
                                      }}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                      <label
                                        htmlFor={permission.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {permission.label}
                                      </label>
                                      <p className="text-xs text-muted-foreground">
                                        {permission.description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Anuluj
                        </Button>
                        <Button type="submit" disabled={createApiKeyMutation.isPending}>
                          {createApiKeyMutation.isPending ? "Tworzenie..." : "Utwórz klucz"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Ładowanie kluczy API...</p>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Brak kluczy API</h3>
                <p className="text-muted-foreground mb-4">
                  Utwórz pierwszy klucz API, aby umożliwić zewnętrznym aplikacjom dostęp do systemu
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Klucz API</TableHead>
                    <TableHead>Uprawnienia</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ostatnie użycie</TableHead>
                    <TableHead>Utworzony</TableHead>
                    <TableHead>Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey: ApiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {visibleKeys.has(apiKey.id) ? apiKey.keyValue : `${apiKey.keyValue.substring(0, 8)}...${apiKey.keyValue.substring(apiKey.keyValue.length - 4)}`}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.keyValue)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {apiKey.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission === "*" ? "Wszystkie" : permission.replace(":", ": ")}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleApiKeyStatus.mutate({ id: apiKey.id, isActive: !apiKey.isActive })}
                          disabled={toggleApiKeyStatus.isPending}
                        >
                          <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                            {apiKey.isActive ? "Aktywny" : "Nieaktywny"}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell>
                        {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : "Nigdy"}
                      </TableCell>
                      <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteApiKeyMutation.mutate(apiKey.id)}
                          disabled={deleteApiKeyMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}