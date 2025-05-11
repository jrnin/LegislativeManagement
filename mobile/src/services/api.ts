import axios from 'axios';

// Substitua com o URL da sua API em produção
const BASE_URL = 'https://sistema-legislativo.replit.app';

// Crie uma instância do axios com a URL base
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Importante para manter cookies de sessão
});

// Interceptor para tratar erros
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Interface para a resposta de login
interface LoginResponse {
  success: boolean;
  message: string;
}

// Interface de evento
export interface Event {
  id: number;
  eventNumber: number;
  eventDate: string;
  eventTime: string;
  category: string;
  description: string;
  location: string;
  status: string;
  legislatureId: number;
}

// Interface de atividade legislativa
export interface LegislativeActivity {
  id: number;
  activityNumber: number;
  activityDate: string;
  activityType: string;
  subject: string;
  description: string;
  status: string;
  needsApproval: boolean;
  authors?: Array<{ id: string; name: string }>;
}

// Interface de estatísticas do dashboard
export interface DashboardStats {
  legislatureCount: number;
  activeEventCount: number;
  pendingActivityCount: number;
  documentCount: number;
}

// Auth
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/api/login/email', { email, password });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.get('/api/logout');
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/user');
  return response.data;
};

// Dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/api/dashboard/stats');
  return response.data;
};

// Events
export const getEvents = async (): Promise<Event[]> => {
  const response = await api.get('/api/events');
  return response.data;
};

export const getUpcomingEvents = async (): Promise<Event[]> => {
  const response = await api.get('/api/events/upcoming');
  return response.data;
};

export const getEventDetails = async (eventId: number) => {
  const response = await api.get(`/api/events/${eventId}/details`);
  return response.data;
};

// Legislative Activities
export const getLegislativeActivities = async (): Promise<LegislativeActivity[]> => {
  const response = await api.get('/api/activities');
  return response.data;
};

export const getRecentActivities = async (): Promise<LegislativeActivity[]> => {
  const response = await api.get('/api/activities/recent');
  return response.data;
};

export const getLegislativeActivityDetails = async (activityId: number) => {
  const response = await api.get(`/api/activities/${activityId}`);
  return response.data;
};