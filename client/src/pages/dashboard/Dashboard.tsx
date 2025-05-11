import { useQuery } from "@tanstack/react-query";
import StatCard from "./StatCard";
import { useAuth } from "@/hooks/useAuth";
import { Building, Calendar, FileText, Files, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats, Event, LegislativeActivity } from "@shared/schema";
import { useIsMobile } from "@/mobile/hooks/useIsMobile";
import MobileDashboard from "@/mobile/screens/MobileDashboard";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events/upcoming"],
  });
  
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery<LegislativeActivity[]>({
    queryKey: ["/api/activities/recent"],
  });
  
  // Use the mobile dashboard on smaller screens
  if (isMobile) {
    return <MobileDashboard />;
  }

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
      "aberto": "status-badge-open",
      "andamento": "status-badge-in-progress",
      "concluido": "status-badge-completed",
      "cancelado": "status-badge-canceled"
    };
    return statusMap[status.toLowerCase()] || "";
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-heading">Dashboard</h1>
            <p className="mt-1 text-slate-500">Bem-vindo ao Sistema Legislativo</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm">
              Exportar Relatório
            </button>
            <button className="button-primary px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
              Nova Atividade
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Dashboard content */}
        <div>
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Legislaturas"
              value={statsLoading ? "..." : stats?.legislatureCount.toString() || "0"}
              icon={<Building className="h-6 w-6" />}
              href="/legislatures"
              color="primary"
            />
            <StatCard
              title="Eventos Ativos"
              value={statsLoading ? "..." : stats?.activeEventCount.toString() || "0"}
              icon={<Calendar className="h-6 w-6" />}
              href="/events"
              color="green"
            />
            <StatCard
              title="Atividades Pendentes"
              value={statsLoading ? "..." : stats?.pendingActivityCount.toString() || "0"}
              icon={<FileText className="h-6 w-6" />}
              href="/activities"
              color="yellow"
            />
            <StatCard
              title="Documentos Totais"
              value={statsLoading ? "..." : stats?.documentCount.toString() || "0"}
              icon={<Files className="h-6 w-6" />}
              href="/documents"
              color="purple"
            />
          </div>

          {/* Recent Activities and Events */}
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* Upcoming Events */}
            <Card className="border-none shadow-md rounded-xl overflow-hidden">
              <CardHeader className="border-b pb-4 bg-gradient-to-r from-slate-50 to-blue-50">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  Próximos Eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {eventsLoading ? (
                    <div className="p-6 text-center text-slate-500">
                      <div className="flex justify-center mb-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                      Carregando eventos...
                    </div>
                  ) : upcomingEvents && upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <div key={event.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-medium text-slate-800">
                              {event.category} #{event.eventNumber}
                            </h4>
                            <div className="mt-1.5 flex items-center text-xs text-slate-500">
                              <Calendar className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" />
                              {formatDateTime(event.eventDate, event.eventTime)}
                            </div>
                            <div className="mt-1 flex items-center text-xs text-slate-500">
                              <svg 
                                className="flex-shrink-0 mr-1.5 h-3.5 w-3.5" 
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
                              {event.location}
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(event.status)}`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500">
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p>Nenhum evento próximo encontrado</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-3.5">
                <div className="text-sm">
                  <Link href="/events">
                    <a className="flex items-center justify-between font-medium text-blue-600 hover:text-blue-800 transition-colors group">
                      <span>Ver todos os eventos</span>
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </a>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Recent Activities */}
            <Card className="border-none shadow-md rounded-xl overflow-hidden">
              <CardHeader className="border-b pb-4 bg-gradient-to-r from-slate-50 to-indigo-50">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
                  <FileText className="h-5 w-5 text-indigo-500 mr-2" />
                  Atividades Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flow-root">
                  <ul role="list" className="-mb-8">
                    {activitiesLoading ? (
                      <div className="p-6 text-center text-slate-500">
                        <div className="flex justify-center mb-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                        </div>
                        Carregando atividades...
                      </div>
                    ) : recentActivities && recentActivities.length > 0 ? (
                      recentActivities.map((activity, idx) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {idx < recentActivities.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gradient-to-b from-indigo-500 to-blue-500 opacity-20" aria-hidden="true"></span>
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center ring-8 ring-white shadow-sm">
                                  <FileText className="h-4 w-4 text-white" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-slate-700">
                                    <span className="font-medium text-slate-900">
                                      {activity.activityType} Nº {activity.activityNumber}/{new Date(activity.activityDate).getFullYear()}
                                    </span>{" "}
                                    {activity.needsApproval ? (
                                      <span className="text-amber-700">foi submetido para aprovação</span>
                                    ) : (
                                      <span className="text-green-700">foi registrado</span>
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Autor: {activity.authors ? activity.authors.map(a => a.name).join(", ") : "Não especificado"}
                                  </p>
                                </div>
                                <div className="text-right text-xs whitespace-nowrap text-slate-500 bg-slate-100 px-2 py-1 rounded font-medium">
                                  <time>{formatDate(activity.activityDate)}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500">
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p>Nenhuma atividade recente encontrada</p>
                        </div>
                      </div>
                    )}
                  </ul>
                </div>
              </CardContent>
              <div className="bg-gradient-to-r from-indigo-50 to-slate-50 px-4 py-3.5">
                <div className="text-sm">
                  <Link href="/activities">
                    <a className="flex items-center justify-between font-medium text-indigo-600 hover:text-indigo-800 transition-colors group">
                      <span>Ver todas as atividades</span>
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </a>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Legislative Chamber Image Banner */}
          <div className="mt-12 overflow-hidden rounded-2xl shadow-xl bg-white">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1555881400-89d5a9c86668?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80" 
                alt="Câmara Legislativa" 
                className="w-full h-72 object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <h2 className="text-3xl font-extrabold text-white">
                  Sistema de Gerenciamento <span className="text-blue-200">Legislativo</span>
                </h2>
                <p className="text-white/90 mt-3 max-w-2xl text-lg">
                  Modernizando os processos legislativos com tecnologia e transparência para uma gestão pública mais eficiente.
                </p>
                <button className="mt-6 px-6 py-3 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors shadow-lg">
                  Saiba mais
                </button>
              </div>
            </div>
            <div className="px-4 py-10 sm:p-8">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold gradient-heading mb-4">Gerenciamento Moderno e Eficiente</h3>
                <p className="max-w-3xl mx-auto text-slate-600">
                  Nossa plataforma oferece todas as ferramentas necessárias para otimizar os processos legislativos, 
                  garantindo mais eficiência, transparência e organização.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center group card-hover">
                  <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-5 shadow-lg shadow-blue-500/30">
                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Eficiência</h3>
                  <p className="text-slate-600">
                    Processos simplificados e automatizados para uma gestão legislativa mais ágil e eficiente, reduzindo o tempo de tramitação.
                  </p>
                </div>
                
                <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center group card-hover">
                  <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white mb-5 shadow-lg shadow-emerald-500/30">
                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Transparência</h3>
                  <p className="text-slate-600">
                    Acesso claro e organizado a todos os documentos e processos legislativos, garantindo a transparência das ações públicas.
                  </p>
                </div>
                
                <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center group card-hover">
                  <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white mb-5 shadow-lg shadow-amber-500/30">
                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Organização</h3>
                  <p className="text-slate-600">
                    Gestão documental estruturada com histórico completo e rastreabilidade, facilitando consultas e acompanhamento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
