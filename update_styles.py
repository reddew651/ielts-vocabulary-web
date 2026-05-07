import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_styles = """<style>
        :root {
            --bg: #F5F5F7;
            --sidebar-bg: rgba(245, 245, 247, 0.65);
            --main-bg: #FFFFFF;
            --text: #1D1D1F;
            --text2: #86868B;
            --accent: #007AFF;
            --accent-hover: #0071E3;
            --border: rgba(60, 60, 67, 0.12);
            --border-light: rgba(60, 60, 67, 0.08);
            --ok: #34C759;
            --ok-bg: #E4F7E8;
            --err: #FF3B30;
            --err-bg: #FFEBEA;
            --focus: #007AFF;
            
            --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
            --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
            --shadow-lg: 0 12px 32px rgba(0,0,0,0.12);
        }
        * { margin:0; padding:0; box-sizing:border-box; font-family:-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        body { display:flex; height:100vh; background:var(--bg); color:var(--text); overflow:hidden; }

        /* ===== Sidebar ===== */
        .sidebar { width:280px; background:var(--sidebar-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-right:1px solid var(--border); display:flex; flex-direction:column; flex-shrink:0; z-index: 10; }
        .sidebar-header { padding:24px 20px 12px; font-size:13px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid transparent; }
        #chapter-list { overflow-y:auto; flex:1; padding: 0 12px 12px; }
        .ch-group { margin-bottom: 2px; }
        .ch-hd { padding:8px 12px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; font-weight:600; font-size:14px; user-select:none; border-radius: 8px; color: var(--text); transition: background 0.2s; }
        .ch-hd:hover { background:rgba(0,0,0,.04); }
        .ch-arrow { font-size:10px; color:var(--text2); margin-right:8px; transition:transform .2s; display: inline-block; }
        .ch-group.open .ch-arrow { transform:rotate(90deg); }
        .ch-stat { font-size:11px; color:var(--text2); background:rgba(0,0,0,.06); padding:2px 6px; border-radius:10px; font-weight:600; }
        .pp-list { display:none; flex-direction: column; gap: 2px; padding-top: 2px; padding-left: 18px; }
        .ch-group.open .pp-list { display:flex; }
        .pp-item { padding:8px 12px 8px 12px; font-size:13px; font-weight: 500; cursor:pointer; display:flex; justify-content:space-between; align-items:center; border-radius: 6px; transition: all 0.2s; color: var(--text); }
        .pp-item:hover { background:rgba(0,0,0,0.04); }
        .pp-item.active { background:var(--accent); color:#fff; font-weight:600; box-shadow: var(--shadow-sm); }
        .pp-item.active .pp-stat { color: rgba(255,255,255,0.8); }
        .pp-stat { font-size:11px; color:var(--text2); font-weight: 500; }
        
        /* Sidebar Footer */
        .sidebar-footer { padding: 16px; display: flex; gap: 8px; justify-content: space-around; background: transparent; }
        .sidebar-footer button { flex:1; padding: 8px 0; font-size: 13px; font-weight: 600; border-radius: 8px; border:none; background: rgba(0,0,0,.05); color: var(--text); cursor: pointer; transition: all .2s; }
        .sidebar-footer button:hover { background: rgba(0,0,0,.1); }

        /* ===== Main ===== */
        .main { flex:1; display:flex; flex-direction:column; overflow:hidden; background:var(--main-bg); position: relative; }
        .topbar { padding:20px 40px; border-bottom: 1px solid var(--border-light); display:flex; justify-content:space-between; align-items:center; flex-shrink:0; background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 5; gap: 16px; flex-wrap: wrap;}
        .topbar-left { display:flex; flex-direction:column; gap:6px; }
        .title { font-size:24px; font-weight:700; letter-spacing: -0.5px; }
        .stats { display:flex; gap:8px; font-size:12px; margin-top:2px; }
        .pill { padding:4px 10px; border-radius:12px; font-weight:600; background:rgba(0,0,0,.04); color:var(--text2); }
        .pill.g { background:var(--ok-bg); color:var(--ok); }
        .pill.r { background:var(--err-bg); color:var(--err); }
        .topbar-right { display:flex; gap:12px; align-items:center; }
        .topbar-right button { padding:8px 16px; border-radius:8px; border:none; background:rgba(0,0,0,.05); color:var(--text); cursor:pointer; font-size:14px; font-weight:600; transition:all .2s; user-select:none; }
        .topbar-right button:hover { background:rgba(0,0,0,.1); }
        .toggle-btn.active { background:var(--accent); color:#fff; }
        .submit-btn { background:var(--accent) !important; color:#fff !important; box-shadow: var(--shadow-sm); }
        .submit-btn:hover { background:var(--accent-hover) !important; }
        .submit-btn:active { transform:scale(.97); }
        .submit-btn:disabled { opacity:.5; cursor:not-allowed; }
        .restart-btn { background:var(--err-bg) !important; color:var(--err) !important; display:none !important; }
        .restart-btn[style*="display: inline-block"], .restart-btn[style*="display: block"] { display: inline-block !important; }
        .restart-btn:hover { background:var(--err) !important; color:#fff !important; }
        .err-btn { position:relative; }
        .err-badge { position:absolute; top:-6px; right:-6px; min-width:20px; height:20px; border-radius:10px; background:var(--err); color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; padding:0 6px; border: 2px solid var(--main-bg); box-shadow: var(--shadow-sm); }

        /* ===== Audio Player ===== */
        .audio-bar { display:none; padding:16px 40px; border-bottom:1px solid var(--border-light); background:rgba(250,250,252,0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); align-items:center; gap:16px; flex-shrink:0; z-index:4;}
        .audio-bar.show { display:flex; }
        .audio-play { width:40px; height:40px; border-radius:50%; border:none; background:var(--accent); color:#fff; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s; box-shadow: var(--shadow-sm); }
        .audio-play:hover { transform:scale(1.05); background:var(--accent-hover); }
        .audio-play:active { transform:scale(.95); }
        .audio-time { font-size:13px; color:var(--text2); font-weight:500; white-space:nowrap; flex-shrink:0; min-width:85px; text-align:center; font-variant-numeric:tabular-nums; }
        .audio-seek { flex:1; height:6px; -webkit-appearance:none; appearance:none; background:rgba(0,0,0,.1); border-radius:3px; outline:none; cursor:pointer; transition: background .2s; }
        .audio-seek:hover { background:rgba(0,0,0,.15); }
        .audio-seek::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#fff; cursor:pointer; box-shadow: 0 2px 6px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.05); transition: transform .1s; }
        .audio-seek::-webkit-slider-thumb:active { transform: scale(1.1); }
        .audio-speeds { display:flex; gap:6px; flex-shrink:0; background:rgba(0,0,0,.04); padding:4px; border-radius:10px; }
        .spd-btn { padding:4px 12px; border-radius:6px; border:none; background:transparent; cursor:pointer; font-size:13px; font-weight:600; color:var(--text2); transition:all .2s; }
        .spd-btn:hover { color:var(--text); }
        .spd-btn.active { background:#fff; color:var(--text); box-shadow:var(--shadow-sm); }

        /* ===== Word List ===== */
        .word-wrap { flex:1; overflow-y:auto; padding:30px 40px 80px; scroll-behavior: smooth; }
        .wc-container { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }
        .wc { display:flex; align-items:center; padding:16px 20px; background:#fff; border-radius:12px; border: 1px solid var(--border-light); gap:20px; transition:all .2s; box-shadow: var(--shadow-sm); }
        .wc:hover { box-shadow: var(--shadow-md); border-color: rgba(0,0,0,.1); }
        .wc-num { width:28px; font-size:13px; font-weight:600; color:var(--text2); text-align:right; flex-shrink:0; opacity: 0.6; }
        .wc-cn { flex:1; font-size:16px; font-weight:500; color:var(--text); transition:opacity .2s; }
        .wc-cn.hidden { opacity:0; user-select:none; pointer-events:none; }
        .wc-input { flex:1; max-width:300px; }
        .wc-input input { width:100%; padding:10px 14px; font-size:15px; border:1px solid rgba(0,0,0,0.1); border-radius:8px; background:var(--bg); transition:all .2s; color:var(--text); font-weight:500; }
        .wc-input input:focus { background:#fff; border-color:var(--accent); box-shadow:0 0 0 3px rgba(0, 122, 255, 0.15); outline:none; }
        .wc-input input:disabled { background:transparent; border-color:transparent; padding:10px 0; }
        .wc-answer { flex:1; max-width:200px; font-size:15px; font-weight:600; opacity:0; transition:all .2s; transform: translateX(-10px); }

        /* States after submit */
        .wc.ok { background:var(--ok-bg); border-color:var(--ok-bg); box-shadow:none; }
        .wc.ok .wc-num { color: rgba(52, 199, 89, 0.6); }
        .wc.ok input { color:var(--ok); font-weight:600; }
        .wc.ok .wc-answer { opacity:0; }
        .wc.ng { background:var(--err-bg); border-color:var(--err-bg); box-shadow:none; }
        .wc.ng .wc-num { color: rgba(255, 59, 48, 0.6); }
        .wc.ng input { color:var(--err); text-decoration:line-through; text-decoration-thickness: 2px; }
        .wc.ng .wc-answer { opacity:1; color:var(--err); transform: translateX(0); }

        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text2); text-align:center; gap:12px; max-width: 400px; margin: 0 auto; }
        .empty h2 { font-size:24px; font-weight:700; color:var(--text); letter-spacing:-0.5px; }
        .empty p { font-size: 15px; line-height:1.5; }

        /* ===== Error Panel ===== */
        .err-overlay { position:fixed; inset:0; background:rgba(0,0,0,.3); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index:100; display:none; align-items:center; justify-content:center; opacity:0; transition:opacity .3s; }
        .err-overlay.show { display:flex; opacity:1; }
        .err-panel { background:var(--main-bg); border-radius:16px; width:90%; max-width:800px; max-height:85vh; display:flex; flex-direction:column; box-shadow:var(--shadow-lg); transform:scale(0.95); transition:transform .3s cubic-bezier(0.16, 1, 0.3, 1); }
        .err-overlay.show .err-panel { transform:scale(1); }
        .err-panel-header { padding:20px 24px; border-bottom:1px solid var(--border-light); display:flex; justify-content:space-between; align-items:center; flex-shrink:0; background: rgba(255,255,255,0.9); border-radius: 16px 16px 0 0; }
        .err-panel-header h2 { font-size:18px; font-weight:700; letter-spacing:-0.3px; }
        .err-close { width:32px; height:32px; border-radius:16px; border:none; background:rgba(0,0,0,.05); cursor:pointer; font-size:20px; display:flex; align-items:center; justify-content:center; color:var(--text2); transition:all .2s; }
        .err-close:hover { background:rgba(0,0,0,.1); color:var(--text); }
        .err-clear-btn { padding:6px 14px; border-radius:8px; border:none; background:var(--err-bg); color:var(--err); font-size:13px; font-weight:600; cursor:pointer; margin-right:8px; transition:all .2s; }
        .err-clear-btn:hover { background:var(--err); color:#fff; }
        .err-export-btn { padding:6px 14px; border-radius:8px; border:none; background:rgba(0,122,255,.1); color:var(--accent); font-size:13px; font-weight:600; cursor:pointer; margin-right:8px; transition:all .2s; }
        .err-export-btn:hover { background:var(--accent); color:#fff; }
        .err-panel-body { overflow-y:auto; padding:24px; flex:1; }
        .err-chapter-group { margin-bottom:24px; }
        .err-chapter-title { font-size:16px; font-weight:700; margin-bottom:12px; color:var(--text); border-bottom: 2px solid var(--border-light); padding-bottom: 6px; }
        .err-paper-title { font-size:14px; font-weight:600; color:var(--text2); margin:12px 0 8px 8px; }
        .err-table { width:100%; border-collapse:collapse; margin-bottom:16px; margin-left:8px; }
        .err-table th { text-align:left; font-size:12px; color:var(--text2); padding:8px 12px; border-bottom:1px solid var(--border-light); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
        .err-table td { padding:12px; border-bottom:1px solid var(--border-light); font-size:14px; font-weight:500; }
        .err-count { display:inline-flex; align-items:center; justify-content:center; min-width:24px; height:24px; border-radius:12px; background:var(--err-bg); color:var(--err); font-weight:700; font-size:12px; }
        .err-empty { text-align:center; padding:60px 40px; color:var(--text2); font-size:15px; font-weight:500; }
        
        /* History Panel specifics */
        .history-date { margin:16px 0 8px; font-size:15px; font-weight:700; color:var(--text); }
        .history-table { width:100%; border-collapse:collapse; margin-bottom:8px; }
        .history-table th { text-align:left; font-size:12px; color:var(--text2); padding:8px 12px; border-bottom:1px solid var(--border-light); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
        .history-table td { padding:10px 12px; border-bottom:1px solid var(--border-light); font-size:14px; font-weight:500; }
        .pct-strong { font-weight:700; color:var(--accent); }
        .history-group { margin-bottom:20px; border:1px solid var(--border-light); border-radius:12px; overflow:hidden; box-shadow:var(--shadow-sm); }
        .history-group-hd { background:rgba(0,0,0,.02); padding:12px 16px; display:flex; justify-content:space-between; align-items:center; gap:12px; border-bottom: 1px solid var(--border-light); }
        .history-group-title { font-size:14px; font-weight:700; color:var(--text); }
        .history-summary { font-size:13px; color:var(--text2); font-weight:500; }
        .delta-up { color:var(--ok); font-weight:700; }
        .delta-down { color:var(--err); font-weight:700; }
        .delta-flat { color:rgba(0,0,0,.2); font-weight:600; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
    </style>"""

html = re.sub(r'<style>.*?</style>', new_styles, html, flags=re.DOTALL)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
