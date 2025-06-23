import React from 'react';
import { Switch, Route } from 'wouter';
import PublicLayout from './PublicLayout';
import HomePage from './HomePage';
import VereadoresPage from './VereadoresPage';
import VereadorDetalhesModerno from './VereadorDetalhesModerno';
import DocumentosPage from './DocumentosPageBasic';
import AtividadesPage from './AtividadesPage';
import AtividadeDetailPage from './AtividadeDetailPage';
import EventDetailsPage from './EventDetailsPage';
import SessoesPage from './SessoesPage';
import NoticiasPage from './NoticiasPage';
import NoticiaDetalhePage from './NoticiaDetalhePage';
import ContatoPage from './ContatoPageFunctional';
import ComissoesPage from './ComissoesPageTest';
import NotFound from '@/pages/not-found';

export default function PublicRoutes() {
  return (
    <PublicLayout>
      <Switch>
        <Route path="/public" component={HomePage} />
        <Route path="/" component={HomePage} />
        
        <Route path="/public/vereadores" component={VereadoresPage} />
        <Route path="/vereadores" component={VereadoresPage} />
        
        <Route path="/public/vereadores/:id" component={VereadorDetalhesModerno} />
        <Route path="/vereadores/:id" component={VereadorDetalhesModerno} />
        
        <Route path="/public/documentos" component={DocumentosPage} />
        <Route path="/documentos" component={DocumentosPage} />
        
        <Route path="/public/documentos/:id" component={() => <div>Detalhes do Documento</div>} />
        <Route path="/documentos/:id" component={() => <div>Detalhes do Documento</div>} />
        
        <Route path="/public/atividades" component={AtividadesPage} />
        <Route path="/atividades" component={AtividadesPage} />
        
        <Route path="/public/atividades/:id" component={AtividadeDetailPage} />
        <Route path="/atividades/:id" component={AtividadeDetailPage} />
        
        <Route path="/comissoes" component={ComissoesPage} />
        <Route path="/public/comissoes" component={ComissoesPage} />
        
        <Route path="/public/eventos/:id" component={EventDetailsPage} />
        <Route path="/eventos/:id" component={EventDetailsPage} />
        
        <Route path="/public/sessoes" component={SessoesPage} />
        <Route path="/sessoes" component={SessoesPage} />
        
        <Route path="/public/noticias" component={NoticiasPage} />
        <Route path="/noticias" component={NoticiasPage} />
        
        <Route path="/public/noticias/:id" component={NoticiaDetalhePage} />
        <Route path="/noticias/:id" component={NoticiaDetalhePage} />
        
        <Route path="/public/contato" component={ContatoPage} />
        <Route path="/contato" component={ContatoPage} />
        
        {/* Adicionar outras rotas públicas aqui */}
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  );
}