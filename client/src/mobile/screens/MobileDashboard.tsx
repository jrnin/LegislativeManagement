import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Building,
  Calendar,
  FileText,
  Files,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats, Event, LegislativeActivity } from '@shared/schema';

export default function MobileDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events/upcoming'],
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery<LegislativeActivity[]>({
    queryKey: ['/api/activities/recent'],
  });

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string | Date, timeString: string) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return `${date.toLocaleDateString('pt-BR')} - ${timeString}`;
  };

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'aberto': 'status-badge-open',
      'andamento': 'status-badge-in-progress',
      'concluido': 'status-badge-completed',
      'cancelado': 'status-badge-canceled'
    };
    return statusMap[status.toLowerCase()] || '';
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="dashboard-card overflow-hidden border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 rounded-full p-2 mb-2">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-slate-800">
                {statsLoading ? "..." : stats?.legislatureCount.toString() || "0"}
              </p>
              <p className="text-xs text-slate-500">Legislaturas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card overflow-hidden border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 rounded-full p-2 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xl font-bold text-slate-800">
                {statsLoading ? "..." : stats?.activeEventCount.toString() || "0"}
              </p>
              <p className="text-xs text-slate-500">Eventos Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card overflow-hidden border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 rounded-full p-2 mb-2">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-slate-800">
                {statsLoading ? "..." : stats?.pendingActivityCount.toString() || "0"}
              </p>
              <p className="text-xs text-slate-500">Atividades Pendentes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card overflow-hidden border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="bg-purple-100 rounded-full p-2 mb-2">
                <Files className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-slate-800">
                {statsLoading ? "..." : stats?.documentCount.toString() || "0"}
              </p>
              <p className="text-xs text-slate-500">Documentos Totais</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-slate-800">Próximos Eventos</h2>
          <Link href="/events">
            <a className="flex items-center text-xs font-medium text-blue-600">
              Ver todos <ArrowRight className="ml-1 h-3 w-3" />
            </a>
          </Link>
        </div>

        <Card className="shadow-md border-none overflow-hidden">
          <CardContent className="p-0">
            {eventsLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-slate-500">Carregando eventos...</p>
              </div>
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingEvents.slice(0, 2).map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <a className="block p-4 hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium text-slate-800">
                            {event.category} #{event.eventNumber}
                          </h4>
                          <div className="mt-1 flex items-center text-xs text-slate-500">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatDateTime(event.eventDate, event.eventTime)}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                            {event.location}
                          </p>
                        </div>
                        <Badge className={`${getStatusClass(event.status)} text-xs`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                Nenhum evento próximo
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-slate-800">Atividades Recentes</h2>
          <Link href="/activities">
            <a className="flex items-center text-xs font-medium text-blue-600">
              Ver todas <ArrowRight className="ml-1 h-3 w-3" />
            </a>
          </Link>
        </div>

        <Card className="shadow-md border-none overflow-hidden">
          <CardContent className="p-0">
            {activitiesLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-slate-500">Carregando atividades...</p>
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentActivities.slice(0, 2).map((activity) => (
                  <Link key={activity.id} href={`/activities/${activity.id}`}>
                    <a className="block p-4 hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium text-slate-800">
                            {activity.activityType} #{activity.activityNumber}
                          </h4>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                            {activity.description}
                          </p>
                          <div className="mt-1 flex items-center text-xs text-slate-500">
                            <Calendar className="mr-1 h-3 w-3" />
                            {formatDate(activity.activityDate)}
                          </div>
                        </div>
                        <Badge className={`${activity.needsApproval ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'} text-xs`}>
                          {activity.needsApproval ? 'Pendente' : 'Aprovado'}
                        </Badge>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                Nenhuma atividade recente
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}