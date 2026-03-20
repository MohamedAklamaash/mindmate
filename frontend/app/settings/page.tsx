'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Shield, Bell, Trash2, Download, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUserStore } from '@/lib/store/userStore';
import { useChatStore } from '@/lib/store/chatStore';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, userName, clearUser } = useUserStore();
  const { clearMessages } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleClearHistory = () => {
    clearMessages();
    toast.success('Conversation history cleared');
  };

  const handleExportData = () => {
    toast.info('Export feature coming soon!');
  };

  const handleLogout = () => {
    clearUser();
    router.push('/');
  };

  if (!isAuthenticated) return null;

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
            <h1 className="text-xl font-bold">Settings</h1>
            <p className="text-xs text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile
                </CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="text-lg font-medium">{userName}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy & Data
                </CardTitle>
                <CardDescription>Manage your data and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Clear Conversation History</p>
                    <p className="text-sm text-muted-foreground">Delete all your chat messages</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClearHistory}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Export Your Data</p>
                    <p className="text-sm text-muted-foreground">Download all your conversations</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Notification preferences will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-6">
                <Button
                  className="w-full gradient-primary text-white font-semibold"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
