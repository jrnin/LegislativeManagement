import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Menu, Bell, X, ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import SearchDialog from '@/components/search/SearchDialog';
import MobileSidebar from './MobileSidebar';

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export default function MobileHeader({ 
  title, 
  showBackButton = false, 
  onBack, 
  className = '' 
}: MobileHeaderProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Get page title based on current location if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    if (location === '/') return 'Dashboard';
    if (location.startsWith('/events')) return 'Eventos';
    if (location.startsWith('/activities')) return 'Atividades Legislativas';
    if (location.startsWith('/legislatures')) return 'Legislaturas';
    if (location.startsWith('/documents')) return 'Documentos';
    if (location.startsWith('/users')) return 'Usuários';
    if (location.startsWith('/profile')) return 'Perfil';
    
    return 'Sistema Legislativo';
  };

  const getInitials = (name: string) => {
    return name ? name.split(" ").map(part => part[0]).join("").toUpperCase() : "U";
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header className={`sticky top-0 bg-white shadow-sm z-30 ${className}`}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <button 
              onClick={handleBack}
              className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                  <Menu className="h-5 w-5 text-slate-700" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <MobileSidebar />
              </SheetContent>
            </Sheet>
          )}
          
          <h1 className="text-lg font-semibold text-slate-900">
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de busca */}
          <button 
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5 text-slate-700" />
          </button>
          
          {/* Botão de notificações */}
          <button 
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors relative"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-5 w-5 text-slate-700" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          <Avatar className="h-8 w-8 border border-slate-200">
            <AvatarImage 
              src={user?.profileImageUrl || ""} 
              alt={user?.name || "Usuário"}
            />
            <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-600 text-white text-xs">
              {user?.name ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Diálogo de busca (compartilhado com desktop) */}
        <SearchDialog 
          open={isSearchOpen} 
          onOpenChange={setIsSearchOpen} 
        />
      </div>
    </header>
  );
}