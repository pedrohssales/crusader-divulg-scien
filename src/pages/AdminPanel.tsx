import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Check, X, RotateCcw, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const AdminPanel: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);

  // Redirect if not admin
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (profile && profile.user_type !== 'admin') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      fetchPendingPublications();
    }
  }, [profile]);

  const fetchPendingPublications = async () => {
    try {
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          profiles (*)
        `)
        .in('status', ['pending', 'returned'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching publications:', error);
        return;
      }

      setPublications(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (publicationId: string, decision: 'approved' | 'rejected' | 'returned') => {
    if (!justification.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Por favor, forneça uma justificativa para sua decisão.',
        variant: 'destructive',
      });
      return;
    }

    if (!profile) return;

    setProcessingId(publicationId);

    try {
      // Update publication status
      const { error: updateError } = await supabase
        .from('publications')
        .update({
          status: decision,
          published_at: decision === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', publicationId);

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
          publication_id: publicationId,
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

      // Remove from list
      setPublications(prev => prev.filter(p => p.id !== publicationId));
      setJustification('');
      setSelectedPublication(null);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
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
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <Badge variant="secondary">
            {publications.length} publicações pendentes
          </Badge>
        </div>

        {publications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                Nenhuma publicação pendente de revisão.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {publications.map((publication) => (
              <Card key={publication.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        {publication.title}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{publication.profiles?.display_name}</span>
                        <span>
                          {formatDistanceToNow(new Date(publication.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <Badge variant={publication.status === 'pending' ? 'secondary' : 'outline'}>
                          {publication.status === 'pending' ? 'Pendente' : 'Devolvido'}
                        </Badge>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPublication(publication)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{publication.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm font-medium mb-2">Resumo:</p>
                            <p className="text-muted-foreground">{publication.summary}</p>
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: publication.content }} />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-muted-foreground line-clamp-3">
                      {publication.summary}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor={`justification-${publication.id}`}>
                      Justificativa (obrigatório)
                    </Label>
                    <Textarea
                      id={`justification-${publication.id}`}
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Forneça uma justificativa para sua decisão..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleDecision(publication.id, 'approved')}
                      disabled={processingId === publication.id || !justification.trim()}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleDecision(publication.id, 'returned')}
                      disabled={processingId === publication.id || !justification.trim()}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Devolver
                    </Button>
                    <Button
                      onClick={() => handleDecision(publication.id, 'rejected')}
                      disabled={processingId === publication.id || !justification.trim()}
                      variant="destructive"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};