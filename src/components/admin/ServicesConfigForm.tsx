'use client';
import { useEffect } from 'react';
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

const serviceItemSchema = z.string().min(1, 'Service item cannot be empty.');

const categorySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Category title is required.'),
  items: z.array(serviceItemSchema),
});

const servicesConfigSchema = z.object({
  title: z.string().min(1, 'Page title is required.'),
  categories: z.array(categorySchema),
});

type ServicesConfigFormData = z.infer<typeof servicesConfigSchema>;

function ServicesConfigSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
      </Card>
      <Card>
        <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ServicesConfigForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const pageRef = useMemoFirebase(() => (firestore ? doc(firestore, 'services_page', 'singleton') : null), [firestore]);
  const categoriesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'service_categories') : null), [firestore]);

  const { data: pageData, isLoading: isLoadingPage } = useDoc(pageRef);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCollection(categoriesRef);

  const form = useForm<ServicesConfigFormData>({
    resolver: zodResolver(servicesConfigSchema),
    defaultValues: { title: '', categories: [] },
  });

  const { fields, append, remove, control } = useFieldArray({
    control: form.control,
    name: 'categories',
  });

  useEffect(() => {
    // Allow form to populate even if categories are empty - enables editing
    const hasAnyData = pageData !== undefined || categoriesData !== undefined;

    if (hasAnyData) {
      const orderedCategories = pageData && categoriesData
        ? (pageData.categoryIds || [])
            .map((id: string) => categoriesData.find(cat => cat.id === id))
            .filter(Boolean) as WithId<z.infer<typeof categorySchema>>[]
        : [];

      form.reset({
        title: pageData?.title || '',
        categories: orderedCategories,
      });
    }
  }, [pageData, categoriesData]);

  const onSubmit = async (data: ServicesConfigFormData) => {
    if (!firestore || !pageRef || !categoriesRef) return;

    setDocumentNonBlocking(pageRef, { title: data.title }, { merge: true });

    const categoryIds: string[] = [];
    const currentCategoryIds = (categoriesData || []).map(c => c.id);
    
    for (const category of data.categories) {
      const categoryPayload = { title: category.title, items: category.items };
      if (category.id) {
        const categoryRef = doc(categoriesRef, category.id);
        setDocumentNonBlocking(categoryRef, categoryPayload, { merge: true });
        categoryIds.push(category.id);
      } else {
        const newDocRef = await addDocumentNonBlocking(categoriesRef, categoryPayload);
        if (newDocRef) {
          categoryIds.push(newDocRef.id);
        }
      }
    }
    
    const removedCategories = currentCategoryIds.filter(id => !categoryIds.includes(id));
    for(const id of removedCategories) {
        deleteDocumentNonBlocking(doc(categoriesRef, id));
    }

    setDocumentNonBlocking(pageRef, { categoryIds }, { merge: true });

    toast({
      title: 'Services Page Content Saved',
      description: 'Your changes have been successfully saved.',
    });
  };

  if (isLoadingPage || isLoadingCategories) {
    return <ServicesConfigSkeleton />;
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Services Page Title</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Categories</CardTitle>
            <CardDescription>Manage the categories and items displayed on the services page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-muted/30">
                <div className="flex justify-end mb-2">
                  <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <FormField control={form.control} name={`categories.${index}.title`} render={({ field }) => ( <FormItem> <FormLabel>Category Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                
                <div className="space-y-4 pt-4">
                  <FormLabel>Service Items</FormLabel>
                   <CategoryItems control={control} categoryIndex={index} />
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ title: '', items: [] })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Category
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
              {form.formState.isSubmitting ? 'Saving...' : 'Save Services Page'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

// This is a helper component to manage nested useFieldArray correctly.
function CategoryItems({ control, categoryIndex }: {control: any, categoryIndex: number}) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `categories.${categoryIndex}.items`
    });

    return (
        <div className="space-y-2">
          {fields.map((item, itemIndex) => (
            <div key={item.id} className="flex items-center gap-2">
              <FormField
                control={control}
                name={`categories.${categoryIndex}.items.${itemIndex}`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Textarea {...field} rows={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button variant="ghost" size="icon" type="button" onClick={() => remove(itemIndex)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
           <Button type="button" variant="outline" size="sm" onClick={() => append('')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
    );
}
