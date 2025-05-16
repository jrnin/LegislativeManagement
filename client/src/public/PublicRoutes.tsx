import React from 'react';
import { Switch, Route } from 'wouter';
import PublicLayout from './PublicLayout';
import HomePage from './HomePage';
import VereadoresPage from './VereadoresPage';
import VereadorDetalhesPage from './VereadorDetalhesPage';
import NotFound from '@/pages/not-found';

export default function PublicRoutes() {
  return (
    <PublicLayout>
      <Switch>
        <Route path="/public" component={HomePage} />
        <Route path="/public/vereadores" component={VereadoresPage} />
        <Route path="/public/vereadores/:id" component={VereadorDetalhesPage} />
        {/* Adicionar outras rotas públicas aqui */}
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  );
}