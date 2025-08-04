import { useLocation, Link } from "wouter";
import { 
  Home,
  Users,
  Building,
  Calendar,
  FileText,
  Files,
  LogOut,
  PieChart,
  Settings,
  UsersRound,
  Shield,
  Image,
  Newspaper,
  Database,
  FolderTree,
  ArrowUpDown
} from "lucide-react";
import logoPath from '@assets/logo.png';
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const navigation = [
    { name: "Dashboard", href: "/", icon: PieChart },
    { name: "Eventos", href: "/events", icon: Calendar },
    { name: "Atividades", href: "/activities", icon: FileText },
    { name: "Documentos", href: "/documents", icon: Files },
    { name: "Notícias", href: "/news", icon: Newspaper },
    { name: "Imagens", href: "/images", icon: Image },
    { name: "Usuários", href: "/users", icon: Users },
    { name: "Vereadores", href: "/councilors", icon: UsersRound },
    { name: "Comissões", href: "/committees", icon: UsersRound },
    { name: "Mesa Diretora", href: "/boards", icon: Shield },
    { name: "Legislaturas", href: "/legislatures", icon: Building },
    { name: "Auditoria Uploads", href: "/uploads-audit", icon: FolderTree },
    { name: "Migração Arquivos", href: "/file-migration", icon: ArrowUpDown },
  ];

  const getInitials = (name: string) => {
    return name?.split(" ").map(part => part[0]).join("").toUpperCase() || "U";
  };

  const isActive = (href: string) => {
    if (href === "/") return location === href;
    return location.startsWith(href);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Logo */}
      <div className="flex items-center justify-center p-4 border-b">
        <div className="flex items-center space-x-3">
          <img 
            src={logoPath} 
            alt="Câmara Municipal de Jaíba" 
            className="w-12 h-12 object-contain"
          />
          <div>
            <h1 className="text-sm font-bold text-slate-800">Sistema Legislativo</h1>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="space-y-2">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive(item.href)
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                `}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </a>
            </Link>
          ))}
        </div>
      </nav>
      
      {/* User Profile */}
      {user && (
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="bg-blue-500 text-white">
                {getInitials(user?.name || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {user?.name || user?.email || "Usuário"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.role === "admin" ? "Administrador" : "Vereador"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}