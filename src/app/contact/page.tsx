import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';

import contactContent from '@/content/contact.json';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const abstractGridImage = PlaceHolderImages.find(p => p.id === '/images/abstract-grid.png');

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      <section className="relative w-full py-32 md:py-40 lg:py-48 bg-background">
        <div className="container mx-auto px-6 md:px-8 text-center">
          {/* Hero Section - Centered, symmetric */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] leading-[1.1] text-foreground mb-6">
            {contactContent.title}
          </h1>
          {contactContent.subtitle && (
            <p className="max-w-content mx-auto text-base md:text-lg text-muted-foreground leading-relaxed mb-16">
              {contactContent.subtitle}
            </p>
          )}
          {/* Contact Card - Centered, symmetric */}
          <div className="flex justify-center">
            <div className="
              group
              relative
              bg-card
              rounded-3xl
              border border-border
              p-8 md:p-12
              max-w-lg
              w-full
              transition-all duration-500
              hover:shadow-2xl
              hover:-translate-y-2
              hover:border-foreground/20
              animate-scale-in
              overflow-hidden
            ">
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
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Mail className="w-6 h-6 text-foreground group-hover:text-accent transition-colors duration-300" />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-[-0.005em] group-hover:text-accent transition-colors duration-300">
                    {contactContent.email.label}
                  </h2>
                </div>
                <div className="space-y-4">
                  <a 
                    href={`mailto:${contactContent.email.address}`} 
                    className="text-lg md:text-xl text-accent hover:text-accent/80 transition-colors block"
                  >
                    {contactContent.email.address}
                  </a>
                  {contactContent.note && (
                    <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                      {contactContent.note}
                    </p>
                  )}
                </div>

                {/* Bottom accent line on hover */}
                <div className="
                  mt-6 pt-6
                  border-t border-transparent
                  group-hover:border-accent/20
                  transition-all duration-300
                " />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}