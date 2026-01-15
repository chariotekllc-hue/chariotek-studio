'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import {
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
  WithId,
} from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import aboutContent from '@/content/about.json';

export default function AboutPage() {
  const firestore = useFirestore();

  // Firestore references
  const heroRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'about/singleton/hero/singleton') : null),
    [firestore]
  );
  const missionRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'about/singleton/sections/mission') : null),
    [firestore]
  );
  const visionRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'about/singleton/sections/vision') : null),
    [firestore]
  );
  const teamRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'about/singleton/sections/team') : null),
    [firestore]
  );
  const valuesSectionRef = useMemoFirebase(
    () =>
      firestore
        ? doc(firestore, 'about/singleton/values_section/singleton')
        : null,
    [firestore]
  );
  const valuesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'about_values') : null),
    [firestore]
  );

  // Fetching data
  const { data: heroData } = useDoc(heroRef);
  const { data: missionData } = useDoc(missionRef);
  const { data: visionData } = useDoc(visionRef);
  const { data: teamData } = useDoc(teamRef);
  const { data: valuesSectionData } = useDoc(valuesSectionRef);
  const { data: valuesCollectionData } = useCollection(valuesCollectionRef);

  // Content assembly
  const heroContent = heroData || aboutContent.hero;
  const missionContent = missionData || aboutContent.mission;
  const visionContent = visionData || aboutContent.vision;
  const teamContent = teamData
    ? { title: teamData.title, description: teamData.content }
    : aboutContent.team;
  const valuesSectionContent = valuesSectionData || aboutContent.values;

  const displayValues =
    valuesSectionData && valuesCollectionData && valuesCollectionData.length > 0
      ? (valuesSectionData.valueIds || [])
          .map((id: string) => valuesCollectionData.find((d) => d.id === id))
          .filter(Boolean)
      : aboutContent.values.list;

  return (
    <div className="flex flex-col bg-background">
      {/* Hero Section - Centered, symmetric */}
      <section className="relative w-full py-32 md:py-40 lg:py-48">
        <div className="container mx-auto px-6 md:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] leading-[1.1] text-foreground mb-6">
              {heroContent.title}
            </h1>
            {heroContent.subtitle && (
              <p className="max-w-content mx-auto text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                {heroContent.subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Mission & Vision - Parallel columns with equal weight */}
      <section className="relative w-full py-32 md:py-40 lg:py-48 bg-background">
        <div className="container mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
            {/* Mission - Left column */}
            <div className="space-y-6 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-[-0.01em]">
                {missionContent.title}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {missionData ? missionData.content : aboutContent.mission.statement}
              </p>
            </div>
            {/* Vision - Right column (parallel structure) */}
            <div className="space-y-6 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-[-0.01em]">
                {visionContent.title}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {visionData ? visionData.content : aboutContent.vision.statement}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - Centered, symmetric */}
      <section className="py-32 md:py-40 lg:py-48 bg-background border-t border-border">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8 tracking-[-0.01em]">
            {teamContent.title}
          </h2>
          <p className="max-w-content mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            {teamContent.description}
          </p>
        </div>
      </section>

      {/* Values Section - Symmetric 4-column grid */}
      {displayValues && displayValues.length > 0 && (
        <section className="relative w-full py-32 md:py-40 lg:py-48 bg-background border-t border-border">
          <div className="container mx-auto px-6 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-[-0.01em]">
                {valuesSectionContent.title}
              </h2>
              {valuesSectionContent.description && (
                <p className="max-w-content mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
                  {valuesSectionContent.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
              {displayValues.map((value, index) => (
                <div
                  key={(value as any).id || value.title || index}
                  className="
                    group
                    relative
                    bg-card
                    rounded-3xl
                    border border-border
                    p-8 md:p-10
                    text-center
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
                      mb-6 mx-auto
                      text-sm font-semibold
                      text-muted-foreground
                      group-hover:bg-accent/10
                      group-hover:text-accent
                      transition-all duration-300
                    ">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Icon and Title */}
                    <div className="flex flex-col items-center gap-4 mb-4">
                      <CheckCircle className="w-8 h-8 text-foreground group-hover:text-accent transition-colors duration-300" />
                      <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-[-0.005em] group-hover:text-accent transition-colors duration-300">
                        {value.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-base text-muted-foreground leading-relaxed flex-grow group-hover:text-foreground/80 transition-colors duration-300">
                      {value.desc}
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
      )}
    </div>
  );
}
