import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Escreva sua publicação aqui...',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const addImage = () => {
    const url = window.prompt('URL da imagem:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('URL do link:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="border-b p-2 space-y-2">
        {/* Primeira linha - Formatação de texto */}
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-muted' : ''}
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-8" />
          
          <Select
            value={editor.getAttributes('textStyle').fontFamily || 'inherit'}
            onValueChange={(value) => {
              if (value === 'inherit') {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(value).run();
              }
            }}
          >
            <SelectTrigger className="w-[140px] h-8">
              <Type className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Padrão</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="'Times New Roman'">Times New Roman</SelectItem>
              <SelectItem value="'Courier New'">Courier New</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Segunda linha - Alinhamento */}
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={editor.isActive({ textAlign: 'justify' }) ? 'bg-muted' : ''}
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-8" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-muted' : ''}
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-8" />
          
          <Button variant="ghost" size="sm" onClick={addLink}>
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addImage}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-8" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <EditorContent editor={editor} className="min-h-[400px]" />
    </div>
  );
};