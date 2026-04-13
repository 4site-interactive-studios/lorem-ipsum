(function () {
  'use strict';

  // Prevent double-init
  if (document.getElementById('__lorem-host')) return;

  // ---- Mount host + shadow root ----
  const host = document.createElement('div');
  host.id = '__lorem-host';
  Object.assign(host.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    display: 'block',
  });
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // ---- Styles (scoped inside shadow root) ----
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host { display: block; width: 100%; height: 100%; }

    .root {
      width: 100%;
      height: 100%;
      font-family: Georgia, 'Times New Roman', serif;

      --col-bg:      #f5f2fd;
      --text-on-col: #000000;
      --border-col:  #000000;
      --line-color:  #000000;
      --overlay-bg:  rgba(245,242,253,0.55);
      --panel-bg:    #ffffff;
      --panel-border:#000000;
      --panel-text:  #000000;
      --panel-muted: #444444;
      --progress-bg: #e0d8f8;
      --prog-fill:   #000000;
      --shadow:      rgba(0,0,0,0.10);
    }

    @media (prefers-color-scheme: dark) {
      .root {
        --col-bg:      #000000;
        --text-on-col: #ffffff;
        --border-col:  #ffffff;
        --line-color:  #ffffff;
        --overlay-bg:  rgba(0,0,0,0.55);
        --panel-bg:    #000000;
        --panel-border:#ffffff;
        --panel-text:  #ffffff;
        --panel-muted: #bbbbbb;
        --progress-bg: #333333;
        --prog-fill:   #ffffff;
        --shadow:      rgba(255,255,255,0.06);
      }
    }

    /* Cursor dot — positioned via JS using page coords, lives outside shadow */

    .app {
      display: flex;
      width: 100%;
      height: 100%;
      background: var(--col-bg);
    }

    .col {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
      user-select: none;
      cursor: none;
      background: var(--col-bg);
    }

    .col:nth-child(1) { border-right: 1px solid var(--border-col); }
    .col:nth-child(2) { border-right: 1px solid var(--border-col); }
    .col:nth-child(3) { border-right: 1px solid var(--border-col); }

    .col-divider {
      position: absolute;
      top: 62px;
      left: 0;
      width: 100%;
      height: 1px;
      background: var(--border-col);
      opacity: 0.12;
      pointer-events: none;
      z-index: 2;
    }

    .col-line {
      position: absolute;
      left: 0;
      width: 100%;
      height: 1px;
      background: var(--line-color);
      top: 0;
      pointer-events: none;
      z-index: 4;
      opacity: 0;
    }

    .col-label {
      position: relative;
      z-index: 2;
      padding-top: 28px;
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--text-on-col);
      pointer-events: none;
      font-weight: 700;
    }

    .col-value {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 50%;
      z-index: 2;
      display: flex;
      align-items: baseline;
      gap: 0.3em;
      opacity: 0;
      pointer-events: none;
      white-space: nowrap;
    }

    .col-number {
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
      color: var(--text-on-col);
    }

    .col-unit {
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-on-col);
    }

    /* ---- Overlay ---- */
    .overlay {
      position: absolute;
      inset: 0;
      background: var(--overlay-bg);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.22s ease;
    }
    .overlay.visible {
      opacity: 1;
      pointer-events: all;
    }

    .overlay-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .overlay-heading {
      font-family: 'Courier New', Courier, monospace;
      font-size: clamp(18px, 2.5vw, 28px);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #2a9a4a;
      text-align: center;
    }

    .summary {
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      width: min(560px, 88vw);
      position: relative;
      overflow: hidden;
      animation: riseUp 0.22s cubic-bezier(0.16,1,0.3,1) both;
      box-shadow: 0 24px 64px var(--shadow);
    }

    @keyframes riseUp {
      from { transform: translateY(16px) scale(0.98); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }

    .progress-track {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: var(--progress-bg);
      z-index: 10;
    }
    .progress-fill {
      height: 100%;
      background: var(--prog-fill);
      width: 100%;
      transform-origin: left center;
      will-change: transform;
    }

    .summary-inner {
      padding: 40px 40px 28px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
    }

    .stat-block {
      padding: 0 24px 0 0;
      border-right: 1px solid var(--panel-border);
      margin-right: 24px;
    }
    .stat-block:last-child {
      border-right: none;
      margin-right: 0;
      padding-right: 0;
    }

    .stat-num {
      font-family: 'Courier New', Courier, monospace;
      font-size: clamp(36px, 5vw, 64px);
      font-weight: 700;
      line-height: 1;
      color: var(--panel-text);
      display: block;
    }

    .stat-lbl {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--panel-text);
      display: block;
      font-weight: 700;
      margin-top: 8px;
    }
  `;
  shadow.appendChild(style);

  // ---- HTML ----
  const root = document.createElement('div');
  root.className = 'root';
  root.innerHTML = `
    <div class="app" role="main">
      <div class="col" data-mode="characters" data-min="50" data-max="1000" role="button" tabindex="0" aria-label="Characters: hover down to set amount, click to generate">
        <span class="col-label">Characters</span>
        <div class="col-divider"></div>
        <div class="col-line"></div>
        <div class="col-value"><span class="col-number">—</span><span class="col-unit">chars</span></div>
      </div>
      <div class="col" data-mode="words" data-min="5" data-max="200" role="button" tabindex="0" aria-label="Words: hover down to set amount, click to generate">
        <span class="col-label">Words</span>
        <div class="col-divider"></div>
        <div class="col-line"></div>
        <div class="col-value"><span class="col-number">—</span><span class="col-unit">words</span></div>
      </div>
      <div class="col" data-mode="sentences" data-min="1" data-max="20" role="button" tabindex="0" aria-label="Sentences: hover down to set amount, click to generate">
        <span class="col-label">Sentences</span>
        <div class="col-divider"></div>
        <div class="col-line"></div>
        <div class="col-value"><span class="col-number">—</span><span class="col-unit">sentences</span></div>
      </div>
      <div class="col" data-mode="paragraphs" data-min="1" data-max="10" role="button" tabindex="0" aria-label="Paragraphs: hover down to set amount, click to generate">
        <span class="col-label">Paragraphs</span>
        <div class="col-divider"></div>
        <div class="col-line"></div>
        <div class="col-value"><span class="col-number">—</span><span class="col-unit">paragraphs</span></div>
      </div>
    </div>

    <div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-label="Generated text">
      <div class="overlay-inner">
        <div class="overlay-heading">Copied to clipboard</div>
        <div class="summary">
          <div class="progress-track">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="summary-inner">
            <div class="stat-block">
              <span class="stat-num" id="stat-n">—</span>
              <span class="stat-lbl" id="stat-mode-lbl">—</span>
            </div>
            <div class="stat-block">
              <span class="stat-num" id="stat-b">—</span>
              <span class="stat-lbl" id="stat-b-lbl">—</span>
            </div>
            <div class="stat-block">
              <span class="stat-num" id="stat-c">—</span>
              <span class="stat-lbl" id="stat-c-lbl">—</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  shadow.appendChild(root);

  // ---- Cursor dot (lives in main document, not shadow, so it renders on top of everything) ----
  const dot = document.createElement('div');
  Object.assign(dot.style, {
    position:     'fixed',
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
    background:   window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
    pointerEvents:'none',
    zIndex:       '2147483647',
    transform:    'translate(-50%, -50%)',
    opacity:      '0',
  });
  document.body.appendChild(dot);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    dot.style.background = e.matches ? '#ffffff' : '#000000';
  });

  document.addEventListener('mousemove', e => {
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';
  });

  // ---- Shadow-scoped query helpers ----
  const $  = sel => shadow.querySelector(sel);
  const $$ = sel => shadow.querySelectorAll(sel);

  // ---- Corpus ----
  const W = [
    "lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do",
    "eiusmod","tempor","incididunt","ut","labore","et","dolore","magna","aliqua","enim",
    "ad","minim","veniam","quis","nostrud","exercitation","ullamco","laboris","nisi",
    "aliquip","ex","ea","commodo","consequat","duis","aute","irure","in","reprehenderit",
    "voluptate","velit","esse","cillum","eu","fugiat","nulla","pariatur","excepteur","sint",
    "occaecat","cupidatat","non","proident","sunt","culpa","qui","officia","deserunt",
    "mollit","anim","id","est","laborum","perspiciatis","unde","omnis","iste","natus",
    "error","voluptatem","accusantium","doloremque","laudantium","totam","rem","aperiam",
    "eaque","ipsa","quae","ab","illo","inventore","veritatis","quasi","architecto","beatae",
    "vitae","dicta","explicabo","nemo","ipsam","quia","voluptas","aspernatur","aut","odit",
    "fugit","consequuntur","magni","dolores","eos","ratione","sequi","nesciunt","neque",
    "porro","quisquam","dolorem","adipisci","numquam","eius","modi","tempora","incidunt",
    "quaerat","soluta","nobis","eligendi","optio","cumque","nihil","impedit","minus",
    "quod","maxime","placeat","facere","possimus","assumenda","repellendus","temporibus",
    "autem","quibusdam","officiis","debitis","rerum","necessitatibus","saepe","eveniet",
    "reiciendis","voluptates","maiores","alias","perferendis","doloribus","asperiores",
    "repellat","perspiciatis","aperiam","inventore","veritatis","architecto","molestiae"
  ];

  const rw  = () => W[Math.floor(Math.random() * W.length)];
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  function sentence() {
    const n = rnd(6, 18), words = Array.from({ length: n }, rw);
    if (n > 9 && Math.random() > 0.4) words[rnd(3, Math.floor(n / 2))] += ',';
    return cap(words.join(' ')) + '.';
  }
  const paragraph = () => Array.from({ length: rnd(3, 7) }, sentence).join(' ');
  const genChars  = n => { let s = ''; while (s.length < n) s += (s ? ' ' : '') + rw(); return cap(s.slice(0, n)); };
  const genWords  = n => cap(Array.from({ length: n }, rw).join(' ')) + '.';
  const genSents  = n => Array.from({ length: n }, sentence).join(' ');
  const genParas  = n => Array.from({ length: n }, paragraph).join('\n\n');

  function generate(mode, n) {
    if (mode === 'characters') return genChars(n);
    if (mode === 'words')      return genWords(n);
    if (mode === 'sentences')  return genSents(n);
    if (mode === 'paragraphs') return genParas(n);
  }

  // ---- Clipboard ----
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  // ---- Font calibration ----
  // Probe is appended to document.body (not shadow) to get accurate metrics
  function calibrateFontSize() {
    const cols = $$('.col');
    if (!cols.length) return;
    const colWidth = cols[0].getBoundingClientRect().width;
    if (!colWidth) return;
    const FILL = 0.72;
    const probeStrings = ['1000 chars', '200 words', '20 sentences', '10 paragraphs',
                          'Characters', 'Sentences', 'Paragraphs', 'Words'];
    const probe = document.createElement('span');
    probe.style.cssText = [
      'position:absolute', 'visibility:hidden', 'white-space:nowrap',
      "font-family:'Courier New',Courier,monospace",
      'font-weight:700', 'letter-spacing:0.2em', 'font-size:100px'
    ].join(';');
    document.body.appendChild(probe);
    let size = Infinity;
    probeStrings.forEach(str => {
      probe.textContent = str;
      const w = probe.getBoundingClientRect().width;
      size = Math.min(size, (colWidth * FILL / w) * 100);
    });
    document.body.removeChild(probe);
    const px = Math.max(10, Math.floor(size)) + 'px';
    $$('.col-number, .col-unit, .col-label').forEach(el => el.style.fontSize = px);
  }

  if (document.readyState === 'complete') {
    calibrateFontSize();
  } else {
    window.addEventListener('load', calibrateFontSize);
  }
  window.addEventListener('resize', calibrateFontSize);

  // ---- Columns ----
  const LABEL_H = 70;

  $$('.col').forEach(col => {
    const mode   = col.dataset.mode;
    const min    = parseInt(col.dataset.min);
    const max    = parseInt(col.dataset.max);
    const numEl  = col.querySelector('.col-number');
    const valEl  = col.querySelector('.col-value');
    const lineEl = col.querySelector('.col-line');
    let   val    = 0;

    function setVal(v) {
      val = Math.max(0, Math.min(max, Math.round(v)));
      numEl.textContent = val === 0 ? '—' : val;
    }

    col.addEventListener('mouseenter', () => { dot.style.opacity = '1'; });

    col.addEventListener('mouseleave', () => {
      dot.style.opacity    = '0';
      lineEl.style.opacity = '0';
      valEl.style.opacity  = '0';
      setVal(0);
    });

    col.addEventListener('mousemove', e => {
      const r              = col.getBoundingClientRect();
      const y              = e.clientY - r.top;
      const valH           = valEl.getBoundingClientRect().height;
      const FLIP_THRESHOLD = r.height - valH - 12;
      const hidden         = y <= LABEL_H;
      const above          = y >= FLIP_THRESHOLD;

      lineEl.style.top      = y + 'px';
      lineEl.style.opacity  = hidden ? '0' : '1';
      valEl.style.top       = y + 'px';
      valEl.style.opacity   = hidden ? '0' : '1';
      valEl.style.marginTop = above ? (-valH - 12) + 'px' : '6px';

      if (hidden) {
        setVal(0);
      } else {
        const pct = (y - LABEL_H) / (r.height - LABEL_H);
        setVal(min + pct * (max - min));
      }
    });

    col.addEventListener('click', () => {
      if (val < min) return;
      const text = generate(mode, val);
      copyToClipboard(text);
      openSummary(mode, val, text);
    });

    col.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const mid  = Math.round((min + max) / 2);
        const text = generate(mode, mid);
        copyToClipboard(text);
        openSummary(mode, mid, text);
      }
    });
  });

  // ---- Overlay ----
  const overlay  = $('#overlay');
  const progFill = $('#progress-fill');
  const statN    = $('#stat-n');
  const statMLbl = $('#stat-mode-lbl');
  const statB    = $('#stat-b');
  const statBLbl = $('#stat-b-lbl');
  const statC    = $('#stat-c');
  const statCLbl = $('#stat-c-lbl');

  const DURATION = 3000;
  let rafId, startTime, remaining = DURATION;

  function openSummary(mode, n, text) {
    const chars = text.length;
    const words = text.split(/\s+/).filter(Boolean).length;
    const sents = (text.match(/[.!?]+/g) || []).length;
    const paras = text.split(/\n\n+/).filter(Boolean).length;

    const stats = {
      words:      { val: words, lbl: 'Words'      },
      characters: { val: chars, lbl: 'Characters' },
      sentences:  { val: sents, lbl: 'Sentences'  },
      paragraphs: { val: paras, lbl: 'Paragraphs' },
    };

    statN.textContent    = n;
    statMLbl.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);

    const [b, c] = ['words', 'characters', 'sentences', 'paragraphs'].filter(k => k !== mode);
    statB.textContent    = stats[b].val.toLocaleString();
    statBLbl.textContent = stats[b].lbl;
    statC.textContent    = stats[c].val.toLocaleString();
    statCLbl.textContent = stats[c].lbl;

    overlay.classList.add('visible');
    remaining = DURATION;
    progFill.style.transform = 'scaleX(1)';
    startCountdown();
  }

  function closeOverlay() {
    overlay.classList.remove('visible');
    cancelAnimationFrame(rafId);
    remaining = DURATION;
    progFill.style.transform = 'scaleX(1)';
  }

  function startCountdown() {
    cancelAnimationFrame(rafId);
    startTime = performance.now();
    tick();
  }

  function tick(now) {
    now = now || performance.now();
    const left = Math.max(0, remaining - (now - startTime));
    progFill.style.transform = `scaleX(${left / DURATION})`;
    if (left <= 0) { closeOverlay(); return; }
    rafId = requestAnimationFrame(tick);
  }

  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });

})();
