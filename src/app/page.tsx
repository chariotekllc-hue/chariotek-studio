'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';

import homeContent from '@/content/home.json';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
    const firestore = useFirestore();
    const heroRef = useMemoFirebase(() => firestore ? doc(firestore, 'homes/singleton/hero/singleton') : null, [firestore]);
    const homeRef = useMemoFirebase(() => firestore ? doc(firestore, 'homes', 'singleton') : null, [firestore]);
    const domainsRef = useMemoFirebase(() => firestore ? collection(firestore, 'domains') : null, [firestore]);

    const { data: heroData } = useDoc(heroRef);
    const { data: homeData } = useDoc(homeRef);
    const { data: domainsData } = useCollection(domainsRef);

    const heroContent = heroData || homeContent.hero;

    const heroImage = PlaceHolderImages.find(p => p.id === heroContent.background) || PlaceHolderImages.find(p => p.id === homeContent.hero.background);
    
    const displayDomains = homeData && domainsData
        ? (homeData.domainIds || []).map((id: string) => domainsData.find(d => d.id === id)).filter(Boolean)
        : homeContent.domains;

    // Fallback to JSON content for additional sections
    const whatWeDo = homeContent.what_we_do || { title: 'What We Do', items: [] };
    const whyChariotek = homeContent.why_chariotek || { title: 'Why Chariotek', items: [] };

  return (
    <div className="flex flex-col">
      {/* Hero Section - Enhanced Apple-style: Full viewport, improved visualization */}
      <section className="relative flex min-h-[calc(100vh-80px)] w-full items-center justify-center overflow-hidden bg-background">
        {/* Background Image Layer */}
        {heroImage && (
          <div className="absolute inset-0">
            <Image
              src={heroImage.imageUrl}
              alt="Hero background"
              fill
              className="object-cover"
              priority
              data-ai-hint={heroImage.imageHint}
              quality={90}
            />
            {/* Gradient Overlay - Enhanced for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80 dark:from-background/80 dark:via-background/60 dark:to-background/90" />
            {/* Additional subtle overlay for depth */}
            <div className="absolute inset-0 bg-background/20 dark:bg-background/40" />
          </div>
        )}

        {/* Content Layer - Enhanced with better visual hierarchy */}
        <div className="relative z-10 mx-auto w-full max-w-content px-6 md:px-8 text-center">
          <div className="animate-fade-in space-y-8 md:space-y-10">
            {/* Title - Enhanced typography */}
            <div className="space-y-4 md:space-y-6">
              <h1 className="
                text-5xl md:text-7xl lg:text-8xl xl:text-9xl
                font-bold 
                tracking-[-0.02em] 
                leading-[1.05]
                text-foreground
                drop-shadow-lg
              ">
                {heroContent.title}
              </h1>
              
              {/* Tagline - Enhanced styling */}
              {heroContent.tagline && (
                <p className="
                  text-xl md:text-2xl lg:text-3xl xl:text-4xl
                  font-medium 
                  text-foreground/90
                  tracking-[-0.01em]
                  drop-shadow-md
                ">
                  {heroContent.tagline}
                </p>
              )}
            </div>

            {/* Description - Enhanced readability */}
            {heroContent.description && (
              <p className="
                text-base md:text-lg lg:text-xl xl:text-2xl
                text-foreground/80
                max-w-3xl mx-auto
                leading-relaxed
                font-light
                drop-shadow-sm
              ">
                {heroContent.description}
              </p>
            )}

            {/* CTA Buttons - Enhanced with better spacing and visual appeal */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-4 md:pt-6">
              <Button 
                size="lg" 
                asChild 
                className="
                  rounded-full 
                  px-8 md:px-10 
                  py-6 md:py-7
                  text-base md:text-lg
                  font-medium
                  bg-accent 
                  hover:bg-accent/90
                  text-accent-foreground
                  transition-all duration-300
                  active:scale-95
                  shadow-lg hover:shadow-xl
                  hover:scale-105
                  backdrop-blur-sm
                "
              >
                <Link href="/contact" className="flex items-center gap-2 group">
                  {heroContent.ctaPrimary || 'Contact Us'}
                  <ArrowRight className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="
                  rounded-full 
                  px-8 md:px-10 
                  py-6 md:py-7
                  text-base md:text-lg
                  font-medium
                  border-2
                  border-foreground/20
                  bg-background/50
                  backdrop-blur-sm
                  transition-all duration-300
                  active:scale-95
                  hover:bg-foreground 
                  hover:text-background
                  hover:border-foreground
                  hover:scale-105
                  shadow-md hover:shadow-lg
                "
              >
                <Link href="/services" className="flex items-center gap-2 group">
                  {heroContent.ctaSecondary || 'View Services'}
                  <ArrowRight className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Subtle decorative elements - Apple-style minimalism */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Domains Section - Enhanced Apple-style: Symmetric grid, reimagined cards */}
      {displayDomains && displayDomains.length > 0 && (
        <section className="relative w-full py-32 md:py-40 lg:py-48 bg-background">
          <div className="container mx-auto px-6 md:px-8">
            {/* Section Header - Centered */}
            <div className="text-center mb-16 md:mb-20">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-[-0.01em]">
                Core Domains
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-content mx-auto leading-relaxed">
                Our expertise spans multiple engineering and technology domains
              </p>
            </div>

            {/* Symmetric grid: 4 columns on large, 2 on medium, 1 on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
              {displayDomains.map((domain, index) => (
                <div
                  key={(domain as any).id || domain.title || index}
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
                    {/* Number Badge - Apple-style minimal indicator */}
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

                    {/* Title - Enhanced typography */}
                    <h3 className="
                      text-2xl md:text-3xl
                      font-bold
                      text-foreground
                      mb-4 md:mb-6
                      tracking-[-0.01em]
                      leading-tight
                      group-hover:text-accent
                      transition-colors duration-300
                    ">
                      {domain.title}
                    </h3>

                    {/* Description - Enhanced readability */}
                    <p className="
                      text-base md:text-lg
                      text-muted-foreground
                      leading-relaxed
                      flex-grow
                      group-hover:text-foreground/80
                      transition-colors duration-300
                    ">
                      {domain.desc}
                    </p>

                    {/* Subtle bottom accent line on hover */}
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
          </div>
        </section>
      )}

      {/* What We Do & Why Chariotek - Parallel columns with equal weight */}
      {(whatWeDo.items?.length > 0 || whyChariotek.items?.length > 0) && (
        <section className="relative w-full py-32 md:py-40 lg:py-48 bg-background border-t border-border">
          <div className="container mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
              {/* What We Do - Left column */}
              {whatWeDo.items?.length > 0 && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-[-0.01em]">
                    {whatWeDo.title}
                  </h2>
                  <ul className="space-y-4">
                    {whatWeDo.items.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-foreground mt-1 shrink-0" />
                        <span className="text-base md:text-lg text-muted-foreground leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Why Chariotek - Right column (parallel structure) */}
              {whyChariotek.items?.length > 0 && (
                <div className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-[-0.01em]">
                    {whyChariotek.title}
                  </h2>
                  <ul className="space-y-4">
                    {whyChariotek.items.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-foreground mt-1 shrink-0" />
                        <span className="text-base md:text-lg text-muted-foreground leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Centered, symmetric */}
      <section className="relative w-full py-32 md:py-40 lg:py-48 bg-background border-t border-border">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <div className="max-w-content mx-auto space-y-8 animate-fade-in">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-[-0.01em]">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Let's discuss how we can help bring your vision to life.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                asChild 
                className="
                  rounded-full 
                  px-8 py-6 
                  text-base font-medium
                  bg-accent hover:bg-accent/90
                  text-accent-foreground
                  transition-all duration-300
                  active:scale-95
                  shadow-sm hover:shadow-md
                "
              >
                <Link href="/contact" className="flex items-center gap-2">
                  Get in Touch
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="
                  rounded-full 
                  px-8 py-6 
                  text-base font-medium
                  border-2
                  transition-all duration-300
                  active:scale-95
                  hover:bg-foreground hover:text-background
                "
              >
                <Link href="/portfolio">View Our Work</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
