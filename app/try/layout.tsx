import Link from 'next/link';

const nav=[['Overview','/try'],['Projects','/try/projects'],['Analytics','/try/analytics'],['Heatmaps','/try/heatmaps'],['Sessions','/try/sessions'],['Funnels','/try/funnels'],['AI Analyst','/try/ai']];
export default function TrialLayout({children}:{children:React.ReactNode}){
 return <div className="trial-shell"><aside className="trial-side"><div className="trial-brand">✦ <span>datatalk</span></div><div className="trial-pill">TRIAL · SAMPLE DATA</div><nav>{nav.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</nav><div className="trial-side-bottom"><div className="trial-project">Sweet Pea Website<span>Tracking active</span></div><Link href="/login" className="trial-exit">Exit trial</Link></div></aside><main className="trial-main">{children}</main></div>
}
