'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Menu, Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useIsAdmin } from '@/hooks/use-is-admin';
import siteConfig from '@/content/site.json';

const navLinks = [
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Consulting', href: '/consulting' },
  { name: 'Training', href: '/training' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Tools', href: '/tools' },
];

export default function Header() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const siteRef = useMemoFirebase(() => (firestore ? doc(firestore, 'sites', 'singleton') : null), [firestore]);
  const { data: siteData } = useDoc(siteRef);

  const companyName = siteData?.companyName || siteConfig.companyName;
  const logoUrl = siteData?.logo || siteConfig.logo;
  const logoImage = PlaceHolderImages.find(p => p.id === logoUrl);

  return (
    <header className="
      sticky top-0 z-50 
      w-full 
      border-b border-border 
      bg-background/80 
      backdrop-blur-xl
      supports-[backdrop-filter]:bg-background/60
    ">
      <div className="container mx-auto px-6 md:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo & Company Name - Apple-style: Proper spacing, aligned */}
          <Link 
            href="/" 
            className="
              flex items-center 
              gap-2
              transition-opacity duration-300
              hover:opacity-80
              active:opacity-70
            "
          >
            {(logoImage || logoUrl) && (
              <div className="relative h-10 w-10 md:h-12 md:w-12 flex-shrink-0 aspect-square">
                <Image
                  src={logoImage?.imageUrl || logoUrl}
                  alt={`${companyName} Logo`}
                  fill
                  priority
                  data-ai-hint={logoImage?.imageHint}
                  className="object-contain"
                  unoptimized={!logoImage}
                />
              </div>
            )}
            <span className="
              font-headline 
              text-lg md:text-xl lg:text-2xl 
              font-semibold 
              text-foreground
              tracking-[-0.01em]
              whitespace-nowrap
            ">
              {companyName}
            </span>
          </Link>

          {/* Desktop Navigation - Centered, symmetric spacing */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.name}
                href={link.href}
                className="
                  text-sm 
                  font-medium 
                  text-foreground/70 
                  transition-all duration-300
                  hover:text-foreground
                  relative
                  after:absolute
                  after:bottom-0
                  after:left-0
                  after:w-0
                  after:h-[1px]
                  after:bg-foreground
                  after:transition-all
                  after:duration-300
                  hover:after:w-full
                "
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions - Theme toggle, Admin, Contact, Mobile menu */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Theme Toggle - Single push button */}
            <ThemeToggle />
            
            {/* Admin Badge - Only visible to admins */}
            {!isAdminLoading && isAdmin && (
              <Button 
                asChild 
                variant="outline" 
                size="sm"
                className="
                  hidden md:flex
                  rounded-full
                  px-4 py-2
                  text-sm font-medium
                  transition-all duration-300
                  active:scale-95
                  border-accent/20
                  hover:border-accent
                  hover:bg-accent/10
                "
              >
                <Link href="/admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </Button>
            )}
            
            {/* Contact Button - Desktop only */}
            <Button 
              asChild 
              variant="default" 
              size="sm"
              className="
                hidden md:flex
                rounded-full
                px-6 py-2
                text-sm font-medium
                transition-all duration-300
                active:scale-95
              "
            >
              <Link href="/contact">Contact</Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="
                    lg:hidden
                    h-9 w-9
                    rounded-full
                    transition-all duration-300
                    hover:bg-muted
                    active:scale-95
                  "
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  {/* Mobile Logo & Name */}
                  <Link 
                    href="/" 
                    className="flex items-center gap-2 mb-8 pb-6 border-b border-border"
                  >
                    {(logoImage || logoUrl) && (
                      <div className="relative h-12 w-12 flex-shrink-0 aspect-square">
                        <Image
                          src={logoImage?.imageUrl || logoUrl}
                          alt={`${companyName} Logo`}
                          fill
                          priority
                          data-ai-hint={logoImage?.imageHint}
                          className="object-contain"
                          unoptimized={!logoImage}
                        />
                      </div>
                    )}
                    <span className="
                      font-headline 
                      text-xl 
                      font-semibold 
                      text-foreground
                      tracking-[-0.01em]
                    ">
                      {companyName}
                    </span>
                  </Link>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col gap-2 flex-grow">
                    {navLinks.map(link => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="
                          text-base 
                          font-medium 
                          text-foreground/70 
                          transition-colors duration-300
                          hover:text-foreground
                          py-2
                        "
                      >
                        {link.name}
                      </Link>
                    ))}
                    {/* Mobile Admin Link - Only visible to admins */}
                    {!isAdminLoading && isAdmin && (
                      <Link
                        href="/admin"
                        className="
                          text-base 
                          font-medium 
                          text-foreground/70 
                          transition-colors duration-300
                          hover:text-foreground
                          py-2
                          flex items-center gap-2
                        "
                      >
                        <Shield className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                  </nav>

                  {/* Mobile Contact Button */}
                  <Button 
                    asChild 
                    variant="default" 
                    className="
                      mt-auto
                      rounded-full
                      w-full
                      transition-all duration-300
                      active:scale-95
                    "
                  >
                    <Link href="/contact">Contact</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
