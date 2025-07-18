import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NewsCategory } from "@shared/schema";
import { Save, Palette } from "lucide-react";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  slug: z.string().min(1, "URL amigável é obrigatória").max(100, "URL muito longa"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hex válido").default("#3B82F6"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: NewsCategory | null;
  onSuccess: () => void;
}

const defaultColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
];

export default function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      color: "#3B82F6",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        color: category.color || "#3B82F6",
      });
    }
  }, [category, form]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!category) {
      form.setValue("slug", generateSlug(name));
    }
  };

  const saveCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const url = category ? `/api/news/categories/${category.id}` : "/api/news/categories";
      const method = category ? "PUT" : "POST";
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news/categories"] });
      toast({
        title: "Sucesso",
        description: `Categoria ${category ? "atualizada" : "criada"} com sucesso!`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao ${category ? "atualizar" : "criar"} categoria`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    saveCategoryMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          {...form.register("name")}
          onChange={handleNameChange}
          placeholder="Digite o nome da categoria"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="slug">URL Amigável *</Label>
        <Input
          id="slug"
          {...form.register("slug")}
          placeholder="url-amigavel-categoria"
        />
        {form.formState.errors.slug && (
          <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Descrição da categoria (opcional)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="color">Cor da Categoria</Label>
        <div className="space-y-2">
          <Input
            id="color"
            type="color"
            {...form.register("color")}
            className="w-20 h-10"
          />
          <div className="flex flex-wrap gap-2">
            {defaultColors.map((color) => (
              <button
                key={color}
                type="button"
                className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500 transition-colors"
                style={{ backgroundColor: color }}
                onClick={() => form.setValue("color", color)}
                title={color}
              />
            ))}
          </div>
        </div>
        {form.formState.errors.color && (
          <p className="text-sm text-red-500">{form.formState.errors.color.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saveCategoryMutation.isPending}>
          {saveCategoryMutation.isPending ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {category ? "Atualizar" : "Criar"} Categoria
            </>
          )}
        </Button>
      </div>
    </form>
  );
}