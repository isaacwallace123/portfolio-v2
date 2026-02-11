'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ContactForm } from '@/features/contacts/ui/ContactForm';
import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('contact');

  return (
    <main className="relative flex-1">
      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <div className="space-y-12">
            {/* Hero */}
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {t('title')}
                </p>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl max-w-3xl">
                  {t('subtitle')}
                </h1>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href="/projects">
                    {t('title')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Contact Form */}
            <div className="max-w-2xl">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
