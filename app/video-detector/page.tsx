import type { Metadata } from 'next';
import { VideoDetector } from '@/components/VideoDetector';

export const metadata: Metadata = {
  title: 'Deepfake Video Detector',
  description: 'Analyse MP4 and MOV clips frame-by-frame for deepfake manipulation artefacts.',
};

export default function Page() {
  return <VideoDetector />;
}
