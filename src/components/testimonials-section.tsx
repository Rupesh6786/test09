"use client";

import React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { TestimonialCard } from '@/components/testimonial-card';
import { testimonials } from '@/lib/data';


export function TestimonialsSection() {
    const plugin = React.useRef(
        Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })
    );

    return (
        <section id="testimonials" className="bg-muted/20 py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold uppercase tracking-wider text-accent text-shadow-accent">Player Feedback</h2>
                    <p className="text-lg text-muted-foreground mt-2">What our winners have to say</p>
                </div>
                <Carousel
                    opts={{
                        align: 'start',
                        loop: true,
                    }}
                    plugins={[plugin.current]}
                    className="w-full"
                >
                    <CarouselContent>
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                <div className="p-1">
                                    <TestimonialCard testimonial={testimonial} />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}
