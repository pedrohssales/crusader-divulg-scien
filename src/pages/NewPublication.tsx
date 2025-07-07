import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { toast } from '@/hooks/use-toast';
import { Send, Save } from 'lucide-react';

export const NewPublication: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (action: 'draft' | 'publish') => {
    if (!profile) {
      toast({
        title: 'Erro',
        description: 'Perfil não encontrado. Tente fazer login novamente.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim() || !formData.summary.trim() || !formData.content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const status: 'draft' | 'pending' | 'approved' = action === 'publish' 
        ? (profile.user_type === 'admin' ? 'approved' : 'pending')
        : 'draft';

      const publicationData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content,
        author_id: profile.id,
        status,
        published_at: status === 'approved' ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('publications')
        .insert([publicationData])
        .select()
        .single();

      if (error) {
        console.error('Error creating publication:', error);
        toast({
          title: 'Erro ao criar publicação',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (action === 'publish') {
        if (profile.user_type === 'admin') {
          toast({
            title: 'Publicação criada!',
            description: 'Sua publicação foi publicada imediatamente.',
          });
        } else {
          toast({
            title: 'Publicação enviada!',
            description: 'Sua publicação foi enviada para revisão e aprovação.',
          });
        }
      } else {
        toast({
          title: 'Rascunho salvo!',
          description: 'Sua publicação foi salva como rascunho.',
        });
      }

      navigate(`/publicacao/${data.id}`);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Nova Publicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Digite o título da sua publicação"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Resumo *</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Escreva um breve resumo que será exibido na lista de publicações"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo *</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => handleInputChange('content', content)}
                placeholder="Escreva o conteúdo completo da sua publicação..."
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                * Campos obrigatórios
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit('draft')}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Rascunho
                </Button>
                <Button
                  onClick={() => handleSubmit('publish')}
                  disabled={isLoading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {profile?.user_type === 'admin' ? 'Publicar' : 'Enviar para Aprovação'}
                </Button>
              </div>
            </div>

            {profile?.user_type !== 'admin' && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> Suas publicações passarão por um processo de revisão 
                  antes de serem aprovadas e exibidas publicamente na plataforma.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};