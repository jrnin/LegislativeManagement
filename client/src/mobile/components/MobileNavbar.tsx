import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  PieChart,
  Users, 
  Building, 
  Calendar, 
  FileText, 
  Files, 
  User
} from 'lucide-react';

interface MobileNavbarProps {
  className?: string;
}

export default function MobileNavbar({ className = '' }: MobileNavbarProps) {
  const [location] = useLocation();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: PieChart },
    { name: 'Eventos', href: '/events', icon: Calendar },
    { name: 'Atividades', href: '/activities', icon: FileText },
    { name: 'Perfil', href: '/profile', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === href;
    return location.startsWith(href);
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-slate-200 z-40 ${className}`}>
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <a className="flex flex-col items-center justify-center py-1 px-3">
              <div className={`p-1.5 rounded-full ${isActive(item.href) ? 'bg-blue-100' : ''}`}>
                <item.icon
                  className={`h-5 w-5 ${
                    isActive(item.href) ? 'text-blue-600' : 'text-slate-500'
                  }`}
                />
              </div>
              <span className={`text-xs mt-1 ${
                isActive(item.href) ? 'text-blue-600 font-medium' : 'text-slate-500'
              }`}>
                {item.name}
              </span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}