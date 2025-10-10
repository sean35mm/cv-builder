'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { SlideUp } from '@/components/motion';

// Mock profile screenshots - in real app, these would be actual images
const profiles = [
  { username: 'johndoe', description: 'Software Engineer' },
  { username: 'sarahsmith', description: 'UX Designer' },
  { username: 'mikejohnson', description: 'Product Manager' },
  { username: 'emilychen', description: 'Data Scientist' },
];

export function Gallery() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              See What You Can Create
            </h2>
            <p className="text-xl text-muted-foreground">
              Professional profiles that make an impact
            </p>
          </div>
        </SlideUp>
        <div className="max-w-4xl mx-auto">
          <Carousel className="w-full">
            <CarouselContent>
              {profiles.map((profile, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <div className="bg-card rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-md mb-4 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">
                            Profile Preview
                          </p>
                        </div>
                      </div>
                      <h3 className="font-semibold">@{profile.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile.description}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
