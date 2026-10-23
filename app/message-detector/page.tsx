import type { Metadata } from 'next';
import { MessageDetector } from '@/components/MessageDetector';

export const metadata: Metadata = {
  title: 'Scam Message Detector',
  description: 'Analyse SMS, WhatsApp messages, emails and job offers for phishing and scam indicators.',
};

export default function Page() {
  return <MessageDetector />;
}
