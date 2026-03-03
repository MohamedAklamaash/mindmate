'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, History, TrendingUp, Settings, LogOut, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUserStore } from '@/lib/store/userStore';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { userName, userRole, isAuthenticated, clearUser } = useUserStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    clearUser();
    router.push('/');
  };

  if (!isAuthenticated) return null;

  const features = [
    {
      icon: MessageSquare,
      title: 'Start Chat',
      description: 'Begin a conversation with your AI companion',
      href: '/chat',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: History,
      title: 'History',
      description: 'View your past conversations and insights',
      href: '/history',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: TrendingUp,
      title: 'Insights',
      description: 'Track your emotional journey and progress',
      href: '/insights',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Manage your preferences and account',
      href: '/settings',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="glass border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MindMate</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
            </div>
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarFallback className="gradient-primary text-white">
                {userName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="glass border-0 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 gradient-primary opacity-10 rounded-full blur-3xl" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-3xl text-foreground">Welcome back, {userName}!</CardTitle>
              </div>
              <CardDescription className="text-base">
                {userRole === 'therapist'
                  ? 'Ready to provide support and guidance today?'
                  : 'How are you feeling today? Let\'s talk about it.'}
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={feature.href}>
                <Card className="glass border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`${feature.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors text-foreground">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Card className="glass border-0">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Conversations</p>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-secondary">0</p>
              <p className="text-sm text-muted-foreground">Insights</p>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">0</p>
              <p className="text-sm text-muted-foreground">Days Active</p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
