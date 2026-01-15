'use client';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import siteConfig from '@/content/site.json';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

function LegalPageSkeleton() {
    return (
        <div className="bg-background text-foreground">
          <div className="container mx-auto px-4 py-20">
            <Skeleton className="h-10 w-1/2 mx-auto mb-12" />
            <div className="max-w-4xl mx-auto space-y-12">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-8 w-1/3 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
}

export default function LegalPage() {
  const firestore = useFirestore();
  const legalRef = useMemoFirebase(() => (firestore ? doc(firestore, 'legals', 'singleton') : null), [firestore]);
  const { data: legalData, isLoading } = useDoc(legalRef);
  const siteFooterRef = useMemoFirebase(() => firestore ? doc(firestore, 'sites/singleton/footer/singleton') : null, [firestore]);
  const { data: footerData, isLoading: isLoadingFooter } = useDoc(siteFooterRef);

  if (isLoading || isLoadingFooter) {
    return <LegalPageSkeleton />;
  }

  // Default content structure
  const defaultContent = {
    intro: "Welcome to the website of Chariotek LLC (\"Company,\" \"we,\" \"our,\" or \"us\"). By accessing or using this website, you agree to comply with and be bound by the following Terms and Conditions. If you do not agree, please discontinue use of this website.",
    terms: {
      useOfWebsite: {
        description: "This website is provided for informational purposes only. You may use the website solely for lawful purposes and in accordance with these Terms.",
        restrictions: [
          "Use the website in any way that violates applicable laws or regulations",
          "Attempt to gain unauthorized access to any part of the website",
          "Misuse or interfere with the website's functionality"
        ]
      },
      services: "Chariotek LLC provides research, development, consulting, training, and educational services in engineering and technology-related fields. All services are subject to separate agreements, scopes of work, or written confirmations. No service, information, or communication on this website constitutes a binding offer unless explicitly stated in a signed agreement.",
      intellectualProperty: "All content on this website, including text, graphics, logos, and designs, is the property of Chariotek LLC or its licensors and is protected by applicable intellectual property laws. Unauthorized use is prohibited.",
      limitationOfLiability: "To the maximum extent permitted by law, Chariotek LLC shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from the use of or inability to use this website or any information provided herein."
    },
    privacy: {
      intro: "Chariotek LLC respects your privacy and is committed to protecting it.",
      informationWeCollect: {
        description: "We may collect limited personal information such as:",
        items: ["Name", "Email address", "Information voluntarily submitted through contact forms or communications"],
        note: "We do not collect sensitive personal data unless explicitly provided by you."
      },
      useOfInformation: {
        description: "Information collected is used solely for:",
        items: ["Responding to inquiries", "Communicating about services", "Improving website functionality"],
        note: "We do not sell, rent, or trade personal information to third parties."
      },
      cookies: "This website may use basic cookies or privacy-respecting analytics tools to improve performance and user experience. You may disable cookies through your browser settings.",
      dataSecurity: "Reasonable measures are taken to protect personal information; however, no method of transmission over the internet is completely secure."
    },
    disclaimer: {
      noProfessionalAdvice: "Information on this website is provided for general informational purposes only and does not constitute legal, financial, medical, or other regulated professional advice.",
      noGuarantees: {
        description: "Chariotek LLC makes no guarantees regarding outcomes, results, performance, or success related to:",
        items: ["Consulting services", "Training programs", "Educational content", "Career guidance"],
        note: "Any results depend on multiple factors beyond the Company's control."
      },
      trainingEducation: "Participation in training or educational services does not guarantee employment, certification, promotion, or job placement.",
      thirdPartyLinks: "This website may contain links to third-party websites. Chariotek LLC is not responsible for the content, policies, or practices of third-party sites."
    },
    governingLaw: "These Terms shall be governed by and construed in accordance with the laws of the United States of America, without regard to conflict-of-law principles.",
    companyInfo: {
      name: "Chariotek LLC",
      location: "United States",
      contactNote: "For questions regarding this Legal Information, please contact us via the Contact page."
    },
    updates: "Chariotek LLC reserves the right to update or modify this Legal Information at any time without prior notice. Continued use of the website constitutes acceptance of any changes."
  };

  // Use Firestore data if available, otherwise use defaults
  const content = legalData || defaultContent;

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-6 md:px-8 py-32 md:py-40 lg:py-48">
        {/* Hero Section - Centered, symmetric */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-[-0.01em]">
            Legal Information
          </h1>
          {content.intro && (
            <p className="max-w-content mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
              {content.intro}
            </p>
          )}
        </div>

        {/* Content Sections - Well-structured, readable */}
        <div className="max-w-4xl mx-auto space-y-16">
          {/* 1. Terms and Conditions */}
          <section>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 border-b border-border pb-4 tracking-[-0.005em]">
              1. Terms and Conditions
            </h2>
            <div className="space-y-8">
              {/* Use of Website */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  Use of Website
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
                  {content.terms?.useOfWebsite?.description || defaultContent.terms.useOfWebsite.description}
                </p>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-3 font-medium">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {(content.terms?.useOfWebsite?.restrictions || defaultContent.terms.useOfWebsite.restrictions).map((item: string, index: number) => (
                    <li key={index} className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  Services
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.terms?.services || defaultContent.terms.services}
                </p>
              </div>

              {/* Intellectual Property */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  Intellectual Property
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.terms?.intellectualProperty || defaultContent.terms.intellectualProperty}
                </p>
              </div>

              {/* Limitation of Liability */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  Limitation of Liability
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.terms?.limitationOfLiability || defaultContent.terms.limitationOfLiability}
                </p>
              </div>
            </div>
          </section>

          {/* 2. Privacy Policy */}
          <section>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 border-b border-border pb-4 tracking-[-0.005em]">
              2. Privacy Policy
            </h2>
            <div className="space-y-8">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {content.privacy?.intro || defaultContent.privacy.intro}
              </p>

              {/* Information We Collect */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  Information We Collect
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-3">
                  {content.privacy?.informationWeCollect?.description || defaultContent.privacy.informationWeCollect.description}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
                  {(content.privacy?.informationWeCollect?.items || defaultContent.privacy.informationWeCollect.items).map((item: string, index: number) => (
                    <li key={index} className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.privacy?.informationWeCollect?.note || defaultContent.privacy.informationWeCollect.note}
                </p>
              </div>

              {/* Use of Information */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  Use of Information
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-3">
                  {content.privacy?.useOfInformation?.description || defaultContent.privacy.useOfInformation.description}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
                  {(content.privacy?.useOfInformation?.items || defaultContent.privacy.useOfInformation.items).map((item: string, index: number) => (
                    <li key={index} className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.privacy?.useOfInformation?.note || defaultContent.privacy.useOfInformation.note}
                </p>
              </div>

              {/* Cookies & Analytics */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  Cookies & Analytics
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.privacy?.cookies || defaultContent.privacy.cookies}
                </p>
              </div>

              {/* Data Security */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  Data Security
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.privacy?.dataSecurity || defaultContent.privacy.dataSecurity}
                </p>
              </div>
            </div>
          </section>

          {/* 3. Disclaimer */}
          <section>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 border-b border-border pb-4 tracking-[-0.005em]">
              3. Disclaimer
            </h2>
            <div className="space-y-8">
              {/* No Professional Advice */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  No Professional Advice
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.disclaimer?.noProfessionalAdvice || defaultContent.disclaimer.noProfessionalAdvice}
                </p>
              </div>

              {/* No Guarantees */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  No Guarantees
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-3">
                  {content.disclaimer?.noGuarantees?.description || defaultContent.disclaimer.noGuarantees.description}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
                  {(content.disclaimer?.noGuarantees?.items || defaultContent.disclaimer.noGuarantees.items).map((item: string, index: number) => (
                    <li key={index} className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.disclaimer?.noGuarantees?.note || defaultContent.disclaimer.noGuarantees.note}
                </p>
              </div>

              {/* Training & Education Disclaimer */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  Training & Education Disclaimer
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.disclaimer?.trainingEducation || defaultContent.disclaimer.trainingEducation}
                </p>
              </div>

              {/* Third-Party Links */}
              <div>
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground tracking-[-0.005em]">
                  Third-Party Links
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {content.disclaimer?.thirdPartyLinks || defaultContent.disclaimer.thirdPartyLinks}
                </p>
              </div>
            </div>
          </section>

          {/* 4. Governing Law */}
          <section>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 border-b border-border pb-4 tracking-[-0.005em]">
              4. Governing Law
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {content.governingLaw || defaultContent.governingLaw}
            </p>
          </section>

          {/* 5. Company Information */}
          <section>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 border-b border-border pb-4 tracking-[-0.005em]">
              5. Company Information
            </h2>
            <div className="space-y-4">
              <p className="text-base md:text-lg text-foreground font-semibold">
                {content.companyInfo?.name || defaultContent.companyInfo.name}
              </p>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {content.companyInfo?.location || defaultContent.companyInfo.location}
              </p>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {content.companyInfo?.contactNote || defaultContent.companyInfo.contactNote}
                {' '}
                <Link href="/contact" className="text-accent hover:text-accent/80 underline transition-colors">
                  Contact page
                </Link>
                .
              </p>
            </div>
          </section>

          {/* 6. Updates to This Page */}
          <section>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 border-b border-border pb-4 tracking-[-0.005em]">
              6. Updates to This Page
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {content.updates || defaultContent.updates}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
