import { storage } from '../server/storage';

async function createTypicalDocuments() {
  console.log('📋 Criando documentos típicos de uma câmara municipal...');
  
  try {
    const typicalDocuments = [
      // Portarias administrativas
      {
        documentNumber: 4,
        documentType: 'PORTARIA',
        documentDate: new Date('2025-01-15'),
        authorType: 'CAMARA',
        description: 'Portaria nº 04/2025 - Designação de Comissão Permanente',
        fileName: 'portaria-04-2025.pdf',
        filePath: null,
        fileType: 'application/pdf',
        status: 'ACTIVE',
      },
      {
        documentNumber: 5,
        documentType: 'PORTARIA',
        documentDate: new Date('2025-01-20'),
        authorType: 'CAMARA',
        description: 'Portaria nº 05/2025 - Nomeação de Assessor Legislativo',
        fileName: 'portaria-05-2025.pdf',
        filePath: null,
        fileType: 'application/pdf',
        status: 'ACTIVE',
      },
      // Decretos Legislativos
      {
        documentNumber: 1,
        documentType: 'DECRETO_LEGISLATIVO',
        documentDate: new Date('2025-02-01'),
        authorType: 'CAMARA',
        description: 'Decreto Legislativo nº 01/2025 - Aprovação de Contas do Município',
        fileName: 'decreto-legislativo-01-2025.pdf',
        filePath: null,
        fileType: 'application/pdf',
        status: 'ACTIVE',
      },
      // Atas de sessões
      {
        documentNumber: 2,
        documentType: 'ATA',
        documentDate: new Date('2025-02-05'),
        authorType: 'CAMARA',
        description: 'Ata da 2ª Sessão Ordinária - Fevereiro/2025',
        fileName: 'ata-2a-sessao-2025.pdf',
        filePath: null,
        fileType: 'application/pdf',
        status: 'ACTIVE',
      },
      {
        documentNumber: 3,
        documentType: 'ATA',
        documentDate: new Date('2025-02-12'),
        authorType: 'CAMARA',
        description: 'Ata da 3ª Sessão Ordinária - Fevereiro/2025',
        fileName: 'ata-3a-sessao-2025.pdf',
        filePath: null,
        fileType: 'application/pdf',
        status: 'ACTIVE',
      },
      // Projetos de Lei
      {
        documentNumber: 1,
        documentType: 'PROJETO_LEI',
        documentDate: new Date('2025-02-15'),
        authorType: 'CAMARA',
        description: 'Projeto de Lei nº 01/2025 - Política Municipal de Meio Ambiente',
        fileName: 'projeto-lei-01-2025.pdf',
        filePath: null,
        fileType: 'application/pdf',
        status: 'ACTIVE',
      },
      // Leis aprovadas
      {
        documentNumber: 1,
        documentType: 'LEI',
        documentDate: new Date('2025-03-01'),
        authorType: 'CAMARA',
        description: 'Lei nº 01/2025 - Lei Orçamentária Anual',
        fileName: 'lei-01-2025.pdf',
        filePath: null,
        fileType: 'application/pdf',
        status: 'ACTIVE',
      },
      // Ofícios
      {
        documentNumber: 1,
        documentType: 'OFICIO',
        documentDate: new Date('2025-03-05'),
        authorType: 'CAMARA',
        description: 'Ofício nº 01/2025 - Solicitação de Informações ao Executivo',
        fileName: 'oficio-01-2025.pdf',
        filePath: null,
        fileType: 'application/pdf',
        status: 'ACTIVE',
      },
      // Pautas de sessão
      {
        documentNumber: 1,
        documentType: 'PAUTA',
        documentDate: new Date('2025-03-10'),
        authorType: 'CAMARA',
        description: 'Pauta da 4ª Sessão Ordinária - Março/2025',
        fileName: 'pauta-4a-sessao-2025.pdf',
        filePath: null,
        fileType: 'application/pdf',
        status: 'ACTIVE',
      },
      // Regimento Interno
      {
        documentNumber: 1,
        documentType: 'REGIMENTO',
        documentDate: new Date('2025-01-01'),
        authorType: 'CAMARA',
        description: 'Regimento Interno da Câmara Municipal de Jaíba',
        fileName: 'regimento-interno-2025.pdf',
        filePath: null,
        fileType: 'application/pdf',
        status: 'ACTIVE',
      }
    ];
    
    console.log(`📝 Criando ${typicalDocuments.length} documentos típicos...`);
    let createdCount = 0;
    
    for (const docData of typicalDocuments) {
      try {
        await storage.createDocument({
          ...docData,
          createdBy: 1, // Admin user
          legislatureId: 1,
        });
        createdCount++;
        console.log(`✅ Criado: ${docData.description}`);
      } catch (error) {
        console.log(`❌ Erro criando documento: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Estrutura de documentos restaurada!`);
    console.log(`✅ ${createdCount} documentos criados`);
    console.log('📋 Tipos incluídos: Portarias, Decretos, Atas, Projetos de Lei, Leis, Ofícios, Pautas e Regimento');
    console.log('⚠️  Nota: Arquivos físicos precisarão ser recarregados pelos usuários');
    
  } catch (error) {
    console.error('❌ Erro criando documentos típicos:', error);
  }
}

createTypicalDocuments().catch(console.error);