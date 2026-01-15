'use client';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';

const capabilitySchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required.'),
  items: z.array(z.string().min(1, 'Item cannot be empty.')),
});

const toolsConfigSchema = z.object({
  title: z.string().min(1, 'Page title is required.'),
  capabilities: z.array(capabilitySchema),
  philosophyTitle: z.string().min(1, 'Philosophy title is required.'),
  philosophyDescription: z.string().min(1, 'Philosophy description is required.'),
});

type ToolsConfigFormData = z.infer<typeof toolsConfigSchema>;

function ToolsConfigSkeleton() {
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

export function ToolsConfigForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const pageRef = useMemoFirebase(() => (firestore ? doc(firestore, 'tools_page', 'singleton') : null), [firestore]);
  const { data: pageData, isLoading: isLoadingPage } = useDoc(pageRef);

  const form = useForm<ToolsConfigFormData>({
    resolver: zodResolver(toolsConfigSchema),
    defaultValues: {
      title: '',
      capabilities: [],
      philosophyTitle: '',
      philosophyDescription: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'capabilities',
  });

  useEffect(() => {
    if (pageData !== undefined) {
      form.reset({
        title: pageData?.title || '',
        capabilities: pageData?.capabilities || [],
        philosophyTitle: pageData?.philosophy?.title || '',
        philosophyDescription: pageData?.philosophy?.description || '',
      });
    }
  }, [pageData]);

  const onSubmit = (data: ToolsConfigFormData) => {
    if (!pageRef) return;

    const payload = {
      title: data.title,
      capabilities: data.capabilities.map(c => ({...c, id: c.id || uuidv4()})),
      philosophy: {
        title: data.philosophyTitle,
        description: data.philosophyDescription,
      },
    };
    
    setDocumentNonBlocking(pageRef, payload, { merge: true });

    toast({
      title: 'Tools Page Content Saved',
      description: 'Your changes have been successfully saved.',
    });
  };

  if (isLoadingPage) {
    return <ToolsConfigSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Tools Page Header</CardTitle></CardHeader>
          <CardContent>
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Capabilities</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-muted/30">
                <div className="flex justify-end mb-2">
                  <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <FormField control={form.control} name={`capabilities.${index}.id`} render={({ field }) => ( <FormItem> <FormLabel>ID (engineering, software, methodology)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name={`capabilities.${index}.title`} render={({ field }) => ( <FormItem className="mt-2"> <FormLabel>Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <CapabilityItems control={form.control} capabilityIndex={index} />
              </Card>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ id: uuidv4(), title: '', items: [] })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Capability
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Tooling Philosophy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="philosophyTitle" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="philosophyDescription" render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
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
              {form.formState.isSubmitting ? 'Saving...' : 'Save Tools Page'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}


function CapabilityItems({ control, capabilityIndex }: { control: any; capabilityIndex: number }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `capabilities.${capabilityIndex}.items`,
  });

  return (
    <div className="space-y-2 pt-4">
      <FormLabel>Items</FormLabel>
      {fields.map((item, itemIndex) => (
        <div key={item.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`capabilities.${capabilityIndex}.items.${itemIndex}`}
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
        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
      </Button>
    </div>
  );
}
