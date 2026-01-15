'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc } from 'firebase/firestore';
import {
  useFirestore,
  useDoc,
  setDocumentNonBlocking,
  useMemoFirebase,
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
import { Textarea } from '../ui/textarea';

const legalConfigSchema = z.object({
  terms: z.string().min(1, 'Terms of service is required.'),
  privacy: z.string().min(1, 'Privacy policy is required.'),
  disclaimer: z.string().min(1, 'Disclaimer is required.'),
});

type LegalConfigFormData = z.infer<typeof legalConfigSchema>;

function LegalConfigSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  );
}

export function LegalConfigForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const legalRef = useMemoFirebase(() => (firestore ? doc(firestore, 'legals', 'singleton') : null), [firestore]);
  const { data: legalData, isLoading: isLoadingLegal } = useDoc(legalRef);

  const form = useForm<LegalConfigFormData>({
    resolver: zodResolver(legalConfigSchema),
    defaultValues: {
      terms: '',
      privacy: '',
      disclaimer: '',
    },
  });

  useEffect(() => {
    if (legalData !== undefined) {
      form.reset({
        terms: legalData?.terms || '',
        privacy: legalData?.privacy || '',
        disclaimer: legalData?.disclaimer || '',
      });
    }
  }, [legalData]);

  const onSubmit = (data: LegalConfigFormData) => {
    if (!legalRef) return;

    setDocumentNonBlocking(legalRef, data, { merge: true });

    toast({
      title: 'Legal Information Saved',
      description: 'Your changes have been successfully saved.',
    });
  };

  if (isLoadingLegal) {
    return <LegalConfigSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
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
              Legal Information
            </CardTitle>
            <CardDescription className="
              text-base 
              text-muted-foreground
              mt-2
            ">
              Manage the legal text for your website.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="privacy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Policy</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="disclaimer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disclaimer</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
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
              {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
