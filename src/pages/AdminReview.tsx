import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Publication } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { 
  Check, 
  X, 
  RotateCcw, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const AdminReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [justification, setJustification] = useState('');

  // Redirect if not admin
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (profile && profile.user_type !== 'admin') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (id && profile?.user_type === 'admin') {
      fetchPublication();
    }
  }, [id, profile]);

  const fetchPublication = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          profiles (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching publication:', error);
        toast({
          title: 'Erro',
          description: 'Publicação não encontrada.',
          variant: 'destructive',
        });
        navigate('/admin');
        return;
      }

      if (data.status !== 'pending' && data.status !== 'returned') {
        toast({
          title: 'Publicação já foi revisada',
          description: 'Esta publicação já foi processada.',
          variant: 'destructive',
        });
        navigate('/admin');
        return;
      }

      setPublication(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar publicação.',
        variant: 'destructive',
      });
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision: 'approved' | 'rejected' | 'returned') => {
    if (!justification.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Por favor, forneça uma justificativa para sua decisão.',
        variant: 'destructive',
      });
      return;
    }

    if (!profile || !publication) return;

    setProcessing(true);

    try {
      // Update publication status
      const { error: updateError } = await supabase
        .from('publications')
        .update({
          status: decision,
          published_at: decision === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', publication.id);

      if (updateError) {
        console.error('Error updating publication:', updateError);
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar publicação.',
          variant: 'destructive',
        });
        return;
      }

      // Create review record
      const { error: reviewError } = await supabase
        .from('publication_reviews')
        .insert([{
          publication_id: publication.id,
          reviewer_id: profile.id,
          decision,
          justification: justification.trim(),
        }]);

      if (reviewError) {
        console.error('Error creating review:', reviewError);
      }

      toast({
        title: 'Decisão registrada',
        description: `Publicação ${decision === 'approved' ? 'aprovada' : decision === 'rejected' ? 'rejeitada' : 'devolvida'} com sucesso.`,
      });

      navigate('/admin');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!user || (profile && profile.user_type !== 'admin')) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!publication) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Painel
          </Button>
          <h1 className="text-3xl font-bold">Revisar Publicação</h1>
        </div>

        <div className="space-y-6">
          {/* Publication Content */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    {publication.title}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>
                      <strong>Autor:</strong> {publication.profiles?.display_name}
                    </span>
                    <span>
                      <strong>Instituição:</strong> {publication.profiles?.institution}
                    </span>
                    <span>
                      <strong>Criada:</strong> {formatDistanceToNow(new Date(publication.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    <Badge variant={publication.status === 'pending' ? 'secondary' : 'outline'}>
                      {publication.status === 'pending' ? 'Pendente' : 'Devolvida'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Resumo:</p>
                <p className="text-muted-foreground">{publication.summary}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-4">Conteúdo:</p>
                <div className="prose prose-sm max-w-none bg-background border rounded-lg p-6">
                  <div dangerouslySetInnerHTML={{ __html: publication.content }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Tomar Decisão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="justification">
                  Justificativa (obrigatório)
                </Label>
                <Textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Forneça uma justificativa clara para sua decisão. Esta mensagem será vista pelo autor."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Esta justificativa será registrada e pode ser vista pelo autor.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={processing || !justification.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <Check className="h-5 w-5 mr-2 text-green-600" />
                        Confirmar Aprovação
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja <strong>aprovar</strong> esta publicação? 
                        Ela será publicada imediatamente e ficará visível para todos os usuários.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDecision('approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Sim, Aprovar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={processing || !justification.trim()}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Devolver
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <RotateCcw className="h-5 w-5 mr-2 text-yellow-600" />
                        Confirmar Devolução
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja <strong>devolver</strong> esta publicação? 
                        O autor poderá editá-la e reenviar para nova análise.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDecision('returned')}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Sim, Devolver
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={processing || !justification.trim()}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                        Confirmar Rejeição
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja <strong>rejeitar</strong> esta publicação? 
                        Esta ação é definitiva e o autor não poderá reenviar o mesmo conteúdo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDecision('rejected')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Sim, Rejeitar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};