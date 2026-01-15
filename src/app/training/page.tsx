'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, Info, Group, Video, User, Users } from 'lucide-react';
import trainingContent from '@/content/training.json';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const abstractGridImage = PlaceHolderImages.find(p => p.id === '/images/abstract-grid.png');

const formatIcons = {
  "Live Workshops": Group,
  "Self-Paced Recorded Modules": Video,
  "Group Sessions": Users,
  "Optional 1:1 Mentoring": User,
} as const;


export default function TrainingPage() {
  const firestore = useFirestore();
  const pageRef = useMemoFirebase(() => (firestore ? doc(firestore, 'training_page', 'singleton') : null), [firestore]);
  const { data: pageData } = useDoc(pageRef);

  const content = pageData || trainingContent;

  return (
    <div className="flex flex-col bg-background">
      {/* Hero Section - Centered, symmetric */}
      <section className="relative w-full py-32 md:py-40 lg:py-48">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] leading-[1.1] text-foreground mb-6">
            {content.hero.title}
          </h1>
          {content.hero.subtitle && (
            <p className="max-w-content mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
              {content.hero.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Categories Section - Parallel 2-column grid */}
      <section className="py-32 md:py-40 lg:py-48 border-t border-border">
        <div className="container mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-[-0.01em]">
              {content.categories.title}
            </h2>
          </div>
          {(content.categories.items || []).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
              {(content.categories.items || []).map((category: any, index: number) => (
                <div
                  key={category.id || category.title || index}
                  className="
                    group
                    relative
                    bg-card
                    rounded-3xl
                    border border-border
                    p-8 md:p-10
                    transition-all duration-500
                    hover:shadow-2xl
                    hover:-translate-y-2
                    hover:border-foreground/20
                    animate-scale-in
                    flex flex-col
                    overflow-hidden
                  "
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Subtle gradient accent on hover */}
                  <div className="
                    absolute inset-0
                    bg-gradient-to-br from-accent/5 via-transparent to-transparent
                    opacity-0
                    group-hover:opacity-100
                    transition-opacity duration-500
                    pointer-events-none
                  " />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col flex-grow">
                    {/* Number Badge */}
                    <div className="
                      w-10 h-10
                      rounded-full
                      bg-muted
                      flex items-center justify-center
                      mb-6
                      text-sm font-semibold
                      text-muted-foreground
                      group-hover:bg-accent/10
                      group-hover:text-accent
                      transition-all duration-300
                    ">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6 tracking-[-0.005em] group-hover:text-accent transition-colors duration-300">
                      {category.title}
                    </h3>

                    {/* Description */}
                    {category.description && (
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                        {category.description}
                      </p>
                    )}

                    {/* Points List */}
                    <ul className="space-y-4 flex-grow">
                      {category.points.map((point: string, pIndex: number) => (
                        <li key={pIndex} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-foreground mt-1 shrink-0 group-hover:text-accent transition-colors duration-300" />
                          <span className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">{point}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Bottom accent line on hover */}
                    <div className="
                      mt-6 pt-6
                      border-t border-transparent
                      group-hover:border-accent/20
                      transition-all duration-300
                    " />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Format Section - Symmetric 4-column grid */}
      <section className="py-32 md:py-40 lg:py-48 bg-background border-t border-border">
        <div className="container mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-[-0.01em]">
              {content.format.title}
            </h2>
          </div>
          {(content.format.items || []).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto text-center">
              {(content.format.items || []).map((item: any, index: number) => {
                const Icon = formatIcons[item as keyof typeof formatIcons] || Group;
                return (
                  <div 
                    key={item || index} 
                    className="flex flex-col items-center p-6 space-y-4 animate-scale-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Icon className="w-10 h-10 text-foreground" />
                    <h3 className="font-semibold text-base md:text-lg text-foreground">{item}</h3>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Centered, symmetric */}
      <section className="py-32 md:py-40 lg:py-48 border-t border-border">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              asChild 
              size="lg" 
              disabled
              className="rounded-full px-8 py-6"
            >
              <Link href={content.cta.primary.href}>{content.cta.primary.text}</Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="rounded-full px-8 py-6 border-2"
            >
              <Link href={content.cta.secondary.href}>{content.cta.secondary.text}</Link>
            </Button>
          </div>
          {content.disclaimer && (
            <div className="max-w-2xl mx-auto mt-12">
              <div className="
                relative
                bg-muted/50
                backdrop-blur-sm
                border border-border
                rounded-3xl
                p-6 md:p-8
                transition-all duration-300
                hover:border-foreground/20
                hover:bg-muted/70
              ">
                <div className="flex items-start gap-4 md:gap-5">
                  <div className="
                    w-10 h-10
                    md:w-12 md:h-12
                    rounded-full
                    bg-accent/10
                    flex items-center justify-center
                    shrink-0
                    mt-0.5
                  ">
                    <Info className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="
                      text-sm md:text-base
                      text-muted-foreground
                      leading-relaxed
                      font-medium
                    ">
                      {content.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
