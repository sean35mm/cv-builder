'use client';

import { SlideUp, StaggeredList } from '@/components/motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Palette, Share2 } from 'lucide-react';

const features = [
  {
    icon: Edit,
    title: 'Guided Editor',
    description:
      'Step-by-step interface to build your CV with ease. No design skills required.',
    badge: 'Easy to Use',
  },
  {
    icon: Palette,
    title: 'Customizable Templates',
    description:
      'Choose from professional templates and customize colors, fonts, and layouts.',
    badge: 'Flexible',
  },
  {
    icon: Share2,
    title: 'Share & Track',
    description:
      'Get a unique URL like opencv.app/@username and track views with built-in analytics.',
    badge: 'Professional',
  },
];

export function Features() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Stand Out
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create a professional online presence that impresses hiring
              managers and showcases your unique value.
            </p>
          </div>
        </SlideUp>

        <StaggeredList>
          {features.map((feature, index) => (
            <Card
              key={index}
              className="h-full hover:shadow-lg transition-shadow my-4"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">{feature.badge}</Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </StaggeredList>
      </div>
    </section>
  );
}
