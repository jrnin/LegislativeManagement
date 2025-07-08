import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { type Board, type Legislature, type User } from '@shared/schema';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import BoardMemberSelector from './BoardMemberSelector';

const boardFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  legislatureId: z.number().min(1, 'Legislatura é obrigatória'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de fim é obrigatória'),
  description: z.string().optional(),
});

type BoardFormData = z.infer<typeof boardFormSchema>;

interface BoardMember {
  userId: string;
  role: string;
}

interface BoardFormV2Props {
  boardId?: number;
  isEditing?: boolean;
  onSuccess?: () => void;
}

export default function BoardFormV2({ boardId, isEditing = false, onSuccess }: BoardFormV2Props) {
  const [, setLocation] = useLocation();
  const [selectedMembers, setSelectedMembers] = useState<BoardMember[]>([]);

  const form = useForm<BoardFormData>({
    resolver: zodResolver(boardFormSchema),
    defaultValues: {
      name: '',
      legislatureId: 0,
      startDate: '',
      endDate: '',
      description: '',
    },
  });

  // Fetch board data for editing
  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['/api/boards', boardId],
    queryFn: async () => {
      if (!boardId) return null;
      const response = await fetch(`/api/boards/${boardId}`);
      if (!response.ok) throw new Error('Failed to fetch board');
      return response.json() as Promise<Board>;
    },
    enabled: !!boardId && isEditing,
  });

  // Fetch legislatures
  const { data: legislatures = [] } = useQuery({
    queryKey: ['/api/legislatures'],
    queryFn: async () => {
      const response = await fetch('/api/legislatures');
      if (!response.ok) throw new Error('Failed to fetch legislatures');
      return response.json() as Promise<Legislature[]>;
    },
  });

  // Fetch users (councilors)
  const { data: users = [] } = useQuery({
    queryKey: ['/api/councilors'],
    queryFn: async () => {
      const response = await fetch('/api/councilors');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json() as Promise<User[]>;
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (board && isEditing) {
      form.reset({
        name: board.name,
        legislatureId: board.legislatureId,
        startDate: board.startDate,
        endDate: board.endDate,
        description: board.description || '',
      });

      // Set selected members
      if (board.members) {
        const members = board.members.map(member => ({
          userId: member.userId,
          role: member.role
        }));
        setSelectedMembers(members);
      }
    }
  }, [board, isEditing, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: BoardFormData & { members: BoardMember[] }) => {
      return apiRequest('/api/boards', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
      toast({
        title: 'Sucesso',
        description: 'Mesa Diretora criada com sucesso.',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation('/boards');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar Mesa Diretora.',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: BoardFormData & { members: BoardMember[] }) => {
      return apiRequest(`/api/boards/${boardId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/boards', boardId] });
      toast({
        title: 'Sucesso',
        description: 'Mesa Diretora atualizada com sucesso.',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation('/boards');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar Mesa Diretora.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BoardFormData) => {
    const payload = {
      ...data,
      members: selectedMembers,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (boardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => setLocation('/boards')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Mesa Diretora' : 'Nova Mesa Diretora'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Edite os dados da Mesa Diretora' : 'Crie uma nova Mesa Diretora'}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Mesa *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ex: Mesa Diretora da 1ª Legislatura"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="legislatureId">Legislatura *</Label>
                <Select 
                  value={form.watch('legislatureId')?.toString() || ''} 
                  onValueChange={(value) => form.setValue('legislatureId', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a legislatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {legislatures.map((legislature) => (
                      <SelectItem key={legislature.id} value={legislature.id.toString()}>
                        {legislature.number}ª Legislatura
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.legislatureId && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.legislatureId.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register('startDate')}
                />
                {form.formState.errors.startDate && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.startDate.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">Data de Fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...form.register('endDate')}
                />
                {form.formState.errors.endDate && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Descreva a Mesa Diretora..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Member Selection */}
        <BoardMemberSelector
          availableUsers={users}
          selectedMembers={selectedMembers}
          onMembersChange={setSelectedMembers}
        />

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setLocation('/boards')}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Atualizar' : 'Criar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}