import { S, store, save, saveExp, saveErr, saveRateHistory, errKey, fmtDate } from './state';
import { initAudioPlayer, loadAudio, togglePlay, seekAudio, setSpeed } from './audioPlayer';
import type { Chapter, Paper } from './types';

// Attach handlers to window so inline HTML onclick attributes work
window.toggleChinese = toggleChinese;
window.submitAll = submitAll;
window.restartPaper = restartPaper;
window.showErrPanel = showErrPanel;
window.hideErrPanel = hideErrPanel;
window.exportErrAsMarkdown = exportErrAsMarkdown;
window.clearAllErr = clearAllErr;
window.showHistoryPanel = showHistoryPanel;
window.hideHistoryPanel = hideHistoryPanel;
window.togglePlay = togglePlay;
window.seekAudio = seekAudio;
window.setSpeed = setSpeed;
window.exportData = exportData;
window.importData = importData;

const $ = id => document.getElementById(id);
let chList, wordWrap, titleEl, statsEl, sOk, sNg, sPct, btnSubmit, btnHideCn, btnRestart, errBadge;

document.addEventListener('DOMContentLoaded', () => {
    chList = $('chapter-list');
    wordWrap = $('word-wrap');
    titleEl = $('title');
    statsEl = $('stats');
    sOk = $('s-ok');
    sNg = $('s-ng');
    sPct = $('s-pct');
    btnSubmit = $('btn-submit');
    btnHideCn = $('btn-hide-cn');
    btnRestart = $('btn-restart');
    errBadge = $('err-badge');
    
    initAudioPlayer();
    initApp();
});

async function initApp() {
    try {
        // In Vite, public files are served at the root
        const res = await fetch('/data.json');
        if (!res.ok) throw new Error('Network response was not ok');
        store.vocabData = await res.json();
    } catch (err) {
        console.error('Failed to fetch data:', err);
        chList.innerHTML = '<div style="padding:20px;color:red">data.json 加载失败 (' + err.message + ')</div>';
        return;
    }
    
    migrateLegacyProgressToHistory();
    updateErrBadge();
    renderSidebar();
}

function recordRateHistory(ch, pp, rightCount, wrongCount) {
    const total = rightCount + wrongCount;
    const pct = total ? Math.round(rightCount / total * 100) : 0;
    const date = fmtDate();
    const todayTimes = S.rateHistory.filter(x => x.date === date && x.chId === ch.id && x.ppId === pp.id).length;
    S.rateHistory.push({
        date,
        chId: ch.id,
        chName: ch.name,
        ppId: pp.id,
        ppName: pp.name,
        attempt: todayTimes + 1,
        right: rightCount,
        wrong: wrongCount,
        total,
        pct,
        ts: Date.now()
    });
    saveRateHistory();
}

function migrateLegacyProgressToHistory() {
    const migratedKey = 'ielts_rate_history_migrated_v1';
    if (localStorage.getItem(migratedKey) === '1') return;
    if (!Array.isArray(S.rateHistory)) S.rateHistory = [];

    let added = 0;
    store.vocabData.forEach(ch => {
        ch.papers.forEach(pp => {
            const p = S.progress[pp.id];
            if (!p) return;
            const right = new Set(p.right || []).size;
            const wrong = new Set(p.wrong || []).size;
            const total = right + wrong;
            if (!total) return;

            const existed = S.rateHistory.some(x => x.ppId === pp.id && x.date === '历史导入' && x.attempt === 1);
            if (existed) return;

            const pct = Math.round(right / total * 100);
            S.rateHistory.push({
                date: '历史导入',
                chId: ch.id,
                chName: ch.name,
                ppId: pp.id,
                ppName: pp.name,
                attempt: 1,
                right,
                wrong,
                total,
                pct,
                ts: 0
            });
            added += 1;
        });
    });

    if (added > 0) saveRateHistory();
    localStorage.setItem(migratedKey, '1');
}

function ppStats(paper) {
    const d = S.progress[paper.id] || {};
    const r = new Set(d.right || []).size;
    const w = new Set(d.wrong || []).size;
    const t = paper.words.length;
    return { r, w, t, pct: t ? Math.round(r / t * 100) : 0 };
}
function chStats(ch) {
    let tw = 0, tr = 0;
    ch.papers.forEach(p => { const s = ppStats(p); tw += s.t; tr += s.r; });
    return { pct: tw ? Math.round(tr / tw * 100) : 0 };
}

