import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Datatalk', description: 'UX Analytics & AI Product Intelligence' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
