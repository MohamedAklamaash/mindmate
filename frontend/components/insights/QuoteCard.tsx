'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { EmotionReplyResponse } from '@/lib/types/api';

interface QuoteCardProps {
  data: EmotionReplyResponse;
}

export function QuoteCard({ data }: QuoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <Quote className="h-8 w-8 text-primary mb-4" />
          
          <blockquote className="text-lg font-medium mb-2">
            "{data.quote}"
          </blockquote>
          
          <p className="text-sm text-muted-foreground mb-4">
            — {data.author}
          </p>
          
          <div className="border-t pt-4">
            <p className="text-sm leading-relaxed text-foreground/80">
              {data.thought}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