function renderSidebar() {
    if (!store.vocabData || store.vocabData.length === 0) return;
    chList.innerHTML = '';
    store.vocabData.forEach(ch => {
        const cs = chStats(ch);
        const open = S.expanded.includes(ch.id);
        const g = document.createElement('div');
        g.className = 'ch-group' + (open ? ' open' : '');

        const hd = document.createElement('div');
        hd.className = 'ch-hd';
        hd.onclick = () => { S.expanded.includes(ch.id) ? S.expanded = S.expanded.filter(x => x !== ch.id) : S.expanded.push(ch.id); saveExp(); renderSidebar(); };
        hd.innerHTML = `<div style="display:flex;align-items:center"><span class="ch-arrow">▶</span><span>${ch.name}</span></div><span class="ch-stat">${cs.pct}%</span>`;

        const pl = document.createElement('div');
        pl.className = 'pp-list';
        ch.papers.forEach(pp => {
            const ps = ppStats(pp);
            const pi = document.createElement('div');
            pi.className = 'pp-item' + (S.ppId === pp.id ? ' active' : '');
            pi.onclick = e => { e.stopPropagation(); loadPaper(ch.id, pp.id); };
            pi.innerHTML = `<span>${pp.name}</span><span class="pp-stat" style="${ps.pct === 100 ? 'color:var(--ok)' : ''}">${ps.pct}%</span>`;
            pl.appendChild(pi);
        });

        g.appendChild(hd); g.appendChild(pl);
        chList.appendChild(g);
    });
}

function loadPaper(chId, ppId) {
    S.chId = chId; S.ppId = ppId; S.submitted = false;
    const ch = store.vocabData.find(c => c.id === chId);
    const pp = ch.papers.find(p => p.id === ppId);

    titleEl.textContent = `${ch.name} / ${pp.name}`;
    statsEl.style.display = 'flex';
    btnSubmit.disabled = false;
    btnRestart.style.display = 'none';

    renderSidebar();
    renderWords(pp);
    updateStats(pp);
    loadAudio(ppId);
}

function renderWords(pp) {
    wordWrap.innerHTML = '';
    if (!pp.words.length) { wordWrap.innerHTML = '<div class="empty">此 Paper 没有单词</div>'; return; }

    const prog = S.progress[pp.id] || {};
    const alreadyDone = (prog.right && prog.right.length) || (prog.wrong && prog.wrong.length);

    pp.words.forEach((w, i) => {
        const isRight = (prog.right || []).includes(w.id);
        const isWrong = (prog.wrong || []).includes(w.id);

        const row = document.createElement('div');
        row.className = 'wc' + (isRight ? ' ok' : '') + (isWrong ? ' ng' : '');
        row.dataset.id = w.id;
        row.dataset.word = w.word;

        const cnClass = S.cnHidden ? 'wc-cn hidden' : 'wc-cn';

        let inputVal = '';
        let disabled = '';
        if (isRight) { inputVal = w.word; disabled = 'disabled'; }
        if (isWrong) { inputVal = ''; disabled = 'disabled'; }

        row.innerHTML = `
            <div class="wc-num">${i + 1}</div>
            <div class="${cnClass}">${w.translation}</div>
            <div class="wc-input"><input type="text" value="${inputVal}" ${disabled} placeholder="..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
            <div class="wc-answer">${w.word}</div>
        `;

        const input = row.querySelector('input');
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                focusNext(row);
            }
        });

        wordWrap.appendChild(row);
    });

    if (alreadyDone) { S.submitted = true; btnSubmit.disabled = true; btnRestart.style.display = 'inline-block'; }
}

function focusNext(row) {
    let next = row.nextElementSibling;
    while (next && !next.classList.contains('wc')) next = next.nextElementSibling;
    if (next) {
        const inp = next.querySelector('input');
        if (inp && !inp.disabled) {
            inp.focus();
            const rect = next.getBoundingClientRect();
            const wrap = wordWrap.getBoundingClientRect();
            if (rect.bottom > wrap.bottom - 20) next.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function submitAll() {
    if (S.submitted) return;
    const ch = store.vocabData.find(c => c.id === S.chId);
    const pp = ch.papers.find(p => p.id === S.ppId);

    if (!S.progress[pp.id]) S.progress[pp.id] = { right: [], wrong: [] };
    const progressStore = S.progress[pp.id];
    progressStore.right = []; progressStore.wrong = [];

    const rows = wordWrap.querySelectorAll('.wc');
    rows.forEach(row => {
        const wid = row.dataset.id;
        const correctWord = row.dataset.word;
        const input = row.querySelector('input');
        const userVal = (input.value || '').trim().toLowerCase();
        const target = correctWord.trim().toLowerCase();

        row.classList.remove('ok', 'ng');

        if (userVal === target) {
            progressStore.right.push(wid);
            row.classList.add('ok');
        } else {
            progressStore.wrong.push(wid);
            row.classList.add('ng');
        }
        input.disabled = true;
    });

    recordRateHistory(ch, pp, progressStore.right.length, progressStore.wrong.length);

    S.submitted = true;
    btnSubmit.disabled = true;
    btnRestart.style.display = 'inline-block';

    rows.forEach(row => {
        const k = errKey(S.chId, S.ppId, row.dataset.id);
        if (row.classList.contains('ng')) {
            const input = row.querySelector('input');
            const typed = (input.value || '').trim();
            const prev = S.errCounts[k];
            const prevCount = prev ? (typeof prev === 'object' ? prev.count : prev) : 0;
            S.errCounts[k] = { count: prevCount + 1, typed: typed };
        } else if (row.classList.contains('ok')) {
            delete S.errCounts[k];
        }
    });
    saveErr();
    save();
    updateStats(pp);
    updateErrBadge();
    renderSidebar();

    const firstNg = wordWrap.querySelector('.wc.ng');
    if (firstNg) firstNg.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showHistoryPanel() {
    const body = $('history-panel-body');
    body.innerHTML = '';

    if (!S.rateHistory.length) {
        body.innerHTML = '<div class="err-empty"><h3>还没有记录</h3><p>每次提交后会自动保存正确率</p></div>';
        $('history-overlay').classList.add('show');
        return;
    }

    const groupOrder = [];
    const grouped = {};

    store.vocabData.forEach(ch => {
        ch.papers.forEach(pp => {
            const key = `${ch.id}|${pp.id}`;
            groupOrder.push({ key, chId: ch.id, ppId: pp.id, chName: ch.name, ppName: pp.name });
        });
    });

    S.rateHistory.forEach(item => {
        const key = `${item.chId}|${item.ppId}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    });

    const groupsToShow = groupOrder.filter(g => grouped[g.key] && grouped[g.key].length);

    groupsToShow.forEach(g => {
        const list = grouped[g.key].slice().sort((a, b) => {
            if (a.ts === b.ts) return a.attempt - b.attempt;
            return a.ts - b.ts;
        });

        const firstPct = list[0].pct;
        const lastPct = list[list.length - 1].pct;
        const diff = lastPct - firstPct;
        let diffClass = 'delta-flat';
        let diffText = '0%';
        if (diff > 0) { diffClass = 'delta-up'; diffText = `+${diff}%`; }
        else if (diff < 0) { diffClass = 'delta-down'; diffText = `${diff}%`; }

        const groupDiv = document.createElement('div');
        groupDiv.className = 'history-group';

        const hd = document.createElement('div');
        hd.className = 'history-group-hd';
        hd.innerHTML = `
            <div class="history-group-title">${g.chName} / ${g.ppName}</div>
            <div class="history-summary">共 ${list.length} 次，首末变化 <span class="${diffClass}">${diffText}</span></div>
        `;

        const table = document.createElement('table');
        table.className = 'history-table';
        table.innerHTML = '<thead><tr><th>日期</th><th>第几次</th><th>正确/总数</th><th>正确率</th><th>较上次</th></tr></thead>';
        const tbody = document.createElement('tbody');

        list.forEach((it, idx) => {
            const prev = idx > 0 ? list[idx - 1] : null;
            let changeClass = 'delta-flat';
            let changeText = '-';
            if (prev) {
                const d = it.pct - prev.pct;
                if (d > 0) { changeClass = 'delta-up'; changeText = `+${d}%`; }
                else if (d < 0) { changeClass = 'delta-down'; changeText = `${d}%`; }
                else { changeText = '0%'; }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${it.date}</td><td>第 ${it.attempt} 次</td><td>${it.right}/${it.total}</td><td class="pct-strong">${it.pct}%</td><td class="${changeClass}">${changeText}</td>`;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        groupDiv.appendChild(hd);
        groupDiv.appendChild(table);
        body.appendChild(groupDiv);
    });

    $('history-overlay').classList.add('show');
}

function hideHistoryPanel() {
    $('history-overlay').classList.remove('show');
}

function toggleChinese() {
    S.cnHidden = !S.cnHidden;
    btnHideCn.classList.toggle('active', S.cnHidden);
    btnHideCn.textContent = S.cnHidden ? '显示中文' : '隐藏中文';
    wordWrap.querySelectorAll('.wc-cn').forEach(el => el.classList.toggle('hidden', S.cnHidden));
}

function updateStats(pp) {
    const s = ppStats(pp);
    sOk.textContent = `正确: ${s.r}`;
    sNg.textContent = `错误: ${s.w}`;
    sPct.textContent = `正确率: ${s.pct}%`;
}

function restartPaper() {
    if (!S.chId || !S.ppId) return;
    const ch = store.vocabData.find(c => c.id === S.chId);
    const pp = ch.papers.find(p => p.id === S.ppId);

    delete S.progress[pp.id];
    save();

    S.submitted = false;
    btnSubmit.disabled = false;
    btnRestart.style.display = 'none';
    renderSidebar();
    renderWords(pp);
    updateStats(pp);

    const first = wordWrap.querySelector('input');
    if (first) first.focus();
}

function updateErrBadge() {
    const total = Object.keys(S.errCounts).length;
    if (total > 0) { errBadge.textContent = total; errBadge.style.display = 'flex'; }
    else { errBadge.style.display = 'none'; }
}

function showErrPanel() {
    const body = $('err-panel-body');
    body.innerHTML = '';

    const errEntries = Object.entries(S.errCounts).filter(([k, v]) => (typeof v === 'object' ? v.count : v) > 0);
    if (!errEntries.length) {
        body.innerHTML = '<div class="err-empty"><h3>没有错词记录</h3><p>继续加油！</p></div>';
        $('err-overlay').classList.add('show');
        return;
    }

    const grouped = {};
    errEntries.forEach(([key, count]) => {
        const [chId, ppId, wId] = key.split('|');
        if (!grouped[chId]) grouped[chId] = {};
        if (!grouped[chId][ppId]) grouped[chId][ppId] = [];

        const ch = store.vocabData.find(c => c.id === chId);
        if (!ch) return;
        const pp = ch.papers.find(p => p.id === ppId);
        if (!pp) return;
        const wObj = pp.words.find(w => w.id === wId);
        if (!wObj) return;

        const cnt = typeof count === 'object' ? count.count : count;
        const typed = typeof count === 'object' ? (count.typed || '') : '';
        grouped[chId][ppId].push({ word: wObj.word, translation: wObj.translation, count: cnt, typed, paperName: pp.name });
    });

    const chIds = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));
    chIds.forEach(chId => {
        const ch = store.vocabData.find(c => c.id === chId);
        if (!ch) return;
        const chDiv = document.createElement('div');
        chDiv.className = 'err-chapter-group';
        chDiv.innerHTML = `<div class="err-chapter-title">${ch.name}</div>`;

        const ppIds = Object.keys(grouped[chId]);
        ppIds.forEach(ppId => {
            const items = grouped[chId][ppId];
            if (!items.length) return;
            items.sort((a, b) => b.count - a.count);

            const ppTitle = document.createElement('div');
            ppTitle.className = 'err-paper-title';
            ppTitle.textContent = items[0].paperName;
            chDiv.appendChild(ppTitle);

            const table = document.createElement('table');
            table.className = 'err-table';
            table.innerHTML = `<thead><tr><th>单词</th><th>中文</th><th>我的拼写</th><th>错误次数</th></tr></thead>`;
            const tbody = document.createElement('tbody');
            items.forEach(it => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="font-weight:600">${it.word}</td><td>${it.translation}</td><td style="color:var(--err);font-style:italic">${it.typed || '-'}</td><td><span class="err-count">${it.count}</span></td>`;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            chDiv.appendChild(table);
        });

        body.appendChild(chDiv);
    });

    $('err-overlay').classList.add('show');
}

function buildErrMarkdown() {
    const errEntries = Object.entries(S.errCounts).filter(([k, v]) => (typeof v === 'object' ? v.count : v) > 0);
    if (!errEntries.length) {
        return '# IELTS 错词导出\n\n当前没有错词记录。\n';
    }

    const grouped = {};
    errEntries.forEach(([key, count]) => {
        const [chId, ppId, wId] = key.split('|');
        if (!grouped[chId]) grouped[chId] = {};
        if (!grouped[chId][ppId]) grouped[chId][ppId] = [];

        const ch = store.vocabData.find(c => c.id === chId);
        if (!ch) return;
        const pp = ch.papers.find(p => p.id === ppId);
        if (!pp) return;
        const wObj = pp.words.find(w => w.id === wId);
        if (!wObj) return;

        const cnt = typeof count === 'object' ? count.count : count;
        const typed = typeof count === 'object' ? (count.typed || '') : '';
        grouped[chId][ppId].push({
            word: wObj.word,
            translation: wObj.translation,
            count: cnt,
            typed,
            paperName: pp.name
        });
    });

    let md = '# IELTS 错词导出\n\n';
    md += `导出日期：${new Date().toLocaleString()}\n\n`;

    const chIds = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));
    chIds.forEach(chId => {
        const ch = store.vocabData.find(c => c.id === chId);
        if (!ch) return;
        md += `## ${ch.name}\n\n`;

        const ppIds = Object.keys(grouped[chId]);
        ppIds.forEach(ppId => {
            const items = grouped[chId][ppId];
            if (!items.length) return;
            items.sort((a, b) => b.count - a.count);

            md += `### ${items[0].paperName}\n\n`;
            md += '| 单词 | 中文 | 我的拼写 | 错误次数 |\n';
            md += '|---|---|---|---:|\n';
            items.forEach(it => {
                const typed = (it.typed || '-').replace(/\|/g, '\\|');
                const word = String(it.word).replace(/\|/g, '\\|');
                const zh = String(it.translation).replace(/\|/g, '\\|');
                md += `| ${word} | ${zh} | ${typed} | ${it.count} |\n`;
            });
            md += '\n';
        });
    });

    return md;
}

async function exportErrAsMarkdown() {
    const md = buildErrMarkdown();

    try {
        await navigator.clipboard.writeText(md);
        alert('已复制 Markdown 到剪贴板');
        return;
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = md;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
            alert('已复制 Markdown 到剪贴板');
        } catch (err) {
            alert('复制失败，请手动复制导出内容');
        }
        document.body.removeChild(ta);
    }
}

function hideErrPanel() {
    $('err-overlay').classList.remove('show');
}

function clearAllErr() {
    if (!confirm('确定清空所有错词记录？此操作不可撤销。')) return;
    S.errCounts = {};
    saveErr();
    updateErrBadge();
    showErrPanel(); // refresh panel to show empty state
}

function exportData() {
    const data = {
        ielts_v3: localStorage.getItem('ielts_v3'),
        ielts_errcnt: localStorage.getItem('ielts_errcnt'),
        ielts_rate_history: localStorage.getItem('ielts_rate_history'),
        ielts_exp: localStorage.getItem('ielts_exp')
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IELTS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (re) => {
            try {
                const data = JSON.parse((re.target?.result as string) || '{}');
                if (data.ielts_v3 !== undefined) localStorage.setItem('ielts_v3', data.ielts_v3 || '{}');
                if (data.ielts_errcnt !== undefined) localStorage.setItem('ielts_errcnt', data.ielts_errcnt || '{}');
                if (data.ielts_rate_history !== undefined) localStorage.setItem('ielts_rate_history', data.ielts_rate_history || '[]');
                if (data.ielts_exp !== undefined) localStorage.setItem('ielts_exp', data.ielts_exp || '[]');
                
                alert('🎯 导入成功！即将刷新页面以加载最新数据。');
                location.reload();
            } catch (err) {
                alert('⚠️ 导入失败，文件格式不正确。');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}