import { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  actions?: ReactNode;
}

export default function PageHeader({ 
  title, 
  description, 
  backLink, 
  actions 
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b">
      <div className="flex flex-col mb-4 sm:mb-0">
        {backLink && (
          <Link href={backLink}>
            <a className="flex items-center text-sm text-muted-foreground mb-2 hover:text-primary transition-colors">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Voltar
            </a>
          </Link>
        )}
        
        <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tighter">
          {title}
        </h1>
        
        {description && (
          <p className="text-muted-foreground mt-1 md:text-lg">
            {description}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex-shrink-0 ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
}