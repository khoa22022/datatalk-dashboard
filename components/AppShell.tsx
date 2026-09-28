"use client";
import { ReactNode } from "react";
import LayoutShell from "./LayoutShell";
export function AppShell({children,title}:{children:ReactNode,title?:string}){return <LayoutShell titleOverride={title}>{children}</LayoutShell>}
