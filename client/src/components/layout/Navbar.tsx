import { useState } from "react";
import { 
  Bell, 
  Menu,
  LogOut,
  Mail,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import SearchButton from "@/components/search/SearchButton";

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function Navbar({ setSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const getInitials = (name: string) => {
    return name ? name.split(" ").map(part => part[0]).join("").toUpperCase() : "U";
  };

  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm backdrop-blur-sm bg-white/90">
      <button
        type="button"
        className="md:hidden px-4 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Abrir menu</span>
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-lg flex md:ml-0">
            <label htmlFor="search" className="sr-only">
              Pesquisar
            </label>
            <div className="relative w-full text-slate-400 focus-within:text-slate-600">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4" />
              </div>
              <Input
                id="search"
                className="block w-full pl-10 py-1.5 form-input-modern border-slate-200 bg-slate-50/80 text-sm"
                placeholder="Pesquisar no sistema..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Messages button */}
          <button className="relative p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30">
            <span className="sr-only">Ver mensagens</span>
            <Mail className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary hover:bg-primary">3</Badge>
          </button>
          
          {/* Notifications dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                <span className="sr-only">Ver notificações</span>
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary hover:bg-primary">2</Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-4">
              <DropdownMenuLabel className="text-lg font-bold">Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="py-2">
                <div className="mb-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">Nova atividade legislativa registrada</p>
                    <Badge variant="outline" className="text-xs ml-2">Agora</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Uma nova atividade foi registrada e aguarda sua aprovação.</p>
                </div>
                
                <div className="mb-1 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">Evento marcado para hoje</p>
                    <Badge variant="outline" className="text-xs ml-2">2h atrás</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">O evento "Sessão Ordinária" está agendado para hoje às 14:00.</p>
                </div>
              </div>
              
              <DropdownMenuSeparator />
              <div className="text-center pt-2">
                <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                  Ver todas as notificações
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                  <AvatarImage 
                    src={user?.profileImageUrl || ""} 
                    alt={user?.name || "Usuário"} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-600 text-white">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium text-slate-600">{user?.name || user?.email}</span>
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
              <DropdownMenuItem className="px-2 py-1.5 cursor-pointer hover:bg-slate-100 rounded-md">
                <Bell className="mr-2 h-4 w-4 text-slate-500" />
                <span>Preferências</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="px-2 py-1.5 cursor-pointer hover:bg-red-50 text-red-600 hover:text-red-700 rounded-md"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
