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

const valueSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required.'),
  desc: z.string().min(1, 'Description is required.'),
});

const aboutConfigSchema = z.object({
  heroTitle: z.string().min(1, 'Hero title is required.'),
  heroSubtitle: z.string().optional(),
  heroBackground: z.string().url('Invalid URL.').optional(),
  missionTitle: z.string().min(1, 'Mission title is required.'),
  missionContent: z.string().min(1, 'Mission content is required.'),
  visionTitle: z.string().min(1, 'Vision title is required.'),
  visionContent: z.string().min(1, 'Vision content is required.'),
  teamTitle: z.string().min(1, 'Team title is required.'),
  teamContent: z.string().min(1, 'Team content is required.'),
  valuesTitle: z.string().min(1, 'Values section title is required.'),
  valuesDescription: z.string().optional(),
  values: z.array(valueSchema).optional(),
});

type AboutConfigFormData = z.infer<typeof aboutConfigSchema>;

function AboutConfigSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AboutConfigForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

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
    () => (firestore ? doc(firestore, 'about/singleton/values_section/singleton') : null),
    [firestore]
  );
  const valuesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'about_values') : null),
    [firestore]
  );

  // Data fetching
  const { data: heroData, isLoading: isLoadingHero } = useDoc(heroRef);
  const { data: missionData, isLoading: isLoadingMission } = useDoc(missionRef);
  const { data: visionData, isLoading: isLoadingVision } = useDoc(visionRef);
  const { data: teamData, isLoading: isLoadingTeam } = useDoc(teamRef);
  const { data: valuesSectionData, isLoading: isLoadingValuesSection } = useDoc(valuesSectionRef);
  const { data: valuesCollectionData, isLoading: isLoadingValues } = useCollection(valuesCollectionRef);

  const [valueDocs, setValueDocs] = useState<WithId<z.infer<typeof valueSchema>>[]>([]);

  const form = useForm<AboutConfigFormData>({
    resolver: zodResolver(aboutConfigSchema),
    defaultValues: {
      heroTitle: '',
      heroSubtitle: '',
      heroBackground: '',
      missionTitle: '',
      missionContent: '',
      visionTitle: '',
      visionContent: '',
      teamTitle: '',
      teamContent: '',
      valuesTitle: '',
      valuesDescription: '',
      values: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'values',
  });

  useEffect(() => {
    if (valuesCollectionData) {
      setValueDocs(valuesCollectionData);
    }
  }, [valuesCollectionData]);

  useEffect(() => {
    // Allow form to populate even if some data is missing - enables editing
    // Only reset if at least one piece of data has been loaded (not initial undefined state)
    const hasAnyData = heroData !== undefined || missionData !== undefined || 
                       visionData !== undefined || teamData !== undefined || 
                       valuesSectionData !== undefined || valueDocs.length > 0;

    if (hasAnyData) {
        const aboutPageValues = valuesSectionData && valueDocs.length > 0
          ? (valuesSectionData.valueIds || [])
              .map((id: string) => valueDocs.find(d => d.id === id))
              .filter(Boolean)
          : [];

      form.reset({
        heroTitle: heroData?.title || '',
        heroSubtitle: heroData?.subtitle || '',
        heroBackground: heroData?.background || '',
        missionTitle: missionData?.title || '',
        missionContent: missionData?.content || '',
        visionTitle: visionData?.title || '',
        visionContent: visionData?.content || '',
        teamTitle: teamData?.title || '',
        teamContent: teamData?.content || '',
        valuesTitle: valuesSectionData?.title || '',
        valuesDescription: valuesSectionData?.description || '',
        values: aboutPageValues,
      });
    }
  }, [
    heroData,
    missionData,
    visionData,
    teamData,
    valuesSectionData,
    valueDocs,
    // Removed 'form' from dependencies to prevent unnecessary re-renders
  ]);

  const onSubmit = async (data: AboutConfigFormData) => {
    if (!firestore || !heroRef || !missionRef || !visionRef || !teamRef || !valuesSectionRef || !valuesCollectionRef) return;

    // Update singleton documents
    setDocumentNonBlocking(heroRef, { title: data.heroTitle, subtitle: data.heroSubtitle, background: data.heroBackground }, { merge: true });
    setDocumentNonBlocking(missionRef, { title: data.missionTitle, content: data.missionContent }, { merge: true });
    setDocumentNonBlocking(visionRef, { title: data.visionTitle, content: data.visionContent }, { merge: true });
    setDocumentNonBlocking(teamRef, { title: data.teamTitle, content: data.teamContent }, { merge: true });

    // Update values
    const valueIds: string[] = [];
    for (const value of data.values || []) {
        if (value.id) {
            const valueRef = doc(valuesCollectionRef, value.id);
            setDocumentNonBlocking(valueRef, { title: value.title, desc: value.desc }, { merge: true });
            valueIds.push(value.id);
        } else {
            const newDocRef = await addDocumentNonBlocking(valuesCollectionRef, { title: value.title, desc: value.desc });
            if (newDocRef) {
                valueIds.push(newDocRef.id);
            }
        }
    }
    
    const existingValueIds = valueDocs.map(d => d.id);
    const removedValues = existingValueIds.filter(id => !valueIds.includes(id));
    for (const id of removedValues) {
        deleteDocumentNonBlocking(doc(valuesCollectionRef, id));
    }

    setDocumentNonBlocking(valuesSectionRef, { title: data.valuesTitle, description: data.valuesDescription, valueIds }, { merge: true });

    toast({
      title: 'About Page Content Saved',
      description: 'Your changes have been successfully saved.',
    });
  };

  const handleRemoveValue = (index: number) => {
    const valueToRemove = fields[index];
    if (valueToRemove.id) {
        deleteDocumentNonBlocking(doc(valuesCollectionRef, valueToRemove.id));
    }
    remove(index);
  }

  const isLoading =
    isLoadingHero ||
    isLoadingMission ||
    isLoadingVision ||
    isLoadingTeam ||
    isLoadingValuesSection ||
    isLoadingValues;

  if (isLoading) {
    return <AboutConfigSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="heroTitle" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="heroSubtitle" render={({ field }) => ( <FormItem> <FormLabel>Subtitle</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="heroBackground" render={({ field }) => ( <FormItem> <FormLabel>Background Image URL</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mission & Vision</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <FormField control={form.control} name="missionTitle" render={({ field }) => ( <FormItem> <FormLabel>Mission Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="missionContent" render={({ field }) => ( <FormItem> <FormLabel>Mission Statement</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
            <div className="space-y-4">
              <FormField control={form.control} name="visionTitle" render={({ field }) => ( <FormItem> <FormLabel>Vision/Approach Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="visionContent" render={({ field }) => ( <FormItem> <FormLabel>Vision/Approach Statement</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Team Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="teamTitle" render={({ field }) => ( <FormItem> <FormLabel>Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="teamContent" render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Core Values</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="valuesTitle" render={({ field }) => ( <FormItem> <FormLabel>Section Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="valuesDescription" render={({ field }) => ( <FormItem> <FormLabel>Section Description</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                
                <div className="space-y-4 pt-4">
                  <FormLabel>Values List</FormLabel>
                   {fields.map((field, index) => (
                    <Card key={field.id} className="p-4 bg-muted/30">
                        <div className="flex justify-end mb-2">
                            <Button variant="ghost" size="icon" type="button" onClick={() => handleRemoveValue(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                        <FormField control={form.control} name={`values.${index}.title`} render={({ field }) => ( <FormItem> <FormLabel>Value Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name={`values.${index}.desc`} render={({ field }) => ( <FormItem className="mt-2"> <FormLabel>Value Description</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    </Card>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ title: '', desc: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Value
                    </Button>
                </div>
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
                  {form.formState.isSubmitting ? 'Saving...' : 'Save About Page'}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
