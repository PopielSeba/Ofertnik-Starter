import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Settings, 
  BarChart3, 
  Wrench, 
  FileText, 
  Plus, 
  LogOut,
  User,
  Bell,
  ClipboardList,
  ChevronDown,
  Shield
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/equipment", label: "Sprzęt", icon: Wrench },
  ];

  if (isAuthenticated && (user as any)?.role === 'admin') {
    navItems.push({ path: "/admin", label: "Zarządzanie wypożyczalnią", icon: Settings });
    navItems.push({ path: "/admin-room", label: "ADMIN ROOM", icon: Shield });
  }

  return (
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">
                <Settings className="w-4 h-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <h1 className="text-base font-bold text-foreground text-center">PPP</h1>
                <span className="text-xs font-medium text-muted-foreground text-center">Program</span>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-1 text-sm ${
                    isActive(item.path) 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <item.icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
            
            {/* Badania Potrzeb Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isActive("/needs-assessment") || isActive("/needs-assessment-list") ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-1 text-sm ${
                    isActive("/needs-assessment") || isActive("/needs-assessment-list")
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <ClipboardList className="w-3 h-3" />
                  <span>BADANIA</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/needs-assessment" className="cursor-pointer">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Nowe Badanie
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/needs-assessment-list" className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Zapisane Badania
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Wyceny Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isActive("/create-quote") || isActive("/quotes") ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-1 text-sm ${
                    isActive("/create-quote") || isActive("/quotes")
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>OFERTY</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/create-quote" className="cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" />
                    Nowa Wycena
                  </Link>
                </DropdownMenuItem>
                {isAuthenticated && (user as any)?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/quotes" className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      Zapisane Wyceny
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <Bell className="w-5 h-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 h-10">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary text-white">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">
                        {(user as any)?.firstName && (user as any)?.lastName 
                          ? `${(user as any).firstName} ${(user as any).lastName}`
                          : (user as any)?.email?.split('@')[0] || 'Użytkownik'
                        }
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Ustawienia
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => window.location.href = '/api/logout'}
                      className="text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Wyloguj się
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                onClick={() => window.location.href = '/api/login'}
                variant="default"
              >
                Zaloguj się
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border py-3">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-1 whitespace-nowrap ${
                    isActive(item.path) 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            ))}
            
            {/* Mobile Badania Potrzeb Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isActive("/needs-assessment") || isActive("/needs-assessment-list") ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-1 whitespace-nowrap ${
                    isActive("/needs-assessment") || isActive("/needs-assessment-list")
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-xs">POTRZEBY</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/needs-assessment" className="cursor-pointer">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Nowe Badanie
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/needs-assessment-list" className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Zapisane Badania
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Wyceny Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isActive("/create-quote") || isActive("/quotes") ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-1 whitespace-nowrap ${
                    isActive("/create-quote") || isActive("/quotes")
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs">OFERTY</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/create-quote" className="cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" />
                    Nowa Wycena
                  </Link>
                </DropdownMenuItem>
                {isAuthenticated && (user as any)?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/quotes" className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      Zapisane Wyceny
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
