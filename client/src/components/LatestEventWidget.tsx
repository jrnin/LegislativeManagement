import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Calendar } from 'lucide-react';

interface LatestEventWidgetProps {
  className?: string;
}

export function LatestEventWidget({ className }: LatestEventWidgetProps) {
  const { data: latestEvent, isLoading } = useQuery({
    queryKey: ['/api/public/events/latest'],
    refetchInterval: 30 * 1000, // Atualizar a cada 30 segundos
    staleTime: 15 * 1000, // Considerar stale após 15 segundos
  });

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
            <Calendar size={16} className="text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
            Último Evento
          </h3>
          {isLoading ? (
            <div className="text-xs text-green-600 dark:text-green-400">
              Carregando...
            </div>
          ) : latestEvent && typeof latestEvent === 'object' && 'title' in latestEvent ? (
            <Link href="/sessoes">
              <div className="cursor-pointer group">
                <p className="text-sm text-green-700 dark:text-green-300 group-hover:text-green-900 dark:group-hover:text-green-100 transition-colors">
                  {(latestEvent as any).title}
                </p>
                {(latestEvent as any).date && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {new Date((latestEvent as any).date).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </Link>
          ) : (
            <div className="text-xs text-green-600 dark:text-green-400">
              Nenhum evento encontrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}