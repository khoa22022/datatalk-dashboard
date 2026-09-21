import './globals.css';
import { I18nProvider } from '@/components/i18n';
import { AuthProvider } from '@/components/AuthProvider';
import { ProjectProvider } from '@/components/ProjectProvider';
import LayoutShell from '@/components/LayoutShell';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><I18nProvider><AuthProvider><ProjectProvider><LayoutShell>{children}</LayoutShell></ProjectProvider></AuthProvider></I18nProvider></body></html>;
}
