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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Send, Save, Upload, Plus, X } from 'lucide-react';

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
    keywords: '',
  });
  const [additionalAuthors, setAdditionalAuthors] = useState<string[]>(['']);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
        keywords: data.keywords || '',
      });

      // Fetch additional authors
      const { data: authors } = await supabase
        .from('publication_authors')
        .select('author_name')
        .eq('publication_id', id)
        .order('author_order');

      if (authors && authors.length > 0) {
        setAdditionalAuthors([...authors.map(a => a.author_name), '']);
      }
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

  const handleAuthorChange = (index: number, value: string) => {
    setAdditionalAuthors(prev => {
      const newAuthors = [...prev];
      newAuthors[index] = value;
      return newAuthors;
    });
  };

  const addAuthorField = () => {
    setAdditionalAuthors(prev => [...prev, '']);
  };

  const removeAuthorField = (index: number) => {
    setAdditionalAuthors(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione apenas arquivos PDF.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo PDF deve ter no máximo 10MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (publicationId: string): Promise<string | null> => {
    if (!selectedFile) return null;

    const fileExt = 'pdf';
    const fileName = `${publicationId}.${fileExt}`;
    const filePath = fileName;

    const { error } = await supabase.storage
      .from('publications')
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    return filePath;
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

    if (!formData.title.trim() || !formData.summary.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha título e resumo.',
        variant: 'destructive',
      });
      return;
    }

    if (action === 'publish' && !publication.file_path && !selectedFile) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'Por favor, selecione um arquivo PDF para publicar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const status: 'draft' | 'pending' | 'approved' = action === 'publish' 
        ? (profile.user_type === 'admin' ? 'approved' : 'pending')
        : 'draft';

      let filePath = publication.file_path;

      // Upload new file if provided
      if (selectedFile) {
        try {
          filePath = await uploadFile(publication.id);
        } catch (fileError) {
          console.error('File upload error:', fileError);
          toast({
            title: 'Erro no upload',
            description: 'Erro ao fazer upload do arquivo.',
            variant: 'destructive',
          });
          return;
        }
      }

      const updateData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        keywords: formData.keywords.trim() || null,
        file_path: filePath,
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

      // Update additional authors
      await supabase
        .from('publication_authors')
        .delete()
        .eq('publication_id', publication.id);

      const authorsToAdd = additionalAuthors
        .filter(author => author.trim())
        .map((author, index) => ({
          publication_id: publication.id,
          author_name: author.trim(),
          author_order: index + 2, // Start from 2 as main author is 1
        }));

      if (authorsToAdd.length > 0) {
        const { error: authorsError } = await supabase
          .from('publication_authors')
          .insert(authorsToAdd);

        if (authorsError) {
          console.error('Error adding authors:', authorsError);
        }
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
              <Label htmlFor="keywords">Palavras-chave</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                placeholder="Digite palavras-chave separadas por vírgula (ex: pesquisa, ciência, tecnologia)"
              />
            </div>

            <div className="space-y-2">
              <Label>Autores Adicionais</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Autor principal: {profile?.display_name}
              </p>
              {additionalAuthors.map((author, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={author}
                    onChange={(e) => handleAuthorChange(index, e.target.value)}
                    placeholder={`Nome do ${index + 2}º autor`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAuthorField(index)}
                    disabled={additionalAuthors.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAuthorField}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Autor
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo PDF {!publication?.file_path ? '*' : ''}</Label>
              {publication?.file_path && (
                <p className="text-sm text-muted-foreground mb-2">
                  Arquivo atual: {publication.file_path}
                </p>
              )}
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <input
                  type="file"
                  id="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {selectedFile ? selectedFile.name : 'Clique para selecionar um novo arquivo PDF'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Máximo 10MB
                    </p>
                  </div>
                </label>
              </div>
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