export interface Word {
    id: string;
    word: string;
    translation: string;
}

export interface Paper {
    id: string;
    name: string;
    words: Word[];
}

export interface Chapter {
    id: string;
    name: string;
    papers: Paper[];
}

export interface RateHistoryItem {
    date: string;
    chId: string;
    chName: string;
    ppId: string;
    ppName: string;
    attempt: number;
    right: number;
    wrong: number;
    total: number;
    pct: number;
    ts: number;
}

export interface ProgressState {
    right?: string[];
    wrong?: string[];
}

export interface ErrCountItem {
    count: number;
    typed?: string;
}

export interface AppState {
    progress: Record<string, ProgressState>;
    errCounts: Record<string, ErrCountItem | number>;
    rateHistory: RateHistoryItem[];
    chId: string | null;
    ppId: string | null;
    expanded: string[];
    cnHidden: boolean;
    submitted: boolean;
}

export interface Store {
    vocabData: Chapter[];
}

declare global {
    interface Window {
        toggleChinese: () => void;
        submitAll: () => void;
        restartPaper: () => void;
        showErrPanel: () => void;
        hideErrPanel: () => void;
        exportErrAsMarkdown: () => void;
        clearAllErr: () => void;
        showHistoryPanel: () => void;
        hideHistoryPanel: () => void;
        togglePlay: () => void;
        seekAudio: (val: string) => void;
        setSpeed: (rate: number) => void;
        exportData: () => void;
        importData: () => void;
    }
}
