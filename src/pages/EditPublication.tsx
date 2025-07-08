import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Publication } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Send, Save } from 'lucide-react';

export const EditPublication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publication, setPublication] = useState<Publication | null>(null);
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

  useEffect(() => {
    if (id && profile) {
      fetchPublication();
    }
  }, [id, profile]);

  const fetchPublication = async () => {
    if (!id || !profile) return;

    try {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('id', id)
        .eq('author_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching publication:', error);
        toast({
          title: 'Erro',
          description: 'Publicação não encontrada ou você não tem permissão para editá-la.',
          variant: 'destructive',
        });
        navigate('/minhas-publicacoes');
        return;
      }

      // Only allow editing if status is draft or returned
      if (data.status !== 'draft' && data.status !== 'returned') {
        toast({
          title: 'Edição não permitida',
          description: 'Você só pode editar publicações em rascunho ou devolvidas.',
          variant: 'destructive',
        });
        navigate('/minhas-publicacoes');
        return;
      }

      setPublication(data);
      setFormData({
        title: data.title,
        summary: data.summary,
        content: data.content,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar publicação.',
        variant: 'destructive',
      });
      navigate('/minhas-publicacoes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (action: 'draft' | 'publish') => {
    if (!profile || !publication) {
      toast({
        title: 'Erro',
        description: 'Erro interno. Tente recarregar a página.',
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

      const updateData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content,
        status,
        published_at: status === 'approved' ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('publications')
        .update(updateData)
        .eq('id', publication.id);

      if (error) {
        console.error('Error updating publication:', error);
        toast({
          title: 'Erro ao atualizar publicação',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (action === 'publish') {
        if (profile.user_type === 'admin') {
          toast({
            title: 'Publicação atualizada!',
            description: 'Sua publicação foi atualizada e publicada imediatamente.',
          });
        } else {
          toast({
            title: 'Publicação enviada!',
            description: 'Sua publicação foi reenviada para revisão e aprovação.',
          });
        }
      } else {
        toast({
          title: 'Rascunho salvo!',
          description: 'Sua publicação foi atualizada e salva como rascunho.',
        });
      }

      navigate('/minhas-publicacoes');
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-96 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Editar Publicação</CardTitle>
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
                  {profile?.user_type === 'admin' ? 'Publicar' : 'Reenviar para Aprovação'}
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