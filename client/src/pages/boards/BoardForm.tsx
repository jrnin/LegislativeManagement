import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { type Board, type Legislature, type User, boardRoles } from '@shared/schema';
import { Plus, X, ArrowLeft } from 'lucide-react';

const boardFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  legislatureId: z.number().min(1, 'Legislatura é obrigatória'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de fim é obrigatória'),
  description: z.string().optional(),
});

type BoardFormData = z.infer<typeof boardFormSchema>;

interface BoardFormProps {
  boardId?: number;
  isEditing?: boolean;
}

export default function BoardForm({ boardId, isEditing = false }: BoardFormProps) {
  const [, setLocation] = useLocation();
  const [selectedMembers, setSelectedMembers] = useState<Array<{ userId: string; role: string }>>([]);

  const { data: board } = useQuery({
    queryKey: ['/api/boards', boardId],
    queryFn: async () => {
      const response = await fetch(`/api/boards/${boardId}`);
      if (!response.ok) throw new Error('Failed to fetch board');
      return response.json() as Promise<Board>;
    },
    enabled: !!boardId,
  });

  const { data: legislatures } = useQuery({
    queryKey: ['/api/legislatures'],
    queryFn: async () => {
      const response = await fetch('/api/legislatures');
      if (!response.ok) throw new Error('Failed to fetch legislatures');
      return response.json() as Promise<Legislature[]>;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users/councilors'],
    queryFn: async () => {
      const response = await fetch('/api/users/councilors');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json() as Promise<User[]>;
    },
  });

  const form = useForm<BoardFormData>({
    resolver: zodResolver(boardFormSchema),
    defaultValues: {
      name: board?.name || '',
      legislatureId: board?.legislatureId || undefined,
      startDate: board?.startDate || '',
      endDate: board?.endDate || '',
      description: board?.description || '',
    },
  });

  // Set form values when board data is loaded
  useState(() => {
    if (board) {
      form.reset({
        name: board.name,
        legislatureId: board.legislatureId,
        startDate: board.startDate,
        endDate: board.endDate,
        description: board.description || '',
      });
      if (board.members) {
        setSelectedMembers(board.members.map(member => ({
          userId: member.userId,
          role: member.role,
        })));
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: BoardFormData & { members: Array<{ userId: string; role: string }> }) => {
      return apiRequest('/api/boards', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Mesa Diretora criada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
      setLocation('/boards');
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar Mesa Diretora.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BoardFormData & { members: Array<{ userId: string; role: string }> }) => {
      return apiRequest(`/api/boards/${boardId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Mesa Diretora atualizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/boards', boardId] });
      setLocation('/boards');
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar Mesa Diretora.',
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

  const addMember = (userId: string, role: string) => {
    // Check if user is already assigned to this role
    const existingMember = selectedMembers.find(m => m.userId === userId && m.role === role);
    if (existingMember) {
      toast({
        title: 'Aviso',
        description: 'Este usuário já está atribuído a este cargo.',
        variant: 'destructive',
      });
      return;
    }

    // Check if role is already assigned
    const roleExists = selectedMembers.find(m => m.role === role);
    if (roleExists) {
      toast({
        title: 'Aviso',
        description: 'Este cargo já está atribuído a outro usuário.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedMembers([...selectedMembers, { userId, role }]);
  };

  const removeMember = (userId: string, role: string) => {
    setSelectedMembers(selectedMembers.filter(m => !(m.userId === userId && m.role === role)));
  };

  const getUserById = (userId: string) => {
    return users?.find(u => u.id === userId);
  };

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
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="legislatureId">Legislatura *</Label>
                <Select
                  value={form.watch('legislatureId')?.toString()}
                  onValueChange={(value) => form.setValue('legislatureId', Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a legislatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {legislatures?.map((legislature) => (
                      <SelectItem key={legislature.id} value={legislature.id.toString()}>
                        {legislature.number}ª Legislatura ({new Date(legislature.startDate).getFullYear()}-{new Date(legislature.endDate).getFullYear()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.legislatureId && (
                  <p className="text-sm text-red-500">{form.formState.errors.legislatureId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register('startDate')}
                />
                {form.formState.errors.startDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.startDate.message}</p>
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
                  <p className="text-sm text-red-500">{form.formState.errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Descrição da Mesa Diretora"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composição da Mesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Members */}
              {selectedMembers.length > 0 && (
                <div>
                  <Label>Membros Selecionados</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {selectedMembers.map((member, index) => {
                      const user = getUserById(member.userId);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.profileImageUrl || ''} />
                              <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user?.name}</p>
                              <Badge variant="secondary">{member.role}</Badge>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member.userId, member.role)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Members */}
              <div>
                <Label>Adicionar Membros</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {boardRoles.map((role) => {
                    const isAssigned = selectedMembers.some(m => m.role === role);
                    return (
                      <div key={role} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="font-medium">{role}</Label>
                          {isAssigned && <Badge variant="secondary">Atribuído</Badge>}
                        </div>
                        
                        {!isAssigned && (
                          <div className="space-y-2">
                            {users?.map((user) => (
                              <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.profileImageUrl || ''} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{user.name}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addMember(user.id, role)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => setLocation('/boards')}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Atualizar' : 'Criar'} Mesa Diretora
          </Button>
        </div>
      </form>
    </div>
  );
}