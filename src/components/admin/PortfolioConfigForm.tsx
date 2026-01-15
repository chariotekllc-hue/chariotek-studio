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
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useMemoFirebase,
  WithId,
} from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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

const projectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required.'),
  domain: z.string().min(1, 'Domain is required.'),
  status: z.string().min(1, 'Status is required.'),
  description: z.string().min(1, 'Description is required.'),
});

const portfolioConfigSchema = z.object({
  title: z.string().min(1, 'Page title is required.'),
  subtitle: z.string().optional(),
  disclaimer: z.string().optional(),
  projects: z.array(projectSchema),
});

type PortfolioConfigFormData = z.infer<typeof portfolioConfigSchema>;

function PortfolioConfigSkeleton() {
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

export function PortfolioConfigForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const pageRef = useMemoFirebase(() => (firestore ? doc(firestore, 'portfolio_page', 'singleton') : null), [firestore]);
  const projectsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'portfolio_projects') : null), [firestore]);
  
  const { data: pageData, isLoading: isLoadingPage } = useDoc(pageRef);
  const { data: projectsData, isLoading: isLoadingProjects } = useCollection(projectsRef);

  const form = useForm<PortfolioConfigFormData>({
    resolver: zodResolver(portfolioConfigSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      disclaimer: '',
      projects: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'projects',
  });

  useEffect(() => {
    // Allow form to populate even if projects are empty - enables editing
    const hasAnyData = pageData !== undefined || projectsData !== undefined;

    if (hasAnyData) {
      const orderedProjects = pageData && projectsData
        ? (pageData.projectIds || [])
            .map((id: string) => projectsData.find((p: any) => p.id === id))
            .filter(Boolean) as WithId<z.infer<typeof projectSchema>>[]
        : [];
        
      form.reset({
        title: pageData?.title || '',
        subtitle: pageData?.subtitle || '',
        disclaimer: pageData?.disclaimer || '',
        projects: orderedProjects.map(p => ({ ...p, id: p.id || uuidv4() })),
      });
    }
  }, [pageData, projectsData]);

  const onSubmit = async (data: PortfolioConfigFormData) => {
    if (!firestore || !pageRef || !projectsRef) return;

    const projectIds: string[] = [];
    const existingProjectIds = (projectsData || []).map(p => p.id);

    for (const project of data.projects) {
        const projectId = project.id || uuidv4();
        const projectRef = doc(projectsRef, projectId);
        const payload = { 
            title: project.title,
            domain: project.domain,
            status: project.status,
            description: project.description
        };
        setDocumentNonBlocking(projectRef, payload, { merge: true });
        projectIds.push(projectId);
    }

    const removedProjectIds = existingProjectIds.filter(id => !projectIds.includes(id));
    for (const id of removedProjectIds) {
        deleteDocumentNonBlocking(doc(projectsRef, id));
    }

    const pagePayload = {
        title: data.title,
        subtitle: data.subtitle,
        disclaimer: data.disclaimer,
        projectIds: projectIds,
    };
    setDocumentNonBlocking(pageRef, pagePayload, { merge: true });

    toast({
      title: 'Portfolio Page Content Saved',
      description: 'Your changes have been successfully saved.',
    });
  };

  const isLoading = isLoadingPage || isLoadingProjects;

  if (isLoading) {
    return <PortfolioConfigSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Portfolio Page Header</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="subtitle" render={({ field }) => ( <FormItem> <FormLabel>Subtitle</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
             <FormField control={form.control} name="disclaimer" render={({ field }) => ( <FormItem> <FormLabel>Disclaimer</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-muted/30">
                <div className="flex justify-end mb-2">
                  <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <FormField control={form.control} name={`projects.${index}.title`} render={({ field }) => ( <FormItem> <FormLabel>Project Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name={`projects.${index}.domain`} render={({ field }) => ( <FormItem> <FormLabel>Domain</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name={`projects.${index}.status`} render={({ field }) => ( <FormItem> <FormLabel>Status</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </div>
                <FormField control={form.control} name={`projects.${index}.description`} render={({ field }) => ( <FormItem className="mt-4"> <FormLabel>Description</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </Card>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ id: uuidv4(), title: '', domain: '', status: '', description: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Project
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
              {form.formState.isSubmitting ? 'Saving...' : 'Save Portfolio Page'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
