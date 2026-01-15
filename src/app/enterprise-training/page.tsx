import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Rocket, Target, Cpu } from 'lucide-react';
import enterpriseContent from '@/content/enterprise-training.json';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const abstractGridImage = PlaceHolderImages.find(p => p.id === '/images/abstract-grid.png');

export default function EnterpriseTrainingPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero Section - Centered, symmetric */}
      <section className="relative w-full py-32 md:py-40 lg:py-48">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] leading-[1.1] text-foreground mb-6">
            {enterpriseContent.hero.title}
          </h1>
          {enterpriseContent.hero.subtitle && (
            <p className="max-w-content mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
              {enterpriseContent.hero.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Who For Section - Symmetric 3-column grid */}
      <section className="py-32 md:py-40 lg:py-48 border-t border-border">
        <div className="container mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-[-0.01em]">
              {enterpriseContent.who_for.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto text-center">
            {enterpriseContent.who_for.items.map((item, index) => {
              const icons = [Target, Rocket, Cpu];
              const Icon = icons[index] || Target;
              return (
                <div 
                  key={item || index}
                  className="flex flex-col items-center p-8 animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Icon className="w-12 h-12 text-foreground mb-6" />
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground tracking-[-0.005em]">
                    {item}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Areas Section - Parallel 2-column grid */}
      <section className="py-32 md:py-40 lg:py-48 bg-background border-t border-border">
        <div className="container mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-[-0.01em]">
              {enterpriseContent.areas.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
            {enterpriseContent.areas.items.map((item, index) => (
              <div
                key={item.title || index}
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

      {/* Delivery Section - Parallel 2-column grid */}
      <section className="py-32 md:py-40 lg:py-48 border-t border-border">
        <div className="container mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-[-0.01em]">
              {enterpriseContent.delivery.title}
            </h2>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {enterpriseContent.delivery.items.map((item, index) => (
              <div 
                key={item.title || index}
                className="text-center md:text-left p-8 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4 tracking-[-0.005em]">
                  {item.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Centered, symmetric */}
      <section className="py-32 md:py-40 lg:py-48 border-t border-border text-center">
        <div className="container mx-auto px-6 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 tracking-[-0.01em]">
            Ready to Empower Your Team?
          </h2>
          <Button 
            asChild 
            size="lg"
            className="rounded-full px-8 py-6"
          >
            <Link href={enterpriseContent.cta.href}>{enterpriseContent.cta.text}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
