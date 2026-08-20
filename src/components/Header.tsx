'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BrainCircuit,
  LogOut,
  User as UserIcon,
  History,
  Loader2,
  Wand2,
  Sun,
  Moon,
  Settings,
  BookOpen,
  Stethoscope,
  Sparkles,
  Globe,
  PenLine,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { Badge } from './ui/badge';

export default function Header() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { language, audienceMode, activeModel, aiProvider } = useSettings();

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  const navItems = [
    { href: '/ai-diagnosis', label: 'AI Diagnosis', sub: 'Clinical Vignettes', icon: BrainCircuit },
    { href: '/content-generator', label: 'Slide Studio', sub: 'Teaching Decks', icon: Wand2 },
    { href: '/history', label: 'Case Archives', sub: 'Saved Notes', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-colors">
      {/* Top subtle decorative ruler bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-amber-400/40 to-emerald-500/30" />

      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand with Journal Callout */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-105 transition-transform shadow-2xs">
            <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                MediGen
              </span>
              <span className="stamp-badge text-[9px] px-1.5 py-0 border-primary/40 text-primary bg-primary/5 hidden sm:inline-block">
                Journal
              </span>
            </div>
            <span className="text-[11px] font-handwriting text-muted-foreground text-xs sm:text-sm -mt-0.5 leading-none">
              clinical notes &amp; slide decks
            </span>
          </div>
        </Link>

        {/* Desktop Navigation - Notebook Tab Dividers */}
        <nav className="hidden md:flex items-center space-x-1.5 p-1 rounded-xl bg-muted/50 border border-border/60">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-card text-foreground shadow-xs border border-border font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation - Icons */}
        <nav className="md:hidden flex items-center space-x-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center p-2 rounded-lg text-xs transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:text-primary'
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Quick Active Mode & Model Stamp */}
          <Link
            href="/settings"
            title="Configure AI Model, Audience Mode, and Language in Settings"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-card/80 hover:bg-card text-[11px] font-medium transition-all shadow-2xs group"
          >
            <span className="flex items-center gap-1 text-primary font-mono text-[10px] font-bold group-hover:underline">
              <Cpu className="h-3 w-3 text-primary" />
              {activeModel}
            </span>
            <span className="text-muted-foreground font-mono">•</span>
            {audienceMode === 'doctor' ? (
              <span className="flex items-center gap-1 text-primary font-semibold">
                <PenLine className="h-3 w-3" /> Doctor
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <Sparkles className="h-3 w-3" /> Simplified
              </span>
            )}
            <span className="text-muted-foreground font-mono">•</span>
            <span className="text-muted-foreground flex items-center gap-0.5 font-mono text-[10px]">
              <Globe className="h-2.5 w-2.5" />
              {language === 'english' ? 'ENG' : 'HING'}
            </span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Sun className="h-4 w-4 text-amber-600" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </Button>

          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full ring-1 ring-border p-0"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-popover text-popover-foreground border-border shadow-md"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-bold text-foreground">
                      Clinical Account
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center cursor-pointer text-xs">
                    <Settings className="mr-2 h-3.5 w-3.5" />
                    <span>Journal &amp; AI Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="h-8 text-xs font-semibold shadow-2xs">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

