import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SafeNavbarProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function SafeNavbar({ setSidebarOpen }: SafeNavbarProps) {
  const handleLogout = () => {
    window.location.href = "/login";
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-slate-200">
      <button
        type="button"
        className="px-4 border-r border-slate-200 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Abrir menu</span>
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex">
          <h2 className="text-lg font-semibold text-slate-900">
            Sistema de Gerenciamento Legislativo
          </h2>
        </div>

        <div className="ml-4 flex items-center md:ml-6">
          
        </div>
      </div>
    </div>
  );
}