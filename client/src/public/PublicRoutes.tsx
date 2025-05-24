import React from 'react';
import { Switch, Route } from 'wouter';
import PublicLayout from './PublicLayout';
import HomePage from './HomePage';
import VereadoresPage from './VereadoresPage';
import VereadorDetailPage from './VereadorDetailPage';
import DocumentosPage from './DocumentosPageBasic';
import AtividadesPage from './AtividadesPage';
import NotFound from '@/pages/not-found';

export default function PublicRoutes() {
  return (
    <PublicLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/vereadores" component={VereadoresPage} />
        <Route path="/vereadores/:id" component={VereadorDetailPage} />
        <Route path="/documentos" component={DocumentosPage} />
        <Route path="/documentos/:id" component={() => <div>Detalhes do Documento</div>} />
        <Route path="/atividades" component={AtividadesPage} />
        {/* Adicionar outras rotas públicas aqui */}
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  );
}