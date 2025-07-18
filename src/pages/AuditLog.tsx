import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Publication } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Search, User, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditEntry {
  id: string;
  publication_id: string;
  decision: string;
  justification: string;
  created_at: string;
  reviewer_profile: {
    display_name: string;
    full_name: string;
  };
  publication: {
    title: string;
    author_profile: {
      display_name: string;
      full_name: string;
    };
  };
}

export const AuditLog: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecision, setFilterDecision] = useState<string>('all');

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
      fetchAuditLog();
    }
  }, [profile]);

  const fetchAuditLog = async () => {
    try {
      const { data, error } = await supabase
        .from('publication_reviews')
        .select(`
          id,
          publication_id,
          decision,
          justification,
          created_at,
          profiles!publication_reviews_reviewer_id_fkey (display_name, full_name),
          publications!publication_reviews_publication_id_fkey (
            title,
            profiles!publications_author_id_fkey (display_name, full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit log:', error);
        return;
      }

      // Transform data to match our interface
      const transformedData = (data || []).map(entry => ({
        id: entry.id,
        publication_id: entry.publication_id,
        decision: entry.decision,
        justification: entry.justification,
        created_at: entry.created_at,
        reviewer_profile: entry.profiles,
        publication: {
          title: entry.publications?.title || '',
          author_profile: entry.publications?.profiles || { display_name: '', full_name: '' }
        }
      }));

      setAuditEntries(transformedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'returned': return 'outline';
      case 'retained': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDecisionText = (decision: string) => {
    switch (decision) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'returned': return 'Devolvido';
      case 'retained': return 'Retido';
      default: return decision;
    }
  };

  // Filter entries based on search and decision filter
  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.publication.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reviewer_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.publication.author_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDecision = filterDecision === 'all' || entry.decision === filterDecision;
    
    return matchesSearch && matchesDecision;
  });

  if (!user || !profile) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
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
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Log de Auditoria</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, reviewer ou autor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Decisão</label>
                <Select value={filterDecision} onValueChange={setFilterDecision}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as decisões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as decisões</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                    <SelectItem value="returned">Devolvido</SelectItem>
                    <SelectItem value="retained">Retido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Entries */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  {searchTerm || filterDecision !== 'all' ? 
                    'Nenhum registro encontrado com os filtros aplicados.' :
                    'Nenhum registro de auditoria disponível.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <Badge variant={getDecisionColor(entry.decision)}>
                          {getDecisionText(entry.decision)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDistanceToNow(new Date(entry.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-medium line-clamp-1">
                          {entry.publication.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>
                            <User className="h-3 w-3 inline mr-1" />
                            Autor: {entry.publication.author_profile?.display_name || entry.publication.author_profile?.full_name}
                          </span>
                          <span>
                            Revisor: {entry.reviewer_profile?.display_name || entry.reviewer_profile?.full_name}
                          </span>
                        </div>
                      </div>
                      
                      {entry.justification && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Justificativa:</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.justification}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {filteredEntries.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Mostrando {filteredEntries.length} de {auditEntries.length} registros
          </div>
        )}
      </div>
    </div>
  );
};