'use client';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Cpu, Server, Workflow } from 'lucide-react';
import toolsContent from '@/content/tools.json';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const abstractGridImage = PlaceHolderImages.find(p => p.id === '/images/abstract-grid.png');

const icons: { [key: string]: React.ElementType } = {
  engineering: Cpu,
  software: Server,
  methodology: Workflow
};

export default function ToolsPage() {
  const firestore = useFirestore();
  const pageRef = useMemoFirebase(() => (firestore ? doc(firestore, 'tools_page', 'singleton') : null), [firestore]);
  const { data: pageData } = useDoc(pageRef);

  const content = pageData || toolsContent;

  return (
    <div className="flex flex-col bg-background">
      <section className="relative w-full py-32 md:py-40 lg:py-48">
        <div className="container mx-auto px-6 md:px-8">
          {/* Hero Section - Centered, symmetric */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] leading-[1.1] text-foreground mb-6">
              {content.title}
            </h1>
          </div>
          {/* Capabilities - Symmetric 3-column grid */}
          {(content.capabilities || []).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto mb-20">
              {(content.capabilities || []).map((capability: any, index: number) => {
                const Icon = icons[capability.id];
                return (
                  <div 
                    key={capability.id || capability.title || index} 
                    className="
                      group
                      relative
                      bg-card
                      rounded-3xl
                      border border-border
                      text-center 
                      flex flex-col 
                      items-center 
                      p-8 md:p-10
                      transition-all duration-500
                      hover:shadow-2xl
                      hover:-translate-y-2
                      hover:border-foreground/20
                      animate-scale-in
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
                    <div className="relative z-10 flex flex-col flex-grow w-full">
                      {/* Number Badge */}
                      <div className="
                        w-10 h-10
                        rounded-full
                        bg-muted
                        flex items-center justify-center
                        mb-6 mx-auto
                        text-sm font-semibold
                        text-muted-foreground
                        group-hover:bg-accent/10
                        group-hover:text-accent
                        transition-all duration-300
                      ">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      {/* Icon */}
                      {Icon && <Icon className="w-12 h-12 text-foreground mb-6 mx-auto group-hover:text-accent transition-colors duration-300" />}

                      {/* Title */}
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 tracking-[-0.005em] group-hover:text-accent transition-colors duration-300">
                        {capability.title}
                      </h2>

                      {/* Items List */}
                      <ul className="space-y-3 flex-grow">
                        {(capability.items || []).map((item: string, itemIndex: number) => (
                          <li key={itemIndex} className="text-base text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                            {item}
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
                );
              })}
            </div>
          )}

          {/* Philosophy Section - Centered, symmetric */}
          {content.philosophy && (
            <div className="text-center max-w-content mx-auto">
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                {content.philosophy.title}
              </h2>
              {content.philosophy.description && (
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.philosophy.description}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
