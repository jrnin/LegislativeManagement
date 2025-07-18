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
  Newspaper
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
    { name: "Usuários", href: "/users", icon: Users },
    { name: "Vereadores", href: "/councilors", icon: UsersRound },
    { name: "Legislaturas", href: "/legislatures", icon: Building },
    { name: "Eventos", href: "/events", icon: Calendar, badge: "3" },
    { name: "Atividades Legislativas", href: "/activities", icon: FileText, badge: "Novo" },
    { name: "Documentos", href: "/documents", icon: Files },
    { name: "Notícias", href: "/news", icon: Newspaper },
    { name: "Imagens", href: "/images", icon: Image },
    { name: "Comissões", href: "/committees", icon: UsersRound, badge: "Novo" },
    { name: "Mesa Diretora", href: "/boards", icon: Shield },
  ];

  const getInitials = (name: string) => {
    return name?.split(" ").map(part => part[0]).join("").toUpperCase() || "U";
  };

  const isActive = (href: string) => {
    if (href === "/") return location === href;
    return location.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center justify-center flex-shrink-0 px-4 mb-5">
          <div className="flex items-center space-x-3">
            <img 
              src={logoPath} 
              alt="Câmara Municipal de Jaíba" 
              className="w-14 h-14 object-contain"
            />
            <div>
              <h1 className="text-sm font-bold text-slate-800">Câmara Municipal</h1>
              <h2 className="text-sm font-semibold text-slate-600">de Jaíba</h2>
            </div>
          </div>
        </div>
        
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
                  transition-all duration-200 w-full
                  ${isActive(item.href)
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                `}
              >
                <item.icon
                  className={`
                    flex-shrink-0 h-5 w-5 mr-3
                    ${isActive(item.href)
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-500"
                    }
                  `}
                />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge className={`
                    text-xs px-2 py-0.5 ml-2
                    ${isActive(item.href)
                      ? "bg-blue-200 text-blue-800"
                      : "bg-slate-200 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700"
                    }
                  `}>
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          ))}
        </nav>
        
        <div className="mt-6 px-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Precisa de ajuda?</h3>
            <p className="text-xs text-slate-600 mb-3">Acesse nosso centro de suporte para encontrar recursos e tutoriais.</p>
            <button className="w-full py-1.5 px-3 bg-white text-xs font-medium text-blue-700 rounded border border-blue-100 hover:bg-blue-50 transition-colors">
              Centro de Suporte
            </button>
          </div>
        </div>
      </div>
      
      {user && (
        <div className="flex-shrink-0 p-4 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            
            
          </div>
          
          <div className="flex items-center p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
              <AvatarImage 
                src={user?.profileImageUrl || ""} 
                alt={user?.name || "Usuário"} 
              />
              <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-600 text-white">
                {getInitials(user?.name || "")}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-slate-700 truncate">
                {user?.name || user?.email || "Usuário"}
              </p>
              <p className="text-xs font-medium text-slate-500 truncate">
                {user?.role === "admin" ? "Administrador" : "Vereador"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
