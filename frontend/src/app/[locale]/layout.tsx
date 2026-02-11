import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/navigation';
import { Header } from '@/widgets/Header';
import { GlobalBreadcrumbs } from '@/shared/ui/GlobalBreadcrumbs';
import { PageTransition } from '@/shared/ui/PageTransition';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'fr')) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Header />
      <GlobalBreadcrumbs />
      <PageTransition>{children}</PageTransition>
    </NextIntlClientProvider>
  );
}
