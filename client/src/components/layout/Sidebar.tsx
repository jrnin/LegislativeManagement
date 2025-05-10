import { useLocation, Link } from "wouter";
import { 
  Home,
  Users,
  Building,
  Calendar,
  FileText,
  Files,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Usuários", href: "/users", icon: Users },
    { name: "Legislaturas", href: "/legislatures", icon: Building },
    { name: "Eventos", href: "/events", icon: Calendar },
    { name: "Atividades Legislativas", href: "/activities", icon: FileText },
    { name: "Documentos", href: "/documents", icon: Files },
  ];

  const getInitials = (name: string) => {
    return name.split(" ").map(part => part[0]).join("").toUpperCase();
  };

  const isActive = (href: string) => {
    if (href === "/") return location === href;
    return location.startsWith(href);
  };

  return (
    <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-primary">Sistema Legislativo</h1>
        </div>
        <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={`${
                  isActive(item.href)
                    ? "bg-primary-50 text-primary"
                    : "text-secondary-600 hover:bg-primary-50 hover:text-primary"
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    isActive(item.href)
                      ? "text-primary"
                      : "text-secondary-400 group-hover:text-primary"
                  } mr-3 h-6 w-6`}
                />
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      {user && (
        <div className="flex-shrink-0 flex bg-white p-4 border-t border-gray-200">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage 
                  src={user.profileImageUrl || ""} 
                  alt={user.name || "Usuário"} 
                  className="h-9 w-9 rounded-full object-cover"
                />
                <AvatarFallback>{user.name ? getInitials(user.name) : "U"}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-700 group-hover:text-secondary-900">
                  {user.name || "Usuário"}
                </p>
                <p className="text-xs font-medium text-secondary-500 group-hover:text-secondary-700">
                  {user.role === "admin" ? "Administrador" : "Vereador"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
