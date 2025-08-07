import { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Type,
  Undo,
  Redo,
  Eye,
  Palette
} from 'lucide-react';

interface FlowbiteEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function FlowbiteEditor({ content, onChange, placeholder = "Digite seu conteúdo aqui..." }: FlowbiteEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentContent, setCurrentContent] = useState(content);

  useEffect(() => {
    if (editorRef.current && !isPreview) {
      editorRef.current.innerHTML = content;
    }
  }, [content, isPreview]);

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setCurrentContent(newContent);
      onChange(newContent);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = window.prompt('Digite a URL do link:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = window.prompt('Digite a URL da imagem:');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  const setTextColor = () => {
    const color = window.prompt('Digite a cor (ex: #ff0000 ou red):');
    if (color) {
      executeCommand('foreColor', color);
    }
  };

  const setBackgroundColor = () => {
    const color = window.prompt('Digite a cor de fundo (ex: #ffff00 ou yellow):');
    if (color) {
      executeCommand('backColor', color);
    }
  };

  const formatBlock = (tag: string) => {
    executeCommand('formatBlock', tag);
  };

  const toolbarButtonClass = "inline-flex items-center justify-center w-10 h-10 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 transition-colors duration-200";
  const activeButtonClass = "inline-flex items-center justify-center w-10 h-10 text-white bg-gray-600 rounded cursor-pointer dark:text-gray-900 dark:bg-gray-300";

  return (
    <div className="w-full border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-600">
        <div className="flex flex-wrap items-center divide-gray-200 sm:divide-x sm:rtl:divide-x-reverse dark:divide-gray-600">
          {/* Text Formatting Group */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse sm:pe-4">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('bold')}
              title="Negrito (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('italic')}
              title="Itálico (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('underline')}
              title="Sublinhado (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('strikeThrough')}
              title="Riscado"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Heading Group */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse sm:ps-4 sm:pe-4">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => formatBlock('H1')}
              title="Título 1"
            >
              <Type className="w-4 h-4" />
              <span className="sr-only">H1</span>
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => formatBlock('H2')}
              title="Título 2"
            >
              <Type className="w-3 h-3" />
              <span className="sr-only">H2</span>
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => formatBlock('H3')}
              title="Título 3"
            >
              <Type className="w-3 h-3" />
              <span className="sr-only">H3</span>
            </button>
          </div>

          {/* List Group */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse sm:ps-4 sm:pe-4">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('insertUnorderedList')}
              title="Lista com marcadores"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('insertOrderedList')}
              title="Lista numerada"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('formatBlock', 'BLOCKQUOTE')}
              title="Citação"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment Group */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse sm:ps-4 sm:pe-4">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('justifyLeft')}
              title="Alinhar à esquerda"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('justifyCenter')}
              title="Centralizar"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('justifyRight')}
              title="Alinhar à direita"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('justifyFull')}
              title="Justificar"
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>

          {/* Media Group */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse sm:ps-4 sm:pe-4">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={insertLink}
              title="Inserir link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={insertImage}
              title="Inserir imagem"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={setTextColor}
              title="Cor do texto"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>

          {/* Undo/Redo Group */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse sm:ps-4 sm:pe-4">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('undo')}
              title="Desfazer (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={() => executeCommand('redo')}
              title="Refazer (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Toggle */}
        <div className="flex items-center space-x-1 rtl:space-x-reverse">
          <button
            type="button"
            className={isPreview ? activeButtonClass : toolbarButtonClass}
            onClick={() => setIsPreview(!isPreview)}
            title="Alternar pré-visualização"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="px-4 py-2 bg-white rounded-b-lg dark:bg-gray-800">
        {isPreview ? (
          <div 
            className="min-h-[400px] prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto max-w-none"
            dangerouslySetInnerHTML={{ __html: currentContent || placeholder }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning={true}
            className="min-h-[400px] block w-full px-0 text-sm text-gray-800 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400 prose prose-sm max-w-none"
            data-placeholder={placeholder}
            onInput={handleInput}
            onPaste={handleInput}
            onKeyUp={handleInput}
            style={{
              outline: 'none'
            }}
          />
        )}
      </div>

      {/* Character Count */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Lembre-se, contribuições para este tópico devem seguir nossos{' '}
          <a href="#" className="text-blue-600 dark:text-blue-500 hover:underline">
            Termos de Comunidade
          </a>
          .
        </p>
      </div>
    </div>
  );
}