import { useLocation } from 'wouter';

export function usePageTitle(): string {
  const [location] = useLocation();
  
  if (location === '/') return 'Dashboard';
  if (location.startsWith('/events') && location.includes('/edit/')) return 'Editar Evento';
  if (location.startsWith('/events') && location.includes('/new')) return 'Novo Evento';
  if (location.startsWith('/events') && !isNaN(Number(location.split('/').pop()))) return 'Detalhes do Evento';
  if (location.startsWith('/events')) return 'Eventos';
  
  if (location.startsWith('/activities') && location.includes('/new')) return 'Nova Atividade';
  if (location.startsWith('/activities') && !isNaN(Number(location.split('/').pop()))) return 'Editar Atividade';
  if (location.startsWith('/activities')) return 'Atividades Legislativas';
  
  if (location.startsWith('/legislatures') && location.includes('/new')) return 'Nova Legislatura';
  if (location.startsWith('/legislatures') && !isNaN(Number(location.split('/').pop()))) return 'Editar Legislatura';
  if (location.startsWith('/legislatures')) return 'Legislaturas';
  
  if (location.startsWith('/documents') && location.includes('/new')) return 'Novo Documento';
  if (location.startsWith('/documents') && !isNaN(Number(location.split('/').pop()))) return 'Editar Documento';
  if (location.startsWith('/documents')) return 'Documentos';
  
  if (location.startsWith('/users') && location.includes('/new')) return 'Novo Usuário';
  if (location.startsWith('/users') && !isNaN(Number(location.split('/').pop()))) return 'Editar Usuário';
  if (location.startsWith('/users')) return 'Usuários';
  
  if (location.startsWith('/profile')) return 'Perfil';
  
  return 'Sistema Legislativo';
}