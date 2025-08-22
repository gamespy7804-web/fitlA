
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface AdBannerProps {
  title: string;
  description: string;
  buttonText: string;
  imageUrl: string;
  className?: string;
  'data-ai-hint'?: string;
}

export function AdBanner({ title, description, buttonText, imageUrl, className, ...props }: AdBannerProps) {
  return (
    <Card className={cn("w-full overflow-hidden relative group", className)}>
      <CardContent className="p-0">
        <div className="relative aspect-[4/1] w-full">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            {...props}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <Badge variant="secondary" className="absolute top-2 left-2 text-xs">Ad</Badge>
        </div>
        <div className="absolute inset-0 flex items-center justify-between p-6">
            <div className="max-w-md text-white">
                <h3 className="text-xl font-bold font-headline">{title}</h3>
                <p className="text-sm text-white/80 mt-1">{description}</p>
            </div>
            <Button variant="secondary" size="lg" className="shrink-0">
                {buttonText}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
