'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LocalDataService, type LocalCase } from '@/lib/LocalDataService';
import { HistoryCard } from '@/components/HistoryCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, History as HistoryIcon, Search, PlusCircle, BrainCircuit, Presentation } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<LocalCase[]>([]);
  const [filter, setFilter] = useState<'all' | 'diagnosis' | 'content-generator'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadCases = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const casesData = await LocalDataService.getUserCases(user.id);
      setCases(casesData);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredCases = cases.filter((c) => {
    const matchesFilter = filter === 'all' || c.type === filter;
    const matchesSearch =
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.inputData?.patientData?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.inputData?.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.inputData?.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="container mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-primary" />
                Case History & Slide Archives
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Access your past diagnostic evaluations, follow-up threads, and slide decks.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="text-xs gap-1">
                <Link href="/ai-diagnosis">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  New Diagnosis
                </Link>
              </Button>
              <Button asChild size="sm" className="text-xs gap-1">
                <Link href="/content-generator">
                  <Presentation className="h-3.5 w-3.5" />
                  New Presentation
                </Link>
              </Button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cases, symptoms, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs sm:text-sm"
              />
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid grid-cols-3 h-9">
                <TabsTrigger value="all" className="text-xs">
                  All ({cases.length})
                </TabsTrigger>
                <TabsTrigger value="diagnosis" className="text-xs">
                  Diagnosis ({cases.filter((c) => c.type === 'diagnosis').length})
                </TabsTrigger>
                <TabsTrigger value="content-generator" className="text-xs">
                  Presentations ({cases.filter((c) => c.type === 'content-generator').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs">Loading case records...</span>
            </div>
          ) : filteredCases.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {filteredCases.map((caseItem) => (
                <HistoryCard key={caseItem.id} caseItem={caseItem} onDelete={loadCases} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-muted-foreground">
                {searchQuery.trim()
                  ? 'No cases match your search query.'
                  : 'No saved cases found in this category.'}
              </p>
              <div className="flex justify-center gap-2">
                <Button asChild size="sm" variant="outline" className="text-xs">
                  <Link href="/ai-diagnosis">Start First Diagnosis</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
