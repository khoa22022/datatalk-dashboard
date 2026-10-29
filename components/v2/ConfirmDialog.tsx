'use client';
import { useEffect, useRef, useId } from 'react';
import { useV2Copy } from './copy';
export function ConfirmDialog({ title, description, busy, onConfirm, onCancel }: { title: string; description: string; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null); const heading = useId(); const text = useId(); const { c } = useV2Copy();
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="account-dialog" aria-labelledby={heading} aria-describedby={text} onCancel={e => { e.preventDefault(); if (!busy) onCancel(); }}>
    <h2 id={heading}>{title}</h2><p id={text}>{description}</p>
    <div className="account-actions"><button autoFocus className="btn outline" disabled={busy} onClick={onCancel}>{c('cancel')}</button><button className="btn primary" disabled={busy} onClick={onConfirm}>{busy ? c('working') : c('confirm')}</button></div>
  </dialog>;
}
