'use client';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import portfolioContent from '@/content/portfolio.json';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const abstractGridImage = PlaceHolderImages.find(p => p.id === '/images/abstract-grid.png');

export default function PortfolioPage() {
  const firestore = useFirestore();

  const pageRef = useMemoFirebase(() => (firestore ? doc(firestore, 'portfolio_page', 'singleton') : null), [firestore]);
  const projectsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'portfolio_projects') : null), [firestore]);
  
  const { data: pageData } = useDoc(pageRef);
  const { data: projectsData } = useCollection(projectsRef);

  const content = pageData || portfolioContent;
  const displayProjects = 
    pageData && projectsData
    ? (pageData.projectIds || [])
        .map((id: string) => projectsData.find(p => p.id === id))
        .filter(Boolean)
    : portfolioContent.projects;


  return (
    <div className="flex flex-col">
      <section className="relative w-full py-32 md:py-40 lg:py-48 bg-background">
        <div className="container mx-auto px-6 md:px-8">
          {/* Hero Section - Centered, symmetric */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] leading-[1.1] text-foreground mb-6">
              {content.title}
            </h1>
            {content.subtitle && (
              <p className="max-w-content mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
                {content.subtitle}
              </p>
            )}
          </div>
          {/* Symmetric 3-column grid */}
          {displayProjects && displayProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto mb-16">
              {displayProjects.map((project: any, index: number) => (
                <div
                  key={project.id || project.title || index}
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

                    {/* Title and Status */}
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-[-0.005em] flex-grow group-hover:text-accent transition-colors duration-300">
                        {project.title}
                      </h2>
                      {project.status && (
                        <Badge variant="secondary" className="ml-4 shrink-0">
                          {project.status}
                        </Badge>
                      )}
                    </div>

                    {/* Domain */}
                    {project.domain && (
                      <p className="text-sm text-muted-foreground mb-4 group-hover:text-foreground/70 transition-colors duration-300">
                        {project.domain}
                      </p>
                    )}

                    {/* Description */}
                    {project.description && (
                      <p className="text-base text-muted-foreground leading-relaxed flex-grow group-hover:text-foreground/80 transition-colors duration-300">
                        {project.description}
                      </p>
                    )}

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
          {/* Disclaimer - Centered */}
          {content.disclaimer && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground max-w-content mx-auto">
                {content.disclaimer}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
