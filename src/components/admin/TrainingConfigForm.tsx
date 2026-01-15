'use client';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { collection, doc } from 'firebase/firestore';
import {
  useFirestore,
  useDoc,
  useCollection,
  setDocumentNonBlocking,
  useMemoFirebase,
  WithId,
} from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';

const categorySchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  points: z.array(z.string().min(1, 'Point cannot be empty.')),
});

const trainingConfigSchema = z.object({
  heroTitle: z.string().min(1, 'Hero title is required.'),
  heroSubtitle: z.string().optional(),
  categoriesTitle: z.string().min(1, 'Categories section title is required.'),
  categories: z.array(categorySchema),
  formatTitle: z.string().min(1, 'Format section title is required.'),
  formats: z.array(z.string().min(1, 'Format item cannot be empty.')),
  ctaPrimaryText: z.string().optional(),
  ctaSecondaryText: z.string().optional(),
  disclaimer: z.string().optional(),
});

type TrainingConfigFormData = z.infer<typeof trainingConfigSchema>;

function TrainingConfigSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TrainingConfigForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const pageRef = useMemoFirebase(() => (firestore ? doc(firestore, 'training_page', 'singleton') : null), [firestore]);
  const { data: pageData, isLoading: isLoadingPage } = useDoc(pageRef);

  const form = useForm<TrainingConfigFormData>({
    resolver: zodResolver(trainingConfigSchema),
    defaultValues: {
      heroTitle: '',
      heroSubtitle: '',
      categoriesTitle: '',
      categories: [],
      formatTitle: '',
      formats: [],
      ctaPrimaryText: '',
      ctaSecondaryText: '',
      disclaimer: '',
    },
  });

  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control: form.control,
    name: 'categories',
  });

  const { fields: formatFields, append: appendFormat, remove: removeFormat } = useFieldArray({
    control: form.control,
    name: 'formats',
  });

  useEffect(() => {
    if (pageData !== undefined) {
      form.reset({
        heroTitle: pageData?.hero?.title || '',
        heroSubtitle: pageData?.hero?.subtitle || '',
        categoriesTitle: pageData?.categories?.title || '',
        categories: pageData?.categories?.items || [],
        formatTitle: pageData?.format?.title || '',
        formats: pageData?.format?.items || [],
        ctaPrimaryText: pageData?.cta?.primary?.text || '',
        ctaSecondaryText: pageData?.cta?.secondary?.text || '',
        disclaimer: pageData?.disclaimer || '',
      });
    }
  }, [pageData]);

  const onSubmit = (data: TrainingConfigFormData) => {
    if (!pageRef) return;

    const payload = {
      hero: {
        title: data.heroTitle,
        subtitle: data.heroSubtitle,
      },
      categories: {
        title: data.categoriesTitle,
        items: data.categories,
      },
      format: {
        title: data.formatTitle,
        items: data.formats,
      },
      cta: {
        primary: { text: data.ctaPrimaryText, href: '#' },
        secondary: { text: data.ctaSecondaryText, href: '/enterprise-training' },
      },
      disclaimer: data.disclaimer,
    };
    
    setDocumentNonBlocking(pageRef, payload, { merge: true });

    toast({
      title: 'Training Page Content Saved',
      description: 'Your changes have been successfully saved.',
    });
  };

  if (isLoadingPage) {
    return <TrainingConfigSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Hero Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="heroTitle" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="heroSubtitle" render={({ field }) => ( <FormItem> <FormLabel>Subtitle</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Categories Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="categoriesTitle" render={({ field }) => ( <FormItem> <FormLabel>Section Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormLabel>Categories</FormLabel>
            {categoryFields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-muted/30">
                <div className="flex justify-end mb-2">
                  <Button variant="ghost" size="icon" type="button" onClick={() => removeCategory(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <FormField control={form.control} name={`categories.${index}.title`} render={({ field }) => ( <FormItem> <FormLabel>Category Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name={`categories.${index}.description`} render={({ field }) => ( <FormItem className="mt-2"> <FormLabel>Category Description</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <CategoryPoints control={form.control} categoryIndex={index} />
              </Card>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendCategory({ id: uuidv4(), title: '', description: '', points: [] })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Training Format</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="formatTitle" render={({ field }) => ( <FormItem> <FormLabel>Section Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormLabel>Format Items</FormLabel>
            {formatFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField control={form.control} name={`formats.${index}`} render={({ field }) => ( <FormItem className="flex-grow"> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <Button variant="ghost" size="icon" type="button" onClick={() => removeFormat(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendFormat('')}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Format Item
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>CTA & Disclaimer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="ctaPrimaryText" render={({ field }) => ( <FormItem> <FormLabel>Primary Button Text</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="ctaSecondaryText" render={({ field }) => ( <FormItem> <FormLabel>Secondary Button Text</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="disclaimer" render={({ field }) => ( <FormItem> <FormLabel>Disclaimer Text</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
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
              {form.formState.isSubmitting ? 'Saving...' : 'Save Training Page'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

function CategoryPoints({ control, categoryIndex }: { control: any; categoryIndex: number }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `categories.${categoryIndex}.points`,
  });

  return (
    <div className="space-y-2 pt-4">
      <FormLabel>Points</FormLabel>
      {fields.map((item, itemIndex) => (
        <div key={item.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`categories.${categoryIndex}.points.${itemIndex}`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button variant="ghost" size="icon" type="button" onClick={() => remove(itemIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append('')}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Point
      </Button>
    </div>
  );
}
