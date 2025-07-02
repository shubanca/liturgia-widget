/*  Liturgia Diária – widget compacto para Blogger
    (c) domínio público, Adriano & ChatGPT

    ▸ Busca as leituras do dia na API liturgia.up.railway.app
    ▸ Passa por AllOrigins (CORS-free)
    ▸ Shadow DOM p/ não brigar com o tema
    ▸ Abas: 1ª Leitura • Salmo • Evangelho
    ▸ Proteção contra data/hora errada no PC do visitante
------------------------------------------------------------------*/
(function(){

  /* ---------- Configurações ---------- */
  const TARGET_ID = document.currentScript.dataset.target || 'liturgia-hoje';
  const rootDiv   = document.getElementById(TARGET_ID);
  if (!rootDiv){ console.error('[Liturgia] div destino não existe.'); return; }

  /* ---------- CSS isolado ---------- */
  const css = `
    :host{all:initial;font-family:Segoe UI,Roboto,sans-serif;display:block;color:#333}
    h3{margin:.4em 0;font-size:1.1rem}
    .cab{display:flex;align-items:center;gap:.4rem;margin-bottom:.4rem}
    .cor{width:6px;height:100%;border-radius:2px}
    .data{font-weight:700}
    .bar{display:flex;border-bottom:2px solid #ddd;margin:.6em 0}
    .bar button{flex:1;padding:.4em;border:none;background:#fafafa;cursor:pointer;font-size:.9rem}
    .bar button.active{background:#fff;border-bottom:3px solid #8c7ae6;font-weight:600}
    .loading,.err{text-align:center;color:#777;margin:1em 0}
    audio{width:100%;margin-top:1rem}
    .credit{font-size:.7rem;color:#666;text-align:right;margin-top:1em}
  `;

  /* ---------- helpers ---------- */
  const pad=n=>n.toString().padStart(2,'0');
  const COLORS={'VERDE':'#4CAF50','VERMELHO':'#C62828','ROXO':'#673AB7','BRANCO':'#999'};

  /* ---------- shadow root ---------- */
  const shadow = rootDiv.attachShadow({mode:'open'});
  shadow.innerHTML = `<style>${css}</style><div id="wrap"></div>`;
  const wrap = shadow.querySelector('#wrap');
  const render = html => wrap.innerHTML = html;

  /* ---------- data protegida (UTC) ---------- */
  const nowUTC = new Date(Date.now() - (new Date().getTimezoneOffset()*60000));

  /* ---------- busca leituras ---------- */
  async function load(d = nowUTC){
    render('<p class="loading">Carregando leituras…</p>');
    const url = `https://liturgia.up.railway.app/v2/?dia=${pad(d.getDate())}&mes=${pad(d.getMonth()+1)}&ano=${d.getFullYear()}`;
    const prox= `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    try{
      const r = await fetch(prox);
      if(!r.ok) throw 0;
      const j = await r.json();

      const leit = {
        primeira : j.primeiraLeitura || j.leituras?.primeiraLeitura,
        salmo    : j.salmo           || j.leituras?.salmo,
        evangelho: j.evangelho       || j.leituras?.evangelho
      };
      const cor = (j.cor||'VERDE').toUpperCase();
      makeUI(leit, cor, d);
    }catch(e){
      render('<p class="err">Falha ao carregar leituras.</p>');
    }
  }

  /* ---------- monta interface ---------- */
  function makeUI(leituras, cor, d){
    const tabs = ['primeira','salmo','evangelho'];
    let   cur  = 'primeira';

    const fmt = d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});

    const htmlAba = () =>{
      const b = leituras[cur];
      if(!b) return '<p class="err">Leitura indisponível.</p>';
      const t = b.titulo||b.referencia||'';
      const c = b.conteudo||b.texto||'';
      const a = b.audio||b.audioUrl||'';
      return `<h3>${t}</h3>${c}${a?`<audio controls src="${a}"></audio>`:''}`;
    };

    const draw = ()=>{
      render(`
        <div class="cab">
          <div class="cor" style="background:${COLORS[cor]||'#4CAF50'}"></div>
          <span class="data">${fmt}</span>
        </div>

        <div class="bar">
          ${tabs.map(t=>`<button data-t="${t}" class="${t===cur?'active':''}">
              ${t==='primeira'?'1ª Leitura':t.charAt(0).toUpperCase()+t.slice(1)}
            </button>`).join('')}
        </div>

        ${htmlAba()}
        <p class="credit">Fonte: liturgia.up.railway.app</p>
      `);

      shadow.querySelectorAll('.bar button').forEach(btn=>{
        btn.onclick = ()=>{ cur = btn.dataset.t; draw(); };
      });
    };
    draw();
  }

  /* ---------- inicia ---------- */
  load();

})();
