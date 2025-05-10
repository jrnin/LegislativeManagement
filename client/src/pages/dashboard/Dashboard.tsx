import { useQuery } from "@tanstack/react-query";
import StatCard from "./StatCard";
import { useAuth } from "@/hooks/useAuth";
import { Building, Calendar, FileText, Files } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats, Event, LegislativeActivity } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events/upcoming"],
  });
  
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery<LegislativeActivity[]>({
    queryKey: ["/api/activities/recent"],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')} - ${timeString}`;
  };

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      "aberto": "status-badge-open",
      "andamento": "status-badge-in-progress",
      "concluido": "status-badge-completed",
      "cancelado": "status-badge-canceled"
    };
    return statusMap[status.toLowerCase()] || "";
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-secondary-900">Dashboard</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Dashboard content */}
        <div className="py-4">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Legislaturas"
              value={statsLoading ? "..." : stats?.legislatureCount.toString() || "0"}
              icon={<Building className="h-6 w-6 text-primary-600" />}
              href="/legislatures"
              color="primary"
            />
            <StatCard
              title="Eventos Ativos"
              value={statsLoading ? "..." : stats?.activeEventCount.toString() || "0"}
              icon={<Calendar className="h-6 w-6 text-green-600" />}
              href="/events"
              color="green"
            />
            <StatCard
              title="Atividades Pendentes"
              value={statsLoading ? "..." : stats?.pendingActivityCount.toString() || "0"}
              icon={<FileText className="h-6 w-6 text-yellow-600" />}
              href="/activities"
              color="yellow"
            />
            <StatCard
              title="Documentos Totais"
              value={statsLoading ? "..." : stats?.documentCount.toString() || "0"}
              icon={<Files className="h-6 w-6 text-purple-600" />}
              href="/documents"
              color="purple"
            />
          </div>

          {/* Recent Activities and Events */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Upcoming Events */}
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg">Próximos Eventos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {eventsLoading ? (
                    <div className="p-6 text-center">Carregando...</div>
                  ) : upcomingEvents && upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <div key={event.id} className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-medium text-secondary-900">
                            {event.category} #{event.eventNumber}
                          </h4>
                          <div className="mt-1 flex items-center">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-secondary-500" />
                            <p className="text-xs text-secondary-500">
                              {formatDateTime(event.eventDate, event.eventTime)}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center">
                            <svg 
                              className="flex-shrink-0 mr-1.5 h-4 w-4 text-secondary-500" 
                              xmlns="http://www.w3.org/2000/svg" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                              />
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                              />
                            </svg>
                            <p className="text-xs text-secondary-500">{event.location}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(event.status)}`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-secondary-500">
                      Nenhum evento próximo encontrado
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a href="/events" className="font-medium text-primary-600 hover:text-primary-500">
                    Ver todos os eventos
                  </a>
                </div>
              </div>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg">Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flow-root">
                  <ul role="list" className="-mb-8">
                    {activitiesLoading ? (
                      <div className="p-6 text-center">Carregando...</div>
                    ) : recentActivities && recentActivities.length > 0 ? (
                      recentActivities.map((activity, idx) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {idx < recentActivities.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                  <FileText className="h-5 w-5 text-white" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-secondary-700">
                                    <span className="font-medium text-secondary-900">
                                      {activity.activityType} Nº {activity.activityNumber}/{new Date(activity.activityDate).getFullYear()}
                                    </span>{" "}
                                    {activity.needsApproval ? "foi submetido para aprovação" : "foi registrado"}
                                  </p>
                                  <p className="mt-1 text-xs text-secondary-500">
                                    Autor: {activity.authors ? activity.authors.map(a => a.name).join(", ") : "Não especificado"}
                                  </p>
                                </div>
                                <div className="text-right text-xs whitespace-nowrap text-secondary-500">
                                  <time>{formatDate(activity.activityDate)}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <div className="p-6 text-center text-secondary-500">
                        Nenhuma atividade recente encontrada
                      </div>
                    )}
                  </ul>
                </div>
              </CardContent>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a href="/activities" className="font-medium text-primary-600 hover:text-primary-500">
                    Ver todas as atividades
                  </a>
                </div>
              </div>
            </Card>
          </div>

          {/* Legislative Chamber Image Banner */}
          <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1555881400-89d5a9c86668?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80" 
                alt="Câmara Legislativa" 
                className="w-full h-64 object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black opacity-60"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <h2 className="text-2xl font-bold text-white">Sistema de Gerenciamento Legislativo</h2>
                <p className="text-white text-opacity-90 mt-2 max-w-2xl">
                  Modernizando os processos legislativos com tecnologia e transparência para uma gestão pública mais eficiente.
                </p>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mb-4">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-secondary-900">Eficiência</h3>
                <p className="mt-2 text-sm text-secondary-500">
                  Processos simplificados e automatizados para uma gestão legislativa mais ágil e eficiente.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mb-4">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-secondary-900">Transparência</h3>
                <p className="mt-2 text-sm text-secondary-500">
                  Acesso claro e organizado a todos os documentos e processos legislativos.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-600 mb-4">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-secondary-900">Organização</h3>
                <p className="mt-2 text-sm text-secondary-500">
                  Gestão documental estruturada com histórico completo e rastreabilidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
