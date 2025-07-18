import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImagesTestPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Módulo de Imagens</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Teste: O módulo de imagens está funcionando!</p>
        </CardContent>
      </Card>
    </div>
  );
}