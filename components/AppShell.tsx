import { ReactNode } from 'react';
import { Sidebar, MobileHeader } from './Sidebar';
import { Topbar } from './Topbar';
export function AppShell({children,title}:{children:ReactNode,title?:string}){ return <div className="app-shell"><Sidebar/><main className="main"><MobileHeader/><Topbar title={title}/><div className="page">{children}</div></main></div> }
