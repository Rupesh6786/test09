import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { Testimonial } from '@/lib/data';
import { Star } from 'lucide-react';

type TestimonialCardProps = {
  testimonial: Testimonial;
};

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50 flex flex-col justify-between">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <Image
            src={testimonial.avatar}
            alt={testimonial.name}
            width={48}
            height={48}
            className="rounded-full border-2 border-accent"
          />
          <div className="ml-4">
            <p className="font-bold text-foreground">{testimonial.name}</p>
            <div className="flex text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
            </div>
          </div>
        </div>
        <blockquote className="text-muted-foreground italic border-l-2 border-accent pl-4">
          "{testimonial.quote}"
        </blockquote>
        <p className="text-primary font-medium mt-4 text-sm">{testimonial.winHistory}</p>
      </CardContent>
    </Card>
  );
}