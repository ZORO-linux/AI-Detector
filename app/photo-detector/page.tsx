import type { Metadata } from 'next';
import { PhotoDetector } from '@/components/PhotoDetector';

export const metadata: Metadata = {
  title: 'AI Photo Detector',
  description: 'Check whether an image is AI-generated or shows face-manipulation artefacts.',
};

export default function Page() {
  return <PhotoDetector />;
}
