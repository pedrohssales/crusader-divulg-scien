import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { User, Save } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    institution: profile?.institution || '',
    display_name: profile?.display_name || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast({
        title: 'Erro',
        description: 'Perfil não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.full_name.trim() || !formData.display_name.trim() || !formData.institution.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          institution: formData.institution.trim(),
          display_name: formData.display_name.trim(),
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Erro ao atualizar perfil',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });

      // Refresh profile data
      await refreshProfile();
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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6" />
              <CardTitle className="text-2xl">Meu Perfil</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  O e-mail não pode ser alterado.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Instituição de Ensino *</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  placeholder="Ex: UFPE - Campus Caruaru"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Nome de Exibição *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Nome que aparecerá nas suas publicações"
                />
                <p className="text-sm text-muted-foreground">
                  Este nome será exibido como autor das suas publicações.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  * Campos obrigatórios
                </div>
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};