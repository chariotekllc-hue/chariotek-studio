'use client';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import servicesContent from '@/content/services.json';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';

const abstractGridImage = PlaceHolderImages.find(p => p.id === '/images/abstract-grid.png');

export default function ServicesPage() {
  const firestore = useFirestore();

  // Firestore references
  const pageRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'services_page', 'singleton') : null),
    [firestore]
  );
  const categoriesRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'service_categories') : null),
    [firestore]
  );

  // Fetching data
  const { data: pageData } = useDoc(pageRef);
  const { data: categoriesData } = useCollection(categoriesRef);

  // Content assembly
  const pageTitle = pageData?.title || servicesContent.title;
  const displayCategories =
    pageData && categoriesData
      ? (pageData.categoryIds || [])
          .map((id: string) => categoriesData.find(cat => cat.id === id))
          .filter(Boolean)
      : servicesContent.categories;


  return (
    <div className="flex flex-col bg-background">
      {/* Hero Section - Centered, symmetric */}
      <section className="relative w-full py-32 md:py-40 lg:py-48">
        <div className="container mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] leading-[1.1] text-foreground mb-6">
              {pageTitle}
            </h1>
          </div>
          {/* Symmetric 3-column grid */}
          {displayCategories && displayCategories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
              {displayCategories.map((category, index) => (
                <div
                  key={(category as any).id || category.title || index}
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
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 tracking-[-0.005em] group-hover:text-accent transition-colors duration-300">
                      {category.title}
                    </h2>

                    {/* Items List */}
                    <ul className="space-y-4 flex-grow">
                      {category.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-foreground mt-1 shrink-0 group-hover:text-accent transition-colors duration-300" />
                          <span className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">{item}</span>
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
    </div>
  );
}
