'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, TrendingUp, Smile, Frown, Meh } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/lib/store/userStore';
import Link from 'next/link';

export default function InsightsPage() {
  const router = useRouter();
  const { isAuthenticated, emotion, sentiment } = useUserStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const moodData = [
    { label: 'Happy', value: 0, icon: Smile, color: 'text-green-500' },
    { label: 'Neutral', value: 0, icon: Meh, color: 'text-yellow-500' },
    { label: 'Sad', value: 0, icon: Frown, color: 'text-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <header className="glass border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Emotional Insights</h1>
            <p className="text-xs text-muted-foreground">Track your emotional journey</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Current Mood */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Current Emotional State
                </CardTitle>
                <CardDescription>Based on your recent conversations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground mb-1">Emotion</p>
                    <p className="text-2xl font-bold text-primary capitalize">
                      {emotion || 'Not detected yet'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/10">
                    <p className="text-sm text-muted-foreground mb-1">Sentiment</p>
                    <p className="text-2xl font-bold text-secondary capitalize">
                      {sentiment || 'Not detected yet'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mood Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Mood Distribution
                </CardTitle>
                <CardDescription>Your emotional patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moodData.map((mood, index) => (
                    <motion.div
                      key={mood.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <mood.icon className={`w-6 h-6 ${mood.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{mood.label}</span>
                          <span className="text-sm text-muted-foreground">{mood.value}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${mood.color.replace('text', 'bg')}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${mood.value}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  More insights coming soon! Keep chatting to build your emotional profile.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
