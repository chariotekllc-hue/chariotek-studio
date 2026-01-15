'use client';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, doc } from 'firebase/firestore';

import {
  useFirestore,
  useDoc,
  useCollection,
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useMemoFirebase,
  WithId
} from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '../ui/separator';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';

const domainSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required.'),
  desc: z.string().min(1, 'Description is required.'),
});

const homeConfigSchema = z.object({
  title: z.string().min(1, 'Hero title is required.'),
  tagline: z.string().optional(),
  description: z.string().optional(),
  background: z.string().url('Invalid URL for background.').optional(),
  ctaPrimary: z.string().optional(),
  ctaSecondary: z.string().optional(),
  domains: z.array(domainSchema).optional(),
});

type HomeConfigFormData = z.infer<typeof homeConfigSchema>;

function HomeConfigSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

export function HomeConfigForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const heroRef = useMemoFirebase(() => firestore ? doc(firestore, 'homes/singleton/hero/singleton') : null, [firestore]);
  const homeRef = useMemoFirebase(() => firestore ? doc(firestore, 'homes', 'singleton') : null, [firestore]);
  const domainsRef = useMemoFirebase(() => firestore ? collection(firestore, 'domains') : null, [firestore]);

  const { data: heroData, isLoading: isLoadingHero } = useDoc(heroRef);
  const { data: homeData, isLoading: isLoadingHome } = useDoc(homeRef);
  const { data: domainsData, isLoading: isLoadingDomains } = useCollection(domainsRef);
  
  const [domainDocs, setDomainDocs] = useState<WithId<z.infer<typeof domainSchema>>[]>([]);

  const form = useForm<HomeConfigFormData>({
    resolver: zodResolver(homeConfigSchema),
    defaultValues: {
      title: '',
      tagline: '',
      description: '',
      background: '',
      ctaPrimary: '',
      ctaSecondary: '',
      domains: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "domains",
  });

  useEffect(() => {
    if (domainsData) {
       setDomainDocs(domainsData);
    }
  }, [domainsData]);

  useEffect(() => {
    // Allow form to populate even if domains are empty - enables editing
    const hasAnyData = heroData !== undefined || homeData !== undefined;

    if (hasAnyData) {
      const homePageDomains = homeData && domainDocs.length > 0
        ? (homeData.domainIds || [])
            .map((id: string) => domainDocs.find(d => d.id === id))
            .filter(Boolean)
        : [];

      form.reset({
        title: heroData?.title || '',
        tagline: heroData?.tagline || '',
        description: heroData?.description || '',
        background: heroData?.background || '',
        ctaPrimary: heroData?.ctaPrimary || '',
        ctaSecondary: heroData?.ctaSecondary || '',
        domains: homePageDomains,
      });
    }
  }, [heroData, homeData, domainDocs]);

  const onSubmit = async (data: HomeConfigFormData) => {
    if (!heroRef || !homeRef || !domainsRef) return;

    const heroPayload = {
      title: data.title,
      tagline: data.tagline,
      description: data.description,
      background: data.background,
      ctaPrimary: data.ctaPrimary,
      ctaSecondary: data.ctaSecondary,
    };

    setDocumentNonBlocking(heroRef, heroPayload, { merge: true });

    const domainIds: string[] = [];
    for (const domain of data.domains || []) {
        if (domain.id) {
            const domainRef = doc(domainsRef, domain.id);
            setDocumentNonBlocking(domainRef, { title: domain.title, desc: domain.desc }, { merge: true });
            domainIds.push(domain.id);
        } else {
            const newDocRef = await addDocumentNonBlocking(domainsRef, { title: domain.title, desc: domain.desc });
            if (newDocRef) {
                domainIds.push(newDocRef.id);
            }
        }
    }
    
    // Cleanup removed domains
    const existingDomainIds = domainDocs.map(d => d.id);
    const removedDomains = existingDomainIds.filter(id => !domainIds.includes(id));
    for (const id of removedDomains) {
        // This is a simple implementation. In a real-world scenario you might want to confirm if other parts of the app use this domain.
        const domainIsOnHomePage = (homeData?.domainIds || []).includes(id);
        if(!domainIsOnHomePage) {
            // only remove domains that were previously on the home page and now are not
             deleteDocumentNonBlocking(doc(domainsRef, id));
        }
    }

    setDocumentNonBlocking(homeRef, { domainIds }, { merge: true });

    toast({
        title: "Home Page Content Saved",
        description: "Your changes have been successfully saved.",
    });
  };
  
  const handleRemoveDomain = (index: number) => {
    const domainToRemove = fields[index];
    if (domainToRemove.id) {
        deleteDocumentNonBlocking(doc(domainsRef, domainToRemove.id));
    }
    remove(index);
  }


  if (isLoadingHero || isLoadingHome || isLoadingDomains) {
    return <HomeConfigSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="
          bg-card
          rounded-3xl
          border border-border
          transition-all duration-300
          hover:shadow-lg
        ">
          <CardHeader className="pb-6">
            <CardTitle className="
              text-2xl md:text-3xl 
              font-bold 
              text-foreground
              tracking-[-0.005em]
            ">
              Hero Section
            </CardTitle>
            <CardDescription className="
              text-base 
              text-muted-foreground
              mt-2
            ">
              Manage the content of your homepage's hero section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Chariotek" 
                      {...field} 
                      className="
                        h-11
                        rounded-xl
                        border-border
                        transition-all duration-300
                        focus:border-accent
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Tagline</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Research and Innovation." 
                      {...field} 
                      className="
                        h-11
                        rounded-xl
                        border-border
                        transition-all duration-300
                        focus:border-accent
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Engineering and technology research..." 
                      {...field} 
                      className="
                        rounded-xl
                        border-border
                        transition-all duration-300
                        focus:border-accent
                        min-h-[100px]
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Background Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://example.com/hero-bg.png" 
                      {...field} 
                      className="
                        h-11
                        rounded-xl
                        border-border
                        transition-all duration-300
                        focus:border-accent
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="ctaPrimary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Primary Button Text</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contact Us" 
                      {...field} 
                      className="
                        h-11
                        rounded-xl
                        border-border
                        transition-all duration-300
                        focus:border-accent
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="ctaSecondary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Secondary Button Text</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="View Services" 
                      {...field} 
                      className="
                        h-11
                        rounded-xl
                        border-border
                        transition-all duration-300
                        focus:border-accent
                      "
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card className="
          bg-card
          rounded-3xl
          border border-border
          transition-all duration-300
          hover:shadow-lg
        ">
            <CardHeader className="pb-6">
                <CardTitle className="
                  text-2xl md:text-3xl 
                  font-bold 
                  text-foreground
                  tracking-[-0.005em]
                ">
                  Core Domains
                </CardTitle>
                <CardDescription className="
                  text-base 
                  text-muted-foreground
                  mt-2
                ">
                  Manage the domain cards displayed on your homepage.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {fields.map((field, index) => (
                <Card 
                  key={field.id} 
                  className="
                    p-6
                    bg-muted/30
                    rounded-2xl
                    border border-border
                    transition-all duration-300
                    hover:border-foreground/20
                  "
                >
                    <div className="flex justify-end mb-4">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           type="button" 
                           onClick={() => handleRemoveDomain(index)}
                           className="
                             rounded-full
                             hover:bg-destructive/10
                             hover:text-destructive
                             transition-all duration-300
                           "
                         >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <FormField
                    control={form.control}
                    name={`domains.${index}.title`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-foreground font-medium">Domain Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="
                              h-11
                              rounded-xl
                              border-border
                              transition-all duration-300
                              focus:border-accent
                            "
                          />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name={`domains.${index}.desc`}
                    render={({ field }) => (
                        <FormItem className="mt-4">
                        <FormLabel className="text-foreground font-medium">Domain Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="
                              rounded-xl
                              border-border
                              transition-all duration-300
                              focus:border-accent
                              min-h-[100px]
                            "
                          />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </Card>
                ))}
                 <Button 
                   type="button" 
                   variant="outline" 
                   size="lg"
                   onClick={() => append({ title: '', desc: '' })}
                   className="
                     w-full
                     rounded-full
                     h-11
                     font-medium
                     transition-all duration-300
                     hover:bg-accent/10
                     hover:text-accent
                     hover:border-accent
                   "
                 >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Add Domain
                </Button>
            </CardContent>
        </Card>

        <Card className="
          bg-card
          rounded-3xl
          border border-border
        ">
             <CardFooter className="pt-6">
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  className="
                    rounded-full
                    px-8
                    h-11
                    font-medium
                    transition-all duration-300
                    hover:scale-[1.02]
                    active:scale-[0.98]
                  "
                >
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Home Page'}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
