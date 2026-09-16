import "./globals.css";
import {I18nProvider} from "@/components/i18n";
import LayoutShell from "@/components/LayoutShell";
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><I18nProvider><LayoutShell>{children}</LayoutShell></I18nProvider></body></html>}
