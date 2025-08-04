import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NewsArticle, NewsCategory } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { 
  Image, 
  Calendar, 
  Eye, 
  Star, 
  Save, 
  Upload,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link,
  Code,
  X
} from "lucide-react";

const newsFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255, "Título muito longo"),
  slug: z.string().min(1, "URL amigável é obrigatória").max(255, "URL muito longa"),
  excerpt: z.string().min(1, "Resumo é obrigatório").max(500, "Resumo muito longo"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  categoryId: z.number().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  publishedAt: z.string().optional(),
});

type NewsFormData = z.infer<typeof newsFormSchema>;

interface NewsFormProps {
  news?: NewsArticle | null;
  categories: NewsCategory[];
  onSuccess: () => void;
}

export default function NewsForm({ news, categories, onSuccess }: NewsFormProps) {
  const [currentTag, setCurrentTag] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NewsFormData>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      categoryId: undefined,
      status: "draft",
      featured: false,
      tags: [],
      metaTitle: "",
      metaDescription: "",
      publishedAt: "",
    },
  });

  useEffect(() => {
    if (news) {
      form.reset({
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt || "",
        content: news.content,
        categoryId: news.categoryId || undefined,
        status: news.status as "draft" | "published" | "archived",
        featured: news.featured || false,
        tags: news.tags || [],
        metaTitle: news.metaTitle || "",
        metaDescription: news.metaDescription || "",
        publishedAt: news.publishedAt ? new Date(news.publishedAt).toISOString().slice(0, 16) : "",
      });
      if (news.imageUrl) {
        setCoverImagePreview(news.imageUrl);
      }
    }
  }, [news, form]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue("title", title);
    if (!news) {
      form.setValue("slug", generateSlug(title));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !form.getValues("tags").includes(currentTag.trim())) {
      const newTags = [...form.getValues("tags"), currentTag.trim()];
      form.setValue("tags", newTags);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = form.getValues("tags").filter(tag => tag !== tagToRemove);
    form.setValue("tags", newTags);
  };

  const saveNewsMutation = useMutation({
    mutationFn: async (data: NewsFormData) => {
      console.log("SaveNewsMutation called with:", data);
      setIsUploading(true);
      
      try {
        const formData = new FormData();
        
        // Add cover image if selected
        if (coverImage) {
          formData.append("coverImage", coverImage);
        }
        
        // Add form data
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === "tags") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        const url = news ? `/api/news/${news.id}` : "/api/news";
        const method = news ? "PUT" : "POST";
        
        console.log("Making request to:", url, "with method:", method);
        
        const response = await fetch(url, {
          method,
          body: formData,
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error:", errorText);
          throw new Error("Erro ao salvar notícia");
        }

        const result = await response.json();
        console.log("Success response:", result);
        return result;
      } catch (error) {
        console.error("Mutation error:", error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (result) => {
      console.log("Mutation success:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "Sucesso",
        description: `Notícia ${news ? "atualizada" : "criada"} com sucesso!`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao ${news ? "atualizar" : "criar"} notícia`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewsFormData) => {
    console.log("NewsForm onSubmit called with data:", data);
    console.log("Form errors:", form.formState.errors);
    saveNewsMutation.mutate(data);
  };

  // Simple text formatting functions
  const formatText = (format: string) => {
    const textarea = document.getElementById("content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const currentValue = form.getValues("content");
    
    let newText = "";
    let newCursorPos = start;

    switch (format) {
      case "bold":
        newText = `**${selectedText}**`;
        newCursorPos = start + (selectedText ? newText.length : 2);
        break;
      case "italic":
        newText = `*${selectedText}*`;
        newCursorPos = start + (selectedText ? newText.length : 1);
        break;
      case "underline":
        newText = `<u>${selectedText}</u>`;
        newCursorPos = start + (selectedText ? newText.length : 3);
        break;
      case "quote":
        newText = `> ${selectedText}`;
        newCursorPos = start + newText.length;
        break;
      case "list":
        newText = `- ${selectedText}`;
        newCursorPos = start + newText.length;
        break;
      case "ordered":
        newText = `1. ${selectedText}`;
        newCursorPos = start + newText.length;
        break;
      case "code":
        newText = `\`${selectedText}\``;
        newCursorPos = start + (selectedText ? newText.length : 1);
        break;
      case "link":
        newText = `[${selectedText}](url)`;
        newCursorPos = start + newText.length - 4;
        break;
      default:
        return;
    }

    const newValue = currentValue.substring(0, start) + newText + currentValue.substring(end);
    form.setValue("content", newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  onChange={handleTitleChange}
                  placeholder="Digite o título da notícia"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="slug">URL Amigável *</Label>
                <Input
                  id="slug"
                  {...form.register("slug")}
                  placeholder="url-amigavel-da-noticia"
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="excerpt">Resumo *</Label>
                <Textarea
                  id="excerpt"
                  {...form.register("excerpt")}
                  placeholder="Breve resumo da notícia para exibição em listas"
                  rows={3}
                />
                {form.formState.errors.excerpt && (
                  <p className="text-sm text-red-500">{form.formState.errors.excerpt.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="categoryId">Categoria</Label>
                <Select
                  value={form.watch("categoryId")?.toString() || "none"}
                  onValueChange={(value) => form.setValue("categoryId", value && value !== "none" ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Imagem de Capa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="coverImage">Imagem de Capa</Label>
                  <Input
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <p className="text-sm text-gray-500">
                    Tamanho máximo: 5MB. Formatos aceitos: JPG, PNG, WebP
                  </p>
                </div>
                
                {coverImagePreview && (
                  <div className="relative">
                    <img
                      src={coverImagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setCoverImage(null);
                        setCoverImagePreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as "draft" | "published" | "archived")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Notícia em Destaque</Label>
                <Switch
                  id="featured"
                  checked={form.watch("featured")}
                  onCheckedChange={(checked) => form.setValue("featured", checked)}
                />
              </div>

              <div>
                <Label htmlFor="publishedAt">Data de Publicação</Label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  {...form.register("publishedAt")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.watch("tags").map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X
                        className="h-3 w-3 ml-1"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Título</Label>
                <Input
                  id="metaTitle"
                  {...form.register("metaTitle")}
                  placeholder="Título para SEO (opcional)"
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Descrição</Label>
                <Textarea
                  id="metaDescription"
                  {...form.register("metaDescription")}
                  placeholder="Descrição para SEO (opcional)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da Notícia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => formatText("bold")}
                title="Negrito"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => formatText("italic")}
                title="Itálico"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => formatText("underline")}
                title="Sublinhado"
              >
                <Underline className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-gray-300" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => formatText("list")}
                title="Lista"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => formatText("ordered")}
                title="Lista Numerada"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => formatText("quote")}
                title="Citação"
              >
                <Quote className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-gray-300" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => formatText("link")}
                title="Link"
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => formatText("code")}
                title="Código"
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>

            {/* Content textarea */}
            <div>
              <Textarea
                id="content"
                {...form.register("content")}
                placeholder="Escreva o conteúdo da notícia aqui..."
                rows={15}
                className="font-mono text-sm"
              />
              {form.formState.errors.content && (
                <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={saveNewsMutation.isPending || isUploading}
          onClick={(e) => {
            console.log("Submit button clicked");
            console.log("Form is valid:", form.formState.isValid);
            console.log("Form errors:", form.formState.errors);
          }}
        >
          {saveNewsMutation.isPending || isUploading ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              {isUploading ? "Enviando..." : "Salvando..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {news ? "Atualizar" : "Criar"} Notícia
            </>
          )}
        </Button>
      </div>
    </form>
  );
}