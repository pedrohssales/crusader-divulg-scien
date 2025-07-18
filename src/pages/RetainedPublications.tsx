import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Publication, PublicationReview } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Eye, RotateCcw, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface RetainedPublicationData extends Omit<Publication, 'profiles'> {
  profiles?: {
    display_name: string;
    full_name: string;
  };
  retention_review?: {
    justification: string;
    created_at: string;
    reviewer_profile?: {
      display_name: string;
      full_name: string;
    };
  };
}

export const RetainedPublications: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [publications, setPublications] = useState<RetainedPublicationData[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated or not admin
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (profile && profile.user_type !== 'admin') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      fetchRetainedPublications();
    }
  }, [profile]);

  const fetchRetainedPublications = async () => {
    try {
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          profiles!publications_author_id_fkey (display_name, full_name)
        `)
        .eq('status', 'retained')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching retained publications:', error);
        return;
      }

      // Fetch retention reviews for each publication
      const publicationsWithReviews = await Promise.all(
        (data || []).map(async (pub) => {
          const { data: reviewData } = await supabase
            .from('publication_reviews')
            .select(`
              justification,
              created_at,
              reviewer_id,
              profiles!publication_reviews_reviewer_id_fkey (display_name, full_name)
            `)
            .eq('publication_id', pub.id)
            .eq('decision', 'retained')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...pub,
            retention_review: reviewData ? {
              justification: reviewData.justification,
              created_at: reviewData.created_at,
              reviewer_profile: reviewData.profiles
            } : undefined
          };
        })
      );

      setPublications(publicationsWithReviews);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepublish = async (publicationId: string) => {
    try {
      const { error } = await supabase
        .from('publications')
        .update({ 
          status: 'approved',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', publicationId);

      if (error) {
        console.error('Error republishing:', error);
        toast.error('Erro ao republicar publicação');
        return;
      }

      toast.success('Publicação republicada com sucesso');
      fetchRetainedPublications(); // Refresh list
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao republicar publicação');
    }
  };

  if (!user || !profile) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          <h1 className="text-3xl font-bold">Publicações Retidas</h1>
        </div>

        {publications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                Não há publicações retidas no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {publications.map((publication) => (
              <Card key={publication.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-xl">
                          {publication.title}
                        </CardTitle>
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Retida
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <User className="h-3 w-3 inline mr-1" />
                          Autor: {publication.profiles?.display_name || publication.profiles?.full_name}
                        </p>
                        <p>
                          Retida {formatDistanceToNow(new Date(publication.updated_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                          {publication.retention_review?.reviewer_profile && (
                            <> por {publication.retention_review.reviewer_profile.display_name || publication.retention_review.reviewer_profile.full_name}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{publication.title}</DialogTitle>
                            <DialogDescription>
                              Detalhes da publicação retida
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Resumo:</Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {publication.summary}
                              </p>
                            </div>
                            {publication.retention_review && (
                              <div>
                                <Label className="text-sm font-medium">Motivo da Retenção:</Label>
                                <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm">
                                    {publication.retention_review.justification}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Retida em {new Date(publication.retention_review.created_at).toLocaleDateString('pt-BR')}
                                    {publication.retention_review.reviewer_profile && (
                                      <> por {publication.retention_review.reviewer_profile.display_name || publication.retention_review.reviewer_profile.full_name}</>
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        onClick={() => handleRepublish(publication.id)}
                        size="sm"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Republicar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {publication.summary}
                  </p>
                  
                  {publication.retention_review && (
                    <div className="mt-4 p-3 bg-orange-50 border-l-4 border-orange-200 rounded">
                      <p className="text-sm font-medium text-orange-800 mb-1">
                        Motivo da Retenção:
                      </p>
                      <p className="text-sm text-orange-700">
                        {publication.retention_review.justification}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};