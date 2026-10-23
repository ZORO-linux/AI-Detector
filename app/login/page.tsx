import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in or create a local account to use the AI Scam Shield detectors.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
