// audioPlayer.ts
export const mp3Map: Record<string, string> = {
    '3-1': '/mp3/3/2-2-1.mp3',
    '3-2': '/mp3/3/2-2-2.mp3',
    '3-3': '/mp3/3/2-2-3.mp3',
    '3-4': '/mp3/3/2-2-4.mp3',
    '3-5': '/mp3/3/2-2-5.mp3',
    '3-6': '/mp3/3/2-2-6.mp3',
    '3-7': '/mp3/3/2-2-7.mp3',
    '3-8': '/mp3/3/2-2-8.mp3',
    '3-9': '/mp3/3/2-2-9.mp3',
    '4-1': '/mp3/4/01 形容词 Test 1-横向测试.mp3',
    '4-2': '/mp3/4/2.mp3',
    '4-3': '/mp3/4/3.mp3',
    '4-4_adverb': '/mp3/4/4.mp3',
    '5-1': '/mp3/5/1.mp3',
    '5-2': '/mp3/5/2.mp3',
    '5-3': '/mp3/5/3.mp3',
    '5-4': '/mp3/5/4.mp3',
    '5-5': '/mp3/5/05 Test 5-横向测试.mp3',
    '5-6': '/mp3/5/6h.mp3',
    '5-7': '/mp3/5/7.mp3',
    '5-8': '/mp3/5/8.mp3',
    '5-9': '/mp3/5/09Test 9-横向测试.mp3',
    '5-10': '/mp3/5/10Test10-横向测试.mp3',
    '5-11': '/mp3/5/11.mp3',
    '5-12': '/mp3/5/12.mp3',
    '11-1': '/mp3/11/1.mp3',
    '11-2': '/mp3/11/Section2.mp3',
    '11-3': '/mp3/11/Section3.mp3',
    '11-4': '/mp3/11/4.mp3'
};

const audio = new Audio();
let audioReady = false;
let seeking = false;

export function initAudioPlayer(): void {
    const audioSeek = document.getElementById('audio-seek') as HTMLInputElement | null;
    const audioTime = document.getElementById('audio-time');
    const audioPlayBtn = document.getElementById('audio-play');
    if (!audioSeek || !audioTime || !audioPlayBtn) return;

    audio.addEventListener('loadedmetadata', () => {
        audioReady = true;
        audioSeek.max = audio.duration.toString();
        audioTime.textContent = fmtTime(audio.currentTime) + ' / ' + fmtTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
        if (!seeking) {
            audioSeek.value = audio.currentTime.toString();
            audioTime.textContent = fmtTime(audio.currentTime) + ' / ' + fmtTime(audio.duration);
        }
    });

    audio.addEventListener('ended', () => {
        audioPlayBtn.textContent = '▶';
    });
}

function fmtTime(s: number): string {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
}

export function loadAudio(ppId: string): void {
    const audioBar = document.getElementById('audio-bar');
    const audioPlayBtn = document.getElementById('audio-play');
    const audioTime = document.getElementById('audio-time');
    const audioSeek = document.getElementById('audio-seek') as HTMLInputElement | null;
    
    if (!audioBar || !audioPlayBtn || !audioTime || !audioSeek) return;

    const src = mp3Map[ppId];
    audio.pause();
    audioReady = false;
    if (!src) { audioBar.classList.remove('show'); return; }
    audio.src = encodeURI(src);
    audio.load();
    audioBar.classList.add('show');
    audioPlayBtn.textContent = '▶';
    audioTime.textContent = '0:00 / 0:00';
    audioSeek.value = "0";
}

export function togglePlay(): void {
    if (!audioReady) return;
    const audioPlayBtn = document.getElementById('audio-play');
    if (!audioPlayBtn) return;
    
    if (audio.paused) { audio.play(); audioPlayBtn.textContent = '⏸'; }
    else { audio.pause(); audioPlayBtn.textContent = '▶'; }
}

export function seekAudio(val: string): void {
    seeking = true;
    const numVal = parseFloat(val);
    audio.currentTime = numVal;
    const audioTime = document.getElementById('audio-time');
    if (audioTime) audioTime.textContent = fmtTime(numVal) + ' / ' + fmtTime(audio.duration);
    seeking = false;
}

export function setSpeed(rate: number): void {
    audio.playbackRate = rate;
    document.querySelectorAll('.spd-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.textContent || '1') === rate);
    });
}