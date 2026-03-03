'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, User, Stethoscope, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore, type UserRole } from '@/lib/store/userStore';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleLogin = () => {
    if (!name.trim() || !selectedRole) return;

    const userId = `${selectedRole}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setUser(userId, selectedRole, name.trim());
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-4 shadow-lg"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Brain className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-5xl font-bold text-gradient mb-2">
              MindMate
            </h1>
            <p className="text-muted-foreground text-lg">Your AI Mental Health Companion</p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass shadow-2xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-foreground">Welcome</CardTitle>
                <CardDescription>Choose your role to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Role Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Select Role</label>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Card
                        className={`cursor-pointer transition-all ${selectedRole === 'user'
                          ? 'border-primary border-2 bg-primary/5'
                          : 'hover:border-primary/50'
                          }`}
                        onClick={() => setSelectedRole('user')}
                      >
                        <CardContent className="p-6 text-center">
                          <User className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="font-medium text-foreground">User</p>
                          <p className="text-xs text-muted-foreground mt-1">Seek support</p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Card
                        className={`cursor-pointer transition-all ${selectedRole === 'therapist'
                          ? 'border-secondary border-2 bg-secondary/5'
                          : 'hover:border-secondary/50'
                          }`}
                        onClick={() => setSelectedRole('therapist')}
                      >
                        <CardContent className="p-6 text-center">
                          <Stethoscope className="w-8 h-8 mx-auto mb-2 text-secondary" />
                          <p className="font-medium text-foreground">Therapist</p>
                          <p className="text-xs text-muted-foreground mt-1">Provide care</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  onClick={handleLogin}
                  disabled={!name.trim() || !selectedRole}
                  className="w-full h-12 text-lg gradient-primary"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Continue
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            Your privacy is our priority. All conversations are confidential.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
