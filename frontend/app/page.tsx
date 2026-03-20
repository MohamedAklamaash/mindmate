'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/lib/store/userStore';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [name, setName] = useState('');

  const handleLogin = () => {
    if (!name.trim()) return;
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setUser(userId, name.trim());
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }} transition={{ duration: 10, repeat: Infinity }} />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-sm">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <motion.div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-4 shadow-lg" whileHover={{ scale: 1.1, rotate: 360 }} transition={{ duration: 0.6 }}>
              <Brain className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-5xl font-bold text-gradient mb-2">MindMate</h1>
            <p className="text-muted-foreground">Your AI Mental Health Companion</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card className="glass shadow-2xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome</CardTitle>
                <CardDescription>A safe space to talk, reflect, and grow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="h-12"
                  />
                </div>
                <Button onClick={handleLogin} disabled={!name.trim()} className="w-full h-12 text-lg gradient-primary" size="lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Begin Session
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center text-xs text-muted-foreground mt-6">
            Not a substitute for professional mental health care. If you are in crisis, please contact emergency services.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
