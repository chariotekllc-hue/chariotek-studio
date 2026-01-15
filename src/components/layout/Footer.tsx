'use client';
import Link from 'next/link';
import { Github, Linkedin, Twitter, Lock } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useIsAdmin } from '@/hooks/use-is-admin';
import siteConfig from '@/content/site.json';

const legalLinks = [
  { name: 'Terms', href: '/legal' },
  { name: 'Privacy', href: '/legal' },
  { name: 'Disclaimer', href: '/legal' },
];

export default function Footer() {
  const firestore = useFirestore();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const socialsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'sites/singleton/socials/singleton') : null), [firestore]);
  const footerRef = useMemoFirebase(() => (firestore ? doc(firestore, 'sites/singleton/footer/singleton') : null), [firestore]);

  const { data: socialsData } = useDoc(socialsRef);
  const { data: footerData } = useDoc(footerRef);

  const copyright = footerData?.copyright || siteConfig.footer.copyright;
  const governingLaw = footerData?.governingLaw || siteConfig.footer.governingLaw;

  // Filter out empty social links
  const socials = [
    { name: 'Twitter', href: socialsData?.twitter || siteConfig.socials.twitter, icon: Twitter },
    { name: 'GitHub', href: socialsData?.github || siteConfig.socials.github, icon: Github },
    { name: 'LinkedIn', href: socialsData?.linkedin || siteConfig.socials.linkedin, icon: Linkedin },
  ].filter(social => social.href && social.href.trim() !== '');

  return (
    <footer className="
      bg-background 
      border-t border-border
    ">
      <div className="container mx-auto px-6 md:px-8 py-12 md:py-16">
        {/* Main Footer Content - Apple-style: Centered, symmetric */}
        <div className="
          flex flex-col 
          items-center 
          gap-8 md:gap-12
          mb-12 md:mb-16
        ">
          {/* Social Links - Centered, symmetric spacing */}
          {socials.length > 0 && (
            <div className="flex items-center gap-6">
              {socials.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    text-muted-foreground
                    transition-all duration-300
                    hover:text-foreground
                    active:scale-95
                  "
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5 md:h-6 md:w-6" />
                </Link>
              ))}
            </div>
          )}

          {/* Copyright - Centered */}
          <p className="
            text-sm md:text-base
            text-muted-foreground
            text-center
            max-w-content
          ">
            {copyright}
          </p>
        </div>

        {/* Legal Links & Info - Apple-style: Centered, minimal */}
        <div className="
          border-t border-border
          pt-8 md:pt-12
          flex flex-col
          items-center
          gap-4 md:gap-6
        ">
          {/* Legal Links - Centered, symmetric spacing */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="
                  text-xs md:text-sm
                  text-muted-foreground
                  transition-colors duration-300
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
            {governingLaw && (
              <span className="text-xs md:text-sm text-muted-foreground">
                Governing Law: {governingLaw}
              </span>
            )}
          </div>

          {/* Admin Link - Always visible but subtle */}
          <Link
            href="/admin"
            className="
              inline-flex items-center gap-1.5
              text-xs
              text-muted-foreground/40
              transition-all duration-300
              hover:text-muted-foreground
              group
            "
          >
            <Lock className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            <span>{!isAdminLoading && isAdmin ? 'Admin Panel' : 'Admin Login'}</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
