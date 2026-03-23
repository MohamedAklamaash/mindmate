'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/lib/store/userStore';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { apiClient } from '@/lib/api/client';
import { QuoteCard } from '@/components/insights/QuoteCard';
import type { EmotionReplyResponse, MoodEntry } from '@/lib/types/api';
import Link from 'next/link';

export default function InsightsPage() {
  const router = useRouter();
  const { userId, emotion, sentiment } = useUserStore();
  const { ready } = useAuthGuard();
  const [quote, setQuote] = useState<EmotionReplyResponse | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null);
  const [sentimentTrend, setSentimentTrend] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (!ready) return;
    fetchAnalytics();
    if (emotion) fetchQuote(emotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, emotion]);

  if (!ready) return null;

  const fetchAnalytics = async () => {
    if (!userId) return;
    setLoadingAnalytics(true);
    try {
      const res = await apiClient.getMoodAnalytics(userId);
      if (res.data?.analytics) {
        setMoodHistory(res.data.analytics.mood_history);
        setDominantEmotion(res.data.analytics.dominant_emotion);
        setSentimentTrend(res.data.analytics.sentiment_trend);
      }
    } catch (_) {}
    finally { setLoadingAnalytics(false); }
  };

  const fetchQuote = async (e: string) => {
    setLoadingQuote(true);
    try {
      const res = await apiClient.getQuoteThought(e);
      if (res.data) setQuote(res.data);
    } catch (_) {}
    finally { setLoadingQuote(false); }
  };

  if (!isAuthenticated) return null;

  const sentimentCounts = moodHistory.reduce<Record<string, number>>((acc, e) => {
    acc[e.sentiment] = (acc[e.sentiment] || 0) + 1;
    return acc;
  }, {});
  const total = moodHistory.length || 1;

  const bars = [
    { label: 'Positive', key: 'positive', color: 'bg-green-500' },
    { label: 'Neutral', key: 'neutral', color: 'bg-yellow-500' },
    { label: 'Negative', key: 'negative', color: 'bg-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <header className="glass border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <div>
              <h1 className="text-xl font-bold">Emotional Insights</h1>
              <p className="text-xs text-muted-foreground">Track your emotional journey</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchAnalytics} disabled={loadingAnalytics}>
            <RefreshCw className={`h-4 w-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Current state */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" />Current Emotional State</CardTitle>
              <CardDescription>Based on your most recent session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Emotion</p>
                  <p className="text-2xl font-bold text-primary capitalize">{emotion || 'Not detected yet'}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/10">
                  <p className="text-sm text-muted-foreground mb-1">Sentiment</p>
                  <p className="text-2xl font-bold text-secondary capitalize">{sentiment || 'Not detected yet'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 30-day analytics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" />30-Day Overview</CardTitle>
              <CardDescription>
                {dominantEmotion ? `Dominant emotion: ${dominantEmotion} · Trend: ${sentimentTrend}` : 'Complete a session to see your trends'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bars.map(({ label, key, color }, i) => {
                const pct = Math.round(((sentimentCounts[key] || 0) / total) * 100);
                return (
                  <motion.div key={key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">{moodHistory.length ? `${pct}%` : '—'}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div className={`h-full ${color}`} initial={{ width: 0 }} animate={{ width: moodHistory.length ? `${pct}%` : '0%' }} transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }} />
                    </div>
                  </motion.div>
                );
              })}
              {!moodHistory.length && !loadingAnalytics && (
                <p className="text-sm text-muted-foreground text-center pt-2">No data yet — complete a chat session first.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quote */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Reflection for You</CardTitle>
              <CardDescription>Personalized based on your emotional state</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingQuote && <p className="text-sm text-muted-foreground text-center py-4">Generating your reflection...</p>}
              {!loadingQuote && quote && <QuoteCard data={quote} />}
              {!loadingQuote && !quote && (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Complete a session to get a personalized reflection.</p>
                  {emotion && (
                    <Button variant="outline" size="sm" onClick={() => fetchQuote(emotion)}>Generate Reflection</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
