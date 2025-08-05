import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  href: string;
  color: "primary" | "green" | "yellow" | "purple";
}

export default function StatCard({ title, value, icon, href, color }: StatCardProps) {
  const getGradientClass = (color: string) => {
    const colorMap: Record<string, string> = {
      primary: "from-blue-500 to-indigo-600 shadow-blue-500/30",
      green: "from-emerald-500 to-green-600 shadow-emerald-500/30",
      yellow: "from-amber-500 to-yellow-600 shadow-amber-500/30",
      purple: "from-violet-500 to-purple-600 shadow-violet-500/30"
    };
    return colorMap[color] || "from-blue-500 to-indigo-600 shadow-blue-500/30";
  };

  const getIconBackground = (color: string) => {
    const colorMap: Record<string, string> = {
      primary: "bg-blue-100 text-blue-600",
      green: "bg-emerald-100 text-emerald-600",
      yellow: "bg-amber-100 text-amber-600",
      purple: "bg-violet-100 text-violet-600"
    };
    return colorMap[color] || "bg-blue-100 text-blue-600";
  };

  return (
    <Card className="dashboard-card overflow-hidden border-none">
      <CardContent className="p-0">
        <div className="relative p-6">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getGradientClass(color)}`}></div>
          
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${getIconBackground(color)} rounded-xl p-3`}>
              {icon}
            </div>
            
            <div className="ml-5 flex-1">
              <h3 className="text-sm font-medium text-slate-500 mb-1">
                {title}
              </h3>
              <p className="text-2xl font-bold text-slate-800">
                {value}
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href={href} className="flex items-center justify-between text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors group">
              <span>Ver {title.toLowerCase()}</span>
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
