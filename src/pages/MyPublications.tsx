import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Publication } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Eye, Edit, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PublicationReviewFeedback: React.FC<{ publicationId: string; status: string }> = ({ publicationId, status }) => {
  const [justification, setJustification] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewJustification();
  }, [publicationId]);

  const fetchReviewJustification = async () => {
    try {
      const { data, error } = await supabase
        .from('publication_reviews')
        .select('justification')
        .eq('publication_id', publicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching review:', error);
        return;
      }

      setJustification(data?.justification || '');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
      <p className="text-sm font-medium mb-1">
        {status === 'returned' ? 'Devolvida para ajustes:' : 
         status === 'retained' ? 'Retida:' : 'Rejeitada:'}
      </p>
      <p className="text-sm text-muted-foreground">
        {justification || 'Nenhuma justificativa foi fornecida.'}
      </p>
    </div>
  );
};

export const MyPublications: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (profile) {
      fetchMyPublications();
    }
  }, [profile]);

  const fetchMyPublications = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          profiles (*)
        `)
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovada
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'returned':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <RefreshCw className="h-3 w-3 mr-1" />
            Devolvida
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitada
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline">
            <Edit className="h-3 w-3 mr-1" />
            Rascunho
          </Badge>
        );
      case 'retained':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Retida
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!user) {
    return null; // Will redirect to auth
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
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Minhas Publicações</h1>
          </div>
          <Button asChild>
            <Link to="/nova-publicacao">
              <FileText className="h-4 w-4 mr-2" />
              Nova Publicação
            </Link>
          </Button>
        </div>

        {publications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-4">
                Você ainda não tem publicações.
              </p>
              <Button asChild>
                <Link to="/nova-publicacao">
                  Criar minha primeira publicação
                </Link>
              </Button>
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
                        {getStatusBadge(publication.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Criada {formatDistanceToNow(new Date(publication.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                        {publication.published_at && (
                          <> • Publicada {formatDistanceToNow(new Date(publication.published_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/publicacao/${publication.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Link>
                      </Button>
                      {(publication.status === 'draft' || publication.status === 'returned') && (
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/editar-publicacao/${publication.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {publication.summary}
                  </p>
                  
                  {(publication.status === 'returned' || publication.status === 'rejected' || publication.status === 'retained') && (
                    <PublicationReviewFeedback publicationId={publication.id} status={publication.status} />
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