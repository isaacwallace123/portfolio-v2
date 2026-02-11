'use client';

import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ContactForm } from '@/features/contacts/ui/ContactForm';

export default function ContactPage() {
  return (
    <main className="relative flex-1">
      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <div className="space-y-12">
            {/* Hero */}
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Contact
                </p>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl max-w-3xl">
                  Get in touch
                </h1>
                <p className="text-lg text-muted-foreground md:text-xl max-w-2xl">
                  Have a project in mind, a question, or just want to say hello?
                  I&apos;d love to hear from you.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href="/projects">
                    View my work <ArrowRight className="ml-2 h-4 w-4" />
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
