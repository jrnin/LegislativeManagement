import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Legislature } from "@shared/schema";

// Função de formatação de data
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date ? dateObj.toISOString().split('T')[0] : '';
}

const createFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: "CPF inválido. Use o formato 000.000.000-00" }),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data de nascimento inválida" }),
  zipCode: z.string().regex(/^\d{5}-\d{3}$/, { message: "CEP inválido. Use o formato 00000-000" }),
  address: z.string().min(3, { message: "Endereço é obrigatório" }),
  neighborhood: z.string().min(1, { message: "Bairro é obrigatório" }),
  number: z.string().min(1, { message: "Número é obrigatório" }),
  city: z.string().min(2, { message: "Cidade é obrigatória" }),
  state: z.string().length(2, { message: "Estado deve ter 2 caracteres" }),
  role: z.enum(["admin", "councilor"], { message: "Selecione um perfil válido" }),
  legislatureId: z.string().transform(val => val ? Number(val) : undefined).optional(),
  maritalStatus: z.string().optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

const updateFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: "CPF inválido. Use o formato 000.000.000-00" }),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data de nascimento inválida" }),
  zipCode: z.string().regex(/^\d{5}-\d{3}$/, { message: "CEP inválido. Use o formato 00000-000" }),
  address: z.string().min(3, { message: "Endereço é obrigatório" }),
  neighborhood: z.string().min(1, { message: "Bairro é obrigatório" }),
  number: z.string().min(1, { message: "Número é obrigatório" }),
  city: z.string().min(2, { message: "Cidade é obrigatória" }),
  state: z.string().length(2, { message: "Estado deve ter 2 caracteres" }),
  role: z.enum(["admin", "councilor"], { message: "Selecione um perfil válido" }),
  legislatureId: z.string().transform(val => val ? Number(val) : undefined).optional(),
  maritalStatus: z.string().optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).optional(),
  confirmPassword: z.string().optional(),
}).refine(data => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof createFormSchema> & z.infer<typeof updateFormSchema>;

export default function UserForm() {
  const [_, navigate] = useLocation();
  const params = useParams();
  const userId = params.id;
  const isEditing = !!userId;
  const { toast } = useToast();
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: legislatures = [] } = useQuery<Legislature[]>({
    queryKey: ["/api/legislatures"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(isEditing ? updateFormSchema : createFormSchema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      birthDate: "",
      zipCode: "",
      address: "",
      neighborhood: "",
      number: "",
      city: "",
      state: "",
      role: "councilor",
      legislatureId: undefined,
      maritalStatus: "",
      occupation: "",
      education: "",
      password: "",
      confirmPassword: "",
    }
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        cpf: user.cpf || "",
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
        zipCode: user.zipCode || "",
        address: user.address || "",
        neighborhood: user.neighborhood || "",
        number: user.number || "",
        city: user.city || "",
        state: user.state || "",
        role: user.role as "admin" | "councilor",
        legislatureId: user.legislatureId || undefined,
        maritalStatus: user.maritalStatus || "",
        occupation: user.occupation || "",
        education: user.education || "",
      });
    }
  }, [user, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      });
      navigate("/users");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("PUT", `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
      navigate("/users");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Remove a senha se estiver vazia na edição (mantém a senha atual)
    const submitData = { ...data };
    
    if (isEditing) {
      // Se a senha está vazia, não a inclua no payload de envio
      if (!submitData.password || submitData.password === '') {
        const dataToSubmit = { ...submitData };
        // Usando cópia separada para evitar problemas com tipagem
        const { password, confirmPassword, ...restData } = dataToSubmit;
        updateMutation.mutate(restData as FormData);
      } else {
        updateMutation.mutate(submitData);
      }
    } else {
      createMutation.mutate(submitData);
    }
  };

  const lookupAddress = async (zipCode: string) => {
    if (!zipCode || zipCode.length !== 9) return;
    
    setIsLoadingAddress(true);
    try {
      const cleanZip = zipCode.replace('-', '');
      const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue('address', data.logradouro);
        form.setValue('neighborhood', data.bairro);
        form.setValue('city', data.localidade);
        form.setValue('state', data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue('zipCode', value);
    
    if (value.length === 9) {
      lookupAddress(value);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      // Format as 000.000.000-00
      value = value.replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    form.setValue('cpf', value);
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 8) {
      // Format as 00000-000
      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    
    form.setValue('zipCode', value);
    
    if (value.length === 9) {
      lookupAddress(value);
    }
  };

  if (userLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Usuário" : "Novo Usuário"}
        </h1>
        <Button variant="outline" onClick={() => navigate("/users")}>
          Voltar
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Usuário" : "Novo Usuário"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Altere as informações do usuário nos campos abaixo." 
              : "Preencha os campos abaixo para criar um novo usuário."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage 
                    src={user?.profileImageUrl || ""} 
                    alt={user?.name || "Foto do usuário"} 
                  />
                  <AvatarFallback>
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-medium">{user?.name || "Novo Usuário"}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email || "Adicione um email"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Informações Pessoais</h3>
                <Separator />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000.000.000-00" 
                          value={field.value} 
                          onChange={handleCpfChange}
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="uniaoEstavel">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ocupação</FormLabel>
                      <FormControl>
                        <Input placeholder="Ocupação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escolaridade</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fundamental">Ensino Fundamental</SelectItem>
                          <SelectItem value="medio">Ensino Médio</SelectItem>
                          <SelectItem value="superior">Ensino Superior</SelectItem>
                          <SelectItem value="posGraduacao">Pós-Graduação</SelectItem>
                          <SelectItem value="mestrado">Mestrado</SelectItem>
                          <SelectItem value="doutorado">Doutorado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Endereço</h3>
                <Separator />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00000-000" 
                          value={field.value} 
                          onChange={handleZipCodeChange}
                          maxLength={9}
                        />
                      </FormControl>
                      {isLoadingAddress && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua/Avenida" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Número" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Informações do Sistema</h3>
                <Separator />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um perfil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="councilor">Vereador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("role") === "councilor" && (
                  <FormField
                    control={form.control}
                    name="legislatureId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legislatura</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? Number(value) : undefined)} 
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma legislatura" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {legislatures.map((legislature) => (
                              <SelectItem key={legislature.id} value={String(legislature.id)}>
                                {legislature.number}ª Legislatura ({formatDate(legislature.startDate)} - {formatDate(legislature.endDate)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{isEditing ? "Alterar Senha" : "Senha"}</h3>
                  <Separator />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isEditing ? "Nova Senha" : "Senha"}</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={isEditing ? "Nova senha (deixe em branco para manter a atual)" : "Senha"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                        {isEditing && (
                          <FormDescription>
                            Deixe em branco para manter a senha atual
                          </FormDescription>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirme a senha" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate("/users")}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center gap-1">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      Salvando...
                    </span>
                  ) : isEditing ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
