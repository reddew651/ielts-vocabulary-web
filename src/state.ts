import type { AppState, Store } from './types';

// state.ts
export const S: AppState = {
    progress: JSON.parse(localStorage.getItem('ielts_v3') || '{}'),
    errCounts: JSON.parse(localStorage.getItem('ielts_errcnt') || '{}'),
    rateHistory: JSON.parse(localStorage.getItem('ielts_rate_history') || '[]'),
    chId: null,
    ppId: null,
    expanded: JSON.parse(localStorage.getItem('ielts_exp') || '[]'),
    cnHidden: false,
    submitted: false
};

// Global data store
export const store: Store = {
    vocabData: []
};

// Persistence functions
export function save(): void { localStorage.setItem('ielts_v3', JSON.stringify(S.progress)); }
export function saveExp(): void { localStorage.setItem('ielts_exp', JSON.stringify(S.expanded)); }
export function saveErr(): void { localStorage.setItem('ielts_errcnt', JSON.stringify(S.errCounts)); }
export function saveRateHistory(): void { localStorage.setItem('ielts_rate_history', JSON.stringify(S.rateHistory)); }

export function errKey(chId: string, ppId: string, wId: string): string { return `${chId}|${ppId}|${wId}`; }

export function fmtDate(): string {
    const d = new Date();
    return `${d.getMonth() + 1}.${d.getDate()}`;
}