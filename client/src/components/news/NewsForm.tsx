import { useState, useEffect, Suspense, lazy } from "react";
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
  X
} from "lucide-react";

// Rich text editor component with Flowbite styling
const RichTextEditor = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const [editorValue, setEditorValue] = useState(value || '');

  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };

  const toolbarButtonClass = "p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600";

  return (
    <div className="w-full border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
      <div className="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
        <div className="flex flex-wrap items-center divide-gray-200 sm:divide-x dark:divide-gray-600">
          <div className="flex items-center space-x-1 sm:pr-4">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => document.execCommand('bold')}
              title="Negrito"
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6V4Zm0 8h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6v-8Z"/>
              </svg>
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => document.execCommand('italic')}
              title="Itálico"
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8.874 19 6.143-14M6 19h6m-7-14h6"/>
              </svg>
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => document.execCommand('underline')}
              title="Sublinhado"
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M6 19h12M8 5v9a4 4 0 0 0 8 0V5M6 5h4m4 0h4"/>
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap items-center space-x-1 sm:pl-4">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => document.execCommand('formatBlock', false, 'h1')}
              title="Título 1"
            >
              <span className="text-sm font-bold">H1</span>
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => document.execCommand('formatBlock', false, 'h2')}
              title="Título 2"
            >
              <span className="text-sm font-bold">H2</span>
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => document.execCommand('formatBlock', false, 'h3')}
              title="Título 3"
            >
              <span className="text-sm font-bold">H3</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center space-x-1 sm:pl-4">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => document.execCommand('insertUnorderedList')}
              title="Lista com marcadores"
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M9 8h10M9 12h10M9 16h10M4.99 8H5m-.02 4h.01m0 4H5"/>
              </svg>
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => document.execCommand('insertOrderedList')}
              title="Lista numerada"
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6h8m-8 6h8m-8 6h8M4 16a2 2 0 1 1 3.321 1.5L4 20h5M4 5l2-1v6m-2 0h4"/>
              </svg>
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => {
                const url = prompt('Digite a URL do link:');
                if (url) document.execCommand('createLink', false, url);
              }}
              title="Inserir link"
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="px-4 py-2 bg-white rounded-b-lg dark:bg-gray-800">
        <div
          contentEditable
          suppressContentEditableWarning={true}
          className="min-h-[300px] block w-full px-0 text-sm text-gray-800 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white"
          data-placeholder="Escreva o conteúdo da notícia aqui..."
          dangerouslySetInnerHTML={{ __html: editorValue }}
          onInput={(e) => {
            const content = e.currentTarget.innerHTML;
            handleChange(content);
          }}
          onBlur={(e) => {
            const content = e.currentTarget.innerHTML;
            handleChange(content);
          }}
        />
      </div>
    </div>
  );
};

const newsFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255, "Título muito longo"),
  slug: z.string().min(1, "URL amigável é obrigatória").max(255, "URL muito longa"),
  excerpt: z.string().min(1, "Resumo é obrigatório").max(500, "Resumo muito longo"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  categoryId: z.number().optional().nullable(),
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
  const [content, setContent] = useState("");
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
      setContent(news.content);
      if (news.imageUrl) {
        setCoverImagePreview(news.imageUrl);
      }
    }
  }, [news, form]);

  // Handle content changes from editor
  const handleContentChange = (value: string) => {
    setContent(value);
    form.setValue("content", value);
  };

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
        let imageUrl = news?.imageUrl; // Keep existing image URL by default
        
        // Upload new image if selected
        if (coverImage) {
          console.log("Uploading new cover image...");
          
          // Step 1: Get upload URL
          const uploadResponse = await fetch('/api/news/upload-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to get upload URL');
          }

          const { uploadURL } = await uploadResponse.json() as { uploadURL: string };
          console.log("Got upload URL:", uploadURL);

          // Step 2: Upload file directly to Object Storage
          const uploadFileResponse = await fetch(uploadURL, {
            method: 'PUT',
            body: coverImage,
            headers: {
              'Content-Type': coverImage.type,
            },
          });

          if (!uploadFileResponse.ok) {
            throw new Error('Failed to upload image');
          }

          // Step 3: Convert uploaded URL to object path
          imageUrl = uploadURL.split('?')[0]; // Remove query parameters
          console.log("Image uploaded successfully, URL:", imageUrl);
        }

        // Prepare form data with image URL
        const payload = {
          ...data,
          imageUrl: imageUrl,
        };

        const url = news ? `/api/news/${news.id}` : "/api/news";
        const method = news ? "PUT" : "POST";
        
        console.log("Making request to:", url, "with method:", method);
        console.log("Payload:", payload);
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

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
            {/* Rich Text Editor */}
            <div className="min-h-[300px]">
              <RichTextEditor
                value={content}
                onChange={handleContentChange}
              />
            </div>
            {form.formState.errors.content && (
              <p className="text-sm text-red-500 mt-2">{form.formState.errors.content.message}</p>
            )}
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