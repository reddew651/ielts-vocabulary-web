import re

with open('src/main.ts', 'r', encoding='utf-8') as f:
    ts = f.read()

# Replace empty state HTML and append behavior in renderWords
new_render_words = """function renderWords(pp) {
    wordWrap.innerHTML = '';
    if (!pp.words.length) { wordWrap.innerHTML = '<div class="empty"><h2>此 Paper 没有单词</h2><p>请选择其他测试卷</p></div>'; return; }

    const container = document.createElement('div');
    container.className = 'wc-container';

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
            <div class="wc-num">${String(i + 1).padStart(2, '0')}</div>
            <div class="${cnClass}">${w.translation}</div>
            <div class="wc-input"><input type="text" value="${inputVal}" ${disabled} placeholder="输入英文..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
            <div class="wc-answer">${w.word}</div>
        `;

        const input = row.querySelector('input');
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                focusNext(row);
            }
        });

        container.appendChild(row);
    });
    
    wordWrap.appendChild(container);
}"""

ts = re.sub(r'function renderWords\(pp\) \{.*?\n\}\n(?!function)', new_render_words + '\n', ts, flags=re.DOTALL)

with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(ts)
