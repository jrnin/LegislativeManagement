import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Users, 
  Award,
  MapPin,
  ArrowLeft,
  ExternalLink,
  Activity,
  MessageSquare,
  Share2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { getInitials } from '@/lib/utils';

// Tipos
interface Councilor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  party: string;
  position: string;
  imageUrl?: string;
  birthDate?: string;
  education?: string;
  profession?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  address?: string;
  biography: string;
  elected: string;
}

interface Activity {
  id: number;
  type: string;
  number: string;
  date: string;
  description: string;
  status: string;
}

interface Document {
  id: number;
  type: string;
  number: string;
  date: string;
  description: string;
  status: string;
  file?: string;
}

interface Commission {
  id: number;
  name: string;
  role: string;
  period: string;
  type: string;
}

export default function VereadorDetalhesPage() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();

  // Dados mockados de um vereador específico
  const mockCouncilor: Councilor = {
    id: id || "1",
    name: "Ana Silva",
    email: "ana.silva@camara.gov.br",
    phone: "(11) 5555-1234",
    party: "Partido A",
    position: "Presidente",
    imageUrl: "https://randomuser.me/api/portraits/women/32.jpg",
    birthDate: "1975-05-15",
    education: "Doutorado em Direito Constitucional",
    profession: "Advogada",
    socialMedia: {
      facebook: "https://facebook.com/anasilva",
      instagram: "https://instagram.com/anasilva",
      twitter: "https://twitter.com/anasilva",
      linkedin: "https://linkedin.com/in/anasilva"
    },
    address: "Gabinete 123, Câmara Municipal",
    biography: "Ana Silva é formada em Direito pela Universidade Federal e possui doutorado em Direito Constitucional. Atua como vereadora desde 2016, tendo sido reeleita em 2020 com expressiva votação. Durante seu mandato, tem focado em projetos relacionados à educação, direitos humanos e transparência pública. É autora de diversos projetos de lei que beneficiaram diretamente a população local, especialmente nas áreas de educação inclusiva e proteção ambiental. Antes de ingressar na política, atuou como advogada por mais de 15 anos, com especialização em direito público.",
    elected: "2020"
  };

  // Atividades legislativas mockadas
  const mockActivities: Activity[] = [
    {
      id: 1,
      type: "Projeto de Lei",
      number: "PL 123/2023",
      date: "2023-05-10",
      description: "Institui o programa de coleta seletiva nas escolas municipais",
      status: "Aprovado"
    },
    {
      id: 2,
      type: "Indicação",
      number: "IND 45/2023",
      date: "2023-04-22",
      description: "Sugere a instalação de semáforos na Avenida Principal",
      status: "Encaminhado"
    },
    {
      id: 3,
      type: "Requerimento",
      number: "REQ 89/2023",
      date: "2023-03-15",
      description: "Solicita informações sobre a obra da UBS do Bairro Central",
      status: "Respondido"
    },
    {
      id: 4,
      type: "Projeto de Lei",
      number: "PL 78/2023",
      date: "2023-02-28",
      description: "Cria o programa de incentivo à leitura nas bibliotecas públicas",
      status: "Em tramitação"
    },
    {
      id: 5,
      type: "Moção",
      number: "MOC 12/2023",
      date: "2023-01-20",
      description: "Moção de aplausos aos profissionais de saúde da rede municipal",
      status: "Aprovado"
    }
  ];

  // Documentos mockados
  const mockDocuments: Document[] = [
    {
      id: 1,
      type: "Relatório",
      number: "REL 34/2023",
      date: "2023-05-05",
      description: "Relatório de visita às escolas municipais",
      status: "Público",
      file: "/documentos/relatorio34.pdf"
    },
    {
      id: 2,
      type: "Parecer",
      number: "PAR 56/2023",
      date: "2023-04-18",
      description: "Parecer sobre o projeto de lei de incentivo ao esporte",
      status: "Público",
      file: "/documentos/parecer56.pdf"
    },
    {
      id: 3,
      type: "Emenda",
      number: "EMD 22/2023",
      date: "2023-03-10",
      description: "Emenda ao orçamento municipal para ampliar recursos da educação",
      status: "Público",
      file: "/documentos/emenda22.pdf"
    },
    {
      id: 4,
      type: "Ofício",
      number: "OFC 78/2023",
      date: "2023-02-15",
      description: "Ofício solicitando informações sobre obras paralisadas",
      status: "Público",
      file: "/documentos/oficio78.pdf"
    }
  ];

  // Comissões mockadas
  const mockCommissions: Commission[] = [
    {
      id: 1,
      name: "Comissão de Educação",
      role: "Presidente",
      period: "2021-2022",
      type: "Permanente"
    },
    {
      id: 2,
      name: "Comissão de Direitos Humanos",
      role: "Membro",
      period: "2021-2022",
      type: "Permanente"
    },
    {
      id: 3,
      name: "Comissão Especial de Reforma Administrativa",
      role: "Relatora",
      period: "2022",
      type: "Temporária"
    }
  ];

  // Simulação de consultas à API
  const { data: councilor = mockCouncilor } = useQuery({
    queryKey: [`/api/public/councilors/${id}`],
    enabled: false,
    initialData: mockCouncilor
  });

  const { data: activities = mockActivities } = useQuery({
    queryKey: [`/api/public/councilors/${id}/activities`],
    enabled: false,
    initialData: mockActivities
  });

  const { data: documents = mockDocuments } = useQuery({
    queryKey: [`/api/public/councilors/${id}/documents`],
    enabled: false,
    initialData: mockDocuments
  });

  const { data: commissions = mockCommissions } = useQuery({
    queryKey: [`/api/public/councilors/${id}/commissions`],
    enabled: false,
    initialData: mockCommissions
  });

  // Formatador de datas
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Manipular status com cores
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado':
        return "bg-green-100 text-green-800";
      case 'em tramitação':
        return "bg-yellow-100 text-yellow-800";
      case 'arquivado':
        return "bg-red-100 text-red-800";
      case 'encaminhado':
      case 'respondido':
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Helmet>
        <title>{councilor.name} | Vereadores | Sistema Legislativo</title>
        <meta name="description" content={`Perfil do(a) vereador(a) ${councilor.name}. Informações de contato, atividades legislativas e comissões.`} />
      </Helmet>

      {/* Cabeçalho com informações principais */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white mr-2 hover:bg-blue-700" 
              onClick={() => setLocation('/public/vereadores')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Perfil de Vereador</h1>
          </div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-lg">
              <AvatarImage src={councilor.imageUrl} />
              <AvatarFallback className="bg-blue-800 text-white text-3xl">
                {getInitials(councilor.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold">{councilor.name}</h2>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mt-2">
                <Badge className="bg-white/20">{councilor.position}</Badge>
                <Badge className="bg-white/20">{councilor.party}</Badge>
                <Badge className="bg-white/20">Mandato {councilor.elected}-2024</Badge>
              </div>
              
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                <Button size="sm" variant="secondary" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Enviar e-mail
                </Button>
                <Button size="sm" variant="secondary" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Contatar
                </Button>
                <Button size="sm" variant="secondary" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna da esquerda - Informações pessoais */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">E-mail</h3>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${councilor.email}`} className="text-blue-600 hover:underline">
                      {councilor.email}
                    </a>
                  </p>
                </div>
                
                {councilor.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${councilor.phone.replace(/[^0-9]/g, '')}`} className="hover:underline">
                        {councilor.phone}
                      </a>
                    </p>
                  </div>
                )}
                
                {councilor.address && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Gabinete</h3>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {councilor.address}
                    </p>
                  </div>
                )}
                
                {councilor.birthDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Nascimento</h3>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(councilor.birthDate)}
                    </p>
                  </div>
                )}
                
                {councilor.profession && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Profissão</h3>
                    <p className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-400" />
                      {councilor.profession}
                    </p>
                  </div>
                )}
                
                {councilor.education && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Formação</h3>
                    <p>{councilor.education}</p>
                  </div>
                )}
                
                {councilor.socialMedia && Object.values(councilor.socialMedia).some(Boolean) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Redes Sociais</h3>
                    <div className="flex gap-2 mt-1">
                      {councilor.socialMedia.facebook && (
                        <a 
                          href={councilor.socialMedia.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          aria-label="Facebook"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                          </svg>
                        </a>
                      )}
                      {councilor.socialMedia.instagram && (
                        <a 
                          href={councilor.socialMedia.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-800"
                          aria-label="Instagram"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        </a>
                      )}
                      {councilor.socialMedia.twitter && (
                        <a 
                          href={councilor.socialMedia.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-600"
                          aria-label="Twitter"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.057 10.057 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.908 4.908 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.866 9.866 0 002.46-2.548l-.047-.02z" />
                          </svg>
                        </a>
                      )}
                      {councilor.socialMedia.linkedin && (
                        <a 
                          href={councilor.socialMedia.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-800 hover:text-blue-900"
                          aria-label="LinkedIn"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.7,3H4.3C3.582,3,3,3.582,3,4.3v15.4C3,20.418,3.582,21,4.3,21h15.4c0.718,0,1.3-0.582,1.3-1.3V4.3 C21,3.582,20.418,3,19.7,3z M8.339,18.338H5.667v-8.59h2.672V18.338z M7.004,8.574c-0.857,0-1.549-0.694-1.549-1.548 c0-0.855,0.691-1.548,1.549-1.548c0.854,0,1.547,0.694,1.547,1.548C8.551,7.881,7.858,8.574,7.004,8.574z M18.339,18.338h-2.669 v-4.177c0-0.996-0.017-2.278-1.387-2.278c-1.389,0-1.601,1.086-1.601,2.206v4.249h-2.667v-8.59h2.559v1.174h0.037 c0.356-0.675,1.227-1.387,2.526-1.387c2.703,0,3.203,1.779,3.203,4.092V18.338z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Biografia */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Biografia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate">
                  <p>{councilor.biography}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Coluna da direita - Abas com conteúdo */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="atividades">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="atividades" className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>Atividades</span>
                </TabsTrigger>
                <TabsTrigger value="documentos" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Documentos</span>
                </TabsTrigger>
                <TabsTrigger value="comissoes" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Comissões</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Aba de Atividades Legislativas */}
              <TabsContent value="atividades" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Atividades Legislativas</CardTitle>
                    <CardDescription>
                      Projetos de lei, indicações, requerimentos e outras atividades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activities.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Número</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activities.map((activity) => (
                            <TableRow key={activity.id}>
                              <TableCell className="font-medium">{activity.type}</TableCell>
                              <TableCell>{activity.number}</TableCell>
                              <TableCell>{formatDate(activity.date)}</TableCell>
                              <TableCell>{activity.description}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(activity.status)}>
                                  {activity.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">
                          Nenhuma atividade legislativa encontrada.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Aba de Documentos */}
              <TabsContent value="documentos" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Documentos</CardTitle>
                    <CardDescription>
                      Relatórios, pareceres e outros documentos elaborados pelo vereador
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {documents.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Número</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Arquivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">{doc.type}</TableCell>
                              <TableCell>{doc.number}</TableCell>
                              <TableCell>{formatDate(doc.date)}</TableCell>
                              <TableCell>{doc.description}</TableCell>
                              <TableCell>
                                {doc.file ? (
                                  <Button size="sm" variant="outline" className="gap-1 text-blue-600">
                                    <ExternalLink className="h-3 w-3" />
                                    Ver
                                  </Button>
                                ) : (
                                  <Badge variant="outline">Não disponível</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">
                          Nenhum documento encontrado.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Aba de Comissões */}
              <TabsContent value="comissoes" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Comissões</CardTitle>
                    <CardDescription>
                      Comissões permanentes e especiais das quais o vereador participa ou participou
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {commissions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Comissão</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Período</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissions.map((commission) => (
                            <TableRow key={commission.id}>
                              <TableCell className="font-medium">{commission.name}</TableCell>
                              <TableCell>{commission.type}</TableCell>
                              <TableCell>{commission.role}</TableCell>
                              <TableCell>{commission.period}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">
                          Não participa de nenhuma comissão atualmente.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-center">Projetos de Lei</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-3xl font-bold text-center text-blue-600">
                    {activities.filter(a => a.type === "Projeto de Lei").length}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-center">Proposições</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-3xl font-bold text-center text-blue-600">
                    {activities.filter(a => a.type !== "Projeto de Lei").length}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-center">Comissões</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-3xl font-bold text-center text-blue-600">
                    {commissions.length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}