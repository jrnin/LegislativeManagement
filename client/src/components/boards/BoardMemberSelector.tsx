import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { User, boardRoles } from '@shared/schema';
import { Plus, X } from 'lucide-react';

interface BoardMember {
  userId: string;
  role: string;
}

interface BoardMemberSelectorProps {
  availableUsers: User[];
  selectedMembers: BoardMember[];
  onMembersChange: (members: BoardMember[]) => void;
}

export default function BoardMemberSelector({
  availableUsers,
  selectedMembers,
  onMembersChange
}: BoardMemberSelectorProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const addMember = () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: 'Erro',
        description: 'Selecione um usuário e um cargo.',
        variant: 'destructive',
      });
      return;
    }

    // Check if user is already assigned to this role
    const existingMember = selectedMembers.find(m => m.userId === selectedUserId && m.role === selectedRole);
    if (existingMember) {
      toast({
        title: 'Aviso',
        description: 'Este usuário já está atribuído a este cargo.',
        variant: 'destructive',
      });
      return;
    }

    // Check if role is already assigned to another user
    const roleExists = selectedMembers.find(m => m.role === selectedRole);
    if (roleExists) {
      toast({
        title: 'Aviso',
        description: 'Este cargo já está atribuído a outro usuário.',
        variant: 'destructive',
      });
      return;
    }

    const newMembers = [...selectedMembers, { userId: selectedUserId, role: selectedRole }];
    onMembersChange(newMembers);
    
    // Reset form
    setSelectedUserId('');
    setSelectedRole('');
  };

  const removeMember = (userId: string, role: string) => {
    const newMembers = selectedMembers.filter(m => !(m.userId === userId && m.role === role));
    onMembersChange(newMembers);
  };

  const getUserById = (userId: string) => {
    return availableUsers.find(u => u.id === userId);
  };

  const getAvailableRoles = () => {
    return boardRoles.filter(role => !selectedMembers.some(m => m.role === role));
  };

  const getAvailableUsers = () => {
    return availableUsers.filter(user => user.role === 'councilor' || user.role === 'admin');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composição da Mesa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Member Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Usuário</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableUsers().map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Cargo</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableRoles().map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={addMember}
              disabled={!selectedUserId || !selectedRole}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Selected Members List */}
        <div className="space-y-2">
          <h4 className="font-medium">Membros Selecionados</h4>
          {selectedMembers.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum membro selecionado</p>
          ) : (
            <div className="space-y-2">
              {selectedMembers.map((member) => {
                const user = getUserById(member.userId);
                return (
                  <div key={`${member.userId}-${member.role}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user?.name || 'Usuário não encontrado'}</p>
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    <Button
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
          )}
        </div>

        {/* Role Summary */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Cargos Disponíveis</h4>
          <div className="flex flex-wrap gap-2">
            {boardRoles.map((role) => {
              const isAssigned = selectedMembers.some(m => m.role === role);
              return (
                <Badge 
                  key={role} 
                  variant={isAssigned ? "default" : "outline"}
                  className={isAssigned ? "bg-green-100 text-green-800" : ""}
                >
                  {role}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}