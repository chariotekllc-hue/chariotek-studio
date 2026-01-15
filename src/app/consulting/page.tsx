import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle, Info } from 'lucide-react';
import consultingContent from '@/content/consulting.json';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const abstractGridImage = PlaceHolderImages.find(p => p.id === '/images/abstract-grid.png');

export default function ConsultingPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero Section - Centered, symmetric */}
      <section className="relative w-full py-32 md:py-40 lg:py-48">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] leading-[1.1] text-foreground mb-6">
            {consultingContent.hero.title}
          </h1>
          {consultingContent.hero.subtitle && (
            <p className="max-w-content mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
              {consultingContent.hero.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Offerings Section - Symmetric 3-column grid */}
      <section className="py-32 md:py-40 lg:py-48 border-t border-border">
        <div className="container mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-[-0.01em]">
              {consultingContent.offerings.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {consultingContent.offerings.items.map((item, index) => (
              <div
                key={item.title || index}
                className="
                  group
                  relative
                  bg-card
                  rounded-3xl
                  border border-border
                  p-8 md:p-10
                  text-center md:text-left
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
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 tracking-[-0.005em] group-hover:text-accent transition-colors duration-300">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-base text-muted-foreground leading-relaxed flex-grow group-hover:text-foreground/80 transition-colors duration-300">
                    {item.description}
                  </p>

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
        </div>
      </section>

      {/* Areas & Engagement - Parallel columns with equal weight */}
      <section className="py-32 md:py-40 lg:py-48 bg-background border-t border-border">
        <div className="container mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
            {/* Areas - Left column */}
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-[-0.01em]">
                {consultingContent.areas.title}
              </h2>
              <ul className="space-y-4">
                {consultingContent.areas.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-foreground mt-1 shrink-0" />
                    <span className="text-base md:text-lg text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Engagement - Right column (parallel structure) */}
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-[-0.01em]">
                {consultingContent.engagement.title}
              </h2>
              <div className="space-y-6">
                {consultingContent.engagement.items.map((item, index) => (
                  <div key={item.title || index}>
                    <h3 className="font-semibold text-lg md:text-xl text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & CTA Section - Centered, symmetric */}
      <section className="py-32 md:py-40 lg:py-48 border-t border-border">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-[-0.01em]">
            {consultingContent.pricing.title}
          </h2>
          {consultingContent.pricing.statement && (
            <p className="max-w-content mx-auto text-base md:text-lg text-muted-foreground mb-10 leading-relaxed">
              {consultingContent.pricing.statement}
            </p>
          )}
          <Button 
            asChild 
            size="lg"
            className="rounded-full px-8 py-6 mb-12"
          >
            <Link href={consultingContent.cta.href}>{consultingContent.cta.text}</Link>
          </Button>
          {consultingContent.disclaimer && (
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
                      {consultingContent.disclaimer}
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
