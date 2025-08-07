import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SimpleFileUploaderProps {
  onUploadComplete: (fileUrl: string, fileName: string) => void;
  maxFileSize?: number;
  acceptedTypes?: string;
  className?: string;
}

export function SimpleFileUploader({
  onUploadComplete,
  maxFileSize = 10485760, // 10MB
  acceptedTypes = ".pdf,.doc,.docx,.txt",
  className
}: SimpleFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('Getting upload URL for file:', file.name, 'size:', file.size);
      
      // Get upload URL from backend using apiRequest for proper authentication
      const response = await apiRequest("POST", "/api/documents/upload-url", {});
      const data = await response.json() as { uploadURL: string };
      const { uploadURL } = data;
      console.log('Upload URL received:', uploadURL);

      // Upload file directly to Object Storage
      console.log('Uploading file to:', uploadURL);
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream"
        }
      });
      
      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        throw new Error(`Erro no upload: ${uploadResponse.status}`);
      }

      // Convert presigned URL to final object URL
      const url = new URL(uploadURL);
      const finalObjectUrl = `${url.protocol}//${url.host}${url.pathname}`;
      
      console.log('Upload successful, final URL:', finalObjectUrl);
      
      setUploadedFile(file.name);
      onUploadComplete(finalObjectUrl, file.name);
      
      toast({
        title: "Arquivo carregado",
        description: `${file.name} foi carregado com sucesso.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      <div className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-primary-50 rounded-full">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1 text-center">
            <h4 className="text-sm font-medium">Anexar documento</h4>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX ou TXT (máx. {Math.round(maxFileSize / 1024 / 1024)}MB)
            </p>
          </div>
          
          <div className="relative">
            <input
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id="file-upload"
              ref={(input) => {
                if (input) {
                  (window as any).fileInput = input;
                }
              }}
            />
            <Button 
              disabled={isUploading}
              className="w-full max-w-xs"
              onClick={() => {
                const input = document.getElementById('file-upload') as HTMLInputElement;
                if (input) {
                  input.click();
                }
              }}
              type="button"
            >
              <div className="flex items-center space-x-2">
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Carregando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Selecionar Arquivo</span>
                  </>
                )}
              </div>
            </Button>
          </div>
          
          {uploadedFile && (
            <div className="flex items-center space-x-2 text-sm">
              <FileCheck className="h-4 w-4 text-green-500" />
              <span>{uploadedFile}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}