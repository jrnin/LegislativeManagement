import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  href: string;
  color: "primary" | "green" | "yellow" | "purple";
}

export default function StatCard({ title, value, icon, href, color }: StatCardProps) {
  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      primary: "bg-primary-100",
      green: "bg-green-100",
      yellow: "bg-yellow-100",
      purple: "bg-purple-100"
    };
    return colorMap[color] || "bg-primary-100";
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${getColorClass(color)} rounded-md p-3`}>
              {icon}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">
                  {title}
                </dt>
                <dd>
                  <div className="text-lg font-medium text-secondary-900">
                    {value}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href={href} className="font-medium text-primary-600 hover:text-primary-500">
              Ver {title.toLowerCase()} <span className="sr-only">{title}</span>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
