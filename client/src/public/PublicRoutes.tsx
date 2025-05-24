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
        <Route path="/public" component={HomePage} />
        <Route path="/public/vereadores" component={VereadoresPage} />
        <Route path="/public/vereadores/:id" component={VereadorDetailPage} />
        <Route path="/public/documentos" component={DocumentosPage} />
        <Route path="/public/documentos/:id" component={() => <div>Detalhes do Documento</div>} />
        <Route path="/public/atividades" component={AtividadesPage} />
        {/* Adicionar outras rotas públicas aqui */}
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  );
}