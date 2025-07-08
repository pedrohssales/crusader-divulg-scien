import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Eye, ArrowRight } from 'lucide-react';
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
        .eq('status', 'pending')
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
              <Card key={publication.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
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
                          <strong>Enviada:</strong> {formatDistanceToNow(new Date(publication.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <Badge variant="secondary">
                          Pendente
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
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
                      <Button asChild>
                        <Link to={`/admin/revisar/${publication.id}`}>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Revisar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {publication.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};