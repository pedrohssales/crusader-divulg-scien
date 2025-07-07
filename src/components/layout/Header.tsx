import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, User, LogOut, Settings, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Divulgação Científica</h1>
            <p className="text-xs text-muted-foreground">UFPE - Campus Caruaru</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive('/') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Início
          </Link>
          <Link
            to="/leituras"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive('/leituras') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Leituras
          </Link>
          <Link
            to="/sobre"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive('/sobre') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Sobre
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {profile?.user_type === 'admin' && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to="/nova-publicacao">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Publicar
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {profile?.display_name || 'Usuário'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/perfil">
                      <User className="h-4 w-4 mr-2" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};