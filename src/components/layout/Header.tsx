import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { GraduationCap, User, LogOut, Settings, PlusCircle, Search, Menu, X, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { config } = useSiteConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src={config?.logo_url || "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/graduation-cap.svg"} 
            alt="Logo" 
            className="h-8 w-8 text-primary"
          />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Vitrine Científica
            </h1>
            <p className="text-xs text-muted-foreground">UFPE - CAA</p>
          </div>
        </Link>

        {/* Search bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar publicações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </form>

        {/* Desktop Navigation */}
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
            to="/publicacoes"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive('/publicacoes') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Publicações
          </Link>
          <Link
            to="/como-publicar"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive('/como-publicar') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Como Publicar
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

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center space-x-4">
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
                  <DropdownMenuItem asChild>
                    <Link to="/minhas-publicacoes">
                      <FileText className="h-4 w-4 mr-2" />
                      Minhas Publicações
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

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Search bar - Mobile */}
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar publicações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
            </form>

            {/* Navigation Links */}
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary px-2 py-1 ${
                  isActive('/') ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                to="/publicacoes"
                className={`text-sm font-medium transition-colors hover:text-primary px-2 py-1 ${
                  isActive('/publicacoes') ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Publicações
              </Link>
              <Link
                to="/como-publicar"
                className={`text-sm font-medium transition-colors hover:text-primary px-2 py-1 ${
                  isActive('/como-publicar') ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Como Publicar
              </Link>
              <Link
                to="/sobre"
                className={`text-sm font-medium transition-colors hover:text-primary px-2 py-1 ${
                  isActive('/sobre') ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sobre
              </Link>
            </nav>

            {/* User Actions - Mobile */}
            {user ? (
              <div className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/nova-publicacao" onClick={() => setMobileMenuOpen(false)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Publicar
                  </Link>
                </Button>
                {profile?.user_type === 'admin' && (
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                  <Link to="/perfil" onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                  <Link to="/minhas-publicacoes" onClick={() => setMobileMenuOpen(false)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Minhas Publicações
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <Button asChild className="w-full">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};