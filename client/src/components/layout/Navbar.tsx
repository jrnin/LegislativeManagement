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
import NotificationPanel from "@/components/ui/notifications/NotificationPanel";

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function Navbar({ setSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();

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
            <SearchButton />
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
         
          
          {/* Notifications dropdown */}
          <NotificationPanel />

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
