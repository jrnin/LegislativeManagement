import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  Building,
  UserCheck,
  Gavel,
  Archive,
  Image,
  User,
  LogOut,
  Loader2,
  Users2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Eventos", href: "/events", icon: Calendar },
  { name: "Atividades", href: "/activities", icon: FileText },
  { name: "Documentos", href: "/documents", icon: Archive },
  { name: "Imagens", href: "/images", icon: Image },
  { name: "Usuários", href: "/users", icon: Users },
  { name: "Comissões", href: "/committees", icon: Building },
  { name: "Vereadores", href: "/councilors", icon: UserCheck },
  { name: "Mesa Diretora", href: "/boards", icon: Users2 },
  { name: "Legislatura", href: "/legislatures", icon: Gavel },
  { name: "Noticias", href: "/news", icon: FileText },
  
];

export default function SafeSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getInitials = (name: string) => {
    return name ? name.split(" ").map(part => part[0]).join("").toUpperCase() : "U";
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    console.log('Iniciando logout direto...');
    
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log('Logout do servidor concluído');
    } catch (error) {
      console.warn('Erro no logout do servidor, continuando:', error);
    }
    
    localStorage.clear();
    sessionStorage.clear();
    
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      }
    });
    
    console.log('Redirecionando para login...');
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-slate-900 text-white">
        <h1 className="text-lg font-semibold">Sistema Legislativo</h1>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
                ${isActive 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* User profile section at bottom */}
      <div className="flex-shrink-0 border-t border-slate-200 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center w-full p-3 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 border border-slate-200">
              <Avatar className="h-10 w-10 border-2 border-primary-200 shadow-md">
                <AvatarImage 
                  src={user?.profileImageUrl || ""} 
                  alt={user?.name || "Usuário"} 
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1 text-left">
                <p className="text-sm font-medium text-slate-700">{user?.name || "Usuário"}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2">
            <div className="px-2 py-1.5 mb-1">
              <p className="text-sm font-medium">{user?.name || "Usuário"}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="px-2 py-1.5 cursor-pointer hover:bg-slate-100 rounded-md">
              <User className="mr-2 h-4 w-4 text-slate-500" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-2 py-1.5 cursor-pointer hover:bg-red-50 text-red-600 hover:text-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}