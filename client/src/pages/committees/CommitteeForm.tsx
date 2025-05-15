import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardListIcon,
  SaveIcon,
} from 'lucide-react';

// Esquema de validação
const committeeSchema = z.object({
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  type: z.string().min(1, { message: 'Tipo é obrigatório' }),
  description: z.string().min(1, { message: 'Descrição é obrigatória' }),
  startDate: z.string().min(1, { message: 'Data de início é obrigatória' }),
  endDate: z.string().min(1, { message: 'Data de término é obrigatória' }),
  memberIds: z.array(z.string()).optional(),
});

type CommitteeFormValues = z.infer<typeof committeeSchema>;

export default function CommitteeForm() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const isEditing = !!id;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Carregar dados do comitê se estiver editando
  const { data: committee, isLoading: isLoadingCommittee } = useQuery({
    queryKey: [`/api/committees/${id}`],
    retry: false,
    enabled: isEditing,
  });
  
  // Carregar vereadores para adicionar como membros
  const { data: councilors, isLoading: isLoadingCouncilors } = useQuery({
    queryKey: ['/api/users/councilors'],
    retry: false,
  });
  
  // Inicializar formulário
  const form = useForm<CommitteeFormValues>({
    resolver: zodResolver(committeeSchema),
    defaultValues: {
      name: '',
      type: '',
      description: '',
      startDate: '',
      endDate: '',
      memberIds: [],
    },
  });
  
  // Preencher o formulário com dados existentes quando editar
  useEffect(() => {
    if (committee && isEditing) {
      const startDate = new Date(committee.startDate);
      const endDate = new Date(committee.endDate);
      
      // Formatar datas para o formato de entrada de data HTML (YYYY-MM-DD)
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Obter IDs dos membros atuais
      const currentMemberIds = committee.members?.map(member => member.userId) || [];
      
      form.reset({
        name: committee.name,
        type: committee.type,
        description: committee.description,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        memberIds: currentMemberIds,
      });
    }
  }, [committee, isEditing, form]);
  
  // Enviar formulário
  const onSubmit = async (values: CommitteeFormValues) => {
    setIsSubmitting(true);
    
    try {
      const url = isEditing 
        ? `/api/committees/${id}` 
        : '/api/committees';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar comissão');
      }
      
      const savedCommittee = await response.json();
      
      toast({
        title: isEditing ? 'Comissão atualizada' : 'Comissão criada',
        description: isEditing 
          ? 'A comissão foi atualizada com sucesso' 
          : 'A comissão foi criada com sucesso',
      });
      
      // Invalidar cache para atualizar as listas
      queryClient.invalidateQueries({ queryKey: ['/api/committees'] });
      
      // Redirecionar para detalhes da comissão
      navigate(`/committees/${savedCommittee.id}`);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar a comissão',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Renderizar estado de carregamento
  if ((isEditing && isLoadingCommittee) || isLoadingCouncilors) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }
  
  // Renderizar formulário não encontrado
  if (isEditing && !committee) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-2xl font-bold mb-2">Comissão não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A comissão que você está tentando editar não foi encontrada.
          </p>
          <Button onClick={() => navigate('/committees')}>
            Voltar para a lista de comissões
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4 h-8 w-8 p-0" 
          onClick={() => navigate('/committees')}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Editar Comissão' : 'Nova Comissão'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing 
              ? 'Atualize as informações da comissão' 
              : 'Preencha os dados para criar uma nova comissão'
            }
          </p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardListIcon className="mr-2 h-5 w-5" />
                Informações da Comissão
              </CardTitle>
              <CardDescription>
                Preencha as informações básicas da comissão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Comissão</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Comissão de Ética e Decoro Parlamentar" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Comissão</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="permanente">Permanente</SelectItem>
                        <SelectItem value="temporária">Temporária</SelectItem>
                        <SelectItem value="especial">Especial</SelectItem>
                        <SelectItem value="parlamentar">Parlamentar de Inquérito</SelectItem>
                        <SelectItem value="representação">Representação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva os objetivos e funções da comissão" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <Input type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Término</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <Input type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/committees')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <SaveIcon className="mr-2 h-4 w-4" />
                    {isEditing ? 'Atualizar' : 'Criar'} Comissão
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}