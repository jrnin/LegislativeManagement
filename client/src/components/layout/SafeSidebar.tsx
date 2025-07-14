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
  Archive
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Eventos", href: "/events", icon: Calendar },
  { name: "Atividades", href: "/activities", icon: FileText },
  { name: "Documentos", href: "/documents", icon: Archive },
  { name: "Usuários", href: "/users", icon: Users },
  { name: "Comissões", href: "/committees", icon: Building },
  { name: "Vereadores", href: "/councilors", icon: UserCheck },
  { name: "Mesa Diretora", href: "/boards", icon: Gavel },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export default function SafeSidebar() {
  const [location] = useLocation();

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
    </div>
  );
}