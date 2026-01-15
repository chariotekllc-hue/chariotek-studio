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
  CardFooter
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
import { Textarea } from '../ui/textarea';
import { LogoUpload } from './LogoUpload';
import { Separator } from '@/components/ui/separator';

// --- Schemas for each form ---
const identitySchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  tagline: z.string().optional(),
  email: z.string().email('Invalid email address.'),
  logo: z.string().optional(),
});

const socialsSchema = z.object({
  linkedin: z.string().url('Invalid URL.').optional(),
  github: z.string().url('Invalid URL.').optional(),
  twitter: z.string().url('Invalid URL.').optional(),
});

const footerSchema = z.object({
  copyright: z.string().min(1, 'Copyright is required.'),
  governingLaw: z.string().min(1, 'Governing law is required.'),
});


type IdentityFormData = z.infer<typeof identitySchema>;
type SocialsFormData = z.infer<typeof socialsSchema>;
type FooterFormData = z.infer<typeof footerSchema>;


function SiteConfigSkeleton() {
    return (
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
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
    )
}


export function SiteConfigForm() {
  const firestore = useFirestore();
  const { toast } = useToast();

  // --- Firestore References ---
  const siteRef = useMemoFirebase(() => firestore ? doc(firestore, 'sites', 'singleton') : null, [firestore]);
  const socialsRef = useMemoFirebase(() => firestore ? doc(firestore, 'sites/singleton/socials/singleton') : null, [firestore]);
  const footerRef = useMemoFirebase(() => firestore ? doc(firestore, 'sites/singleton/footer/singleton') : null, [firestore]);

  // --- Data Fetching ---
  const { data: siteData, isLoading: isLoadingSite } = useDoc(siteRef);
  const { data: socialsData, isLoading: isLoadingSocials } = useDoc(socialsRef);
  const { data: footerData, isLoading: isLoadingFooter } = useDoc(footerRef);

  // --- Forms ---
  const identityForm = useForm<IdentityFormData>({
    resolver: zodResolver(identitySchema),
    defaultValues: { companyName: '', tagline: '', email: '', logo: '' },
  });
  const socialsForm = useForm<SocialsFormData>({
    resolver: zodResolver(socialsSchema),
    defaultValues: { linkedin: '', github: '', twitter: '' },
  });
  const footerForm = useForm<FooterFormData>({
    resolver: zodResolver(footerSchema),
    defaultValues: { copyright: '', governingLaw: '' },
  });

  // --- Effects to populate forms ---
  useEffect(() => {
    if (siteData !== undefined) {
      identityForm.reset({
        companyName: siteData?.companyName || '',
        tagline: siteData?.tagline || '',
        email: siteData?.email || '',
        logo: siteData?.logo || '',
      });
    }
  }, [siteData]);
  
  useEffect(() => {
    if (socialsData !== undefined) {
      socialsForm.reset({
        linkedin: socialsData?.linkedin || '',
        github: socialsData?.github || '',
        twitter: socialsData?.twitter || '',
      });
    }
  }, [socialsData]);

  useEffect(() => {
    if (footerData !== undefined) {
      footerForm.reset({
        copyright: footerData?.copyright || '',
        governingLaw: footerData?.governingLaw || '',
      });
    }
  }, [footerData]);


  // --- Submit Handlers ---
  const onIdentitySubmit = (data: IdentityFormData) => {
    if (!siteRef) return;
    setDocumentNonBlocking(siteRef, data, { merge: true });
    toast({ title: "Company Identity Saved" });
  };
  
  const onSocialsSubmit = (data: SocialsFormData) => {
    if (!socialsRef) return;
    setDocumentNonBlocking(socialsRef, data, { merge: true });
    toast({ title: "Social Media Links Saved" });
  };

  const onFooterSubmit = (data: FooterFormData) => {
    if (!footerRef) return;
    setDocumentNonBlocking(footerRef, data, { merge: true });
    toast({ title: "Footer Information Saved" });
  };

  // --- Loading State ---
  if (isLoadingSite || isLoadingSocials || isLoadingFooter) {
    return <SiteConfigSkeleton />;
  }

  return (
    <div className="space-y-8">
        {/* Company Identity Form */}
        <Form {...identityForm}>
            <form onSubmit={identityForm.handleSubmit(onIdentitySubmit)}>
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
                            Company Identity
                        </CardTitle>
                        <CardDescription className="
                            text-base 
                            text-muted-foreground
                            mt-2
                        ">
                            Manage your main company details and logo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField 
                            control={identityForm.control} 
                            name="companyName" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-medium">Company Name</FormLabel>
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
                            control={identityForm.control} 
                            name="tagline" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-medium">Tagline</FormLabel>
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
                            control={identityForm.control} 
                            name="email" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-medium">Contact Email</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            type="email"
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
                        <Separator className="my-6" />
                        
                        {/* Logo Upload Section */}
                        <LogoUpload
                            currentLogoUrl={identityForm.watch('logo')}
                            onUploadComplete={(url) => {
                                identityForm.setValue('logo', url, { shouldDirty: true });
                            }}
                            onUploadError={(error) => {
                                toast({ 
                                    title: "Upload Failed", 
                                    description: error,
                                    variant: "destructive"
                                });
                            }}
                        />
                        
                        {/* Hidden field for form state */}
                        <FormField 
                            control={identityForm.control} 
                            name="logo" 
                            render={({ field }) => (
                                <input type="hidden" {...field} />
                            )} 
                        />
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button 
                            type="submit" 
                            disabled={identityForm.formState.isSubmitting}
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
                            {identityForm.formState.isSubmitting ? 'Saving...' : 'Save Identity'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
        
        {/* Socials Form */}
        <Form {...socialsForm}>
             <form onSubmit={socialsForm.handleSubmit(onSocialsSubmit)}>
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
                            Social Media Links
                        </CardTitle>
                        <CardDescription className="
                            text-base 
                            text-muted-foreground
                            mt-2
                        ">
                            Update URLs for your social profiles.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField 
                            control={socialsForm.control} 
                            name="linkedin" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-medium">LinkedIn URL</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            type="url"
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
                            control={socialsForm.control} 
                            name="github" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-medium">GitHub URL</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            type="url"
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
                            control={socialsForm.control} 
                            name="twitter" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-medium">Twitter/X URL</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            type="url"
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
                    <CardFooter className="pt-6">
                        <Button 
                            type="submit" 
                            disabled={socialsForm.formState.isSubmitting}
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
                            {socialsForm.formState.isSubmitting ? 'Saving...' : 'Save Socials'}
                        </Button>
                    </CardFooter>
                </Card>
             </form>
        </Form>

        {/* Footer Form */}
        <Form {...footerForm}>
            <form onSubmit={footerForm.handleSubmit(onFooterSubmit)}>
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
                            Footer Configuration
                        </CardTitle>
                        <CardDescription className="
                            text-base 
                            text-muted-foreground
                            mt-2
                        ">
                            Manage the legal text and copyright in the site footer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField 
                            control={footerForm.control} 
                            name="copyright" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-medium">Copyright Statement</FormLabel>
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
                            control={footerForm.control} 
                            name="governingLaw" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-medium">Governing Law</FormLabel>
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
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button 
                            type="submit" 
                            disabled={footerForm.formState.isSubmitting}
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
                            {footerForm.formState.isSubmitting ? 'Saving...' : 'Save Footer'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    </div>
  );
}
