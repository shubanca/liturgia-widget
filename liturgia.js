/*  Liturgia Diária – widget compacto para Blogger
    (c) domínio público, Adriano & ChatGPT
    Usa AllOrigins como proxy CORS.
---------------------------------------------------- */
(function(){
  const dst = document.currentScript.dataset.target || 'liturgia-hoje';
  const root = document.getElementById(dst);
  if(!root){ console.error('[Liturgia] div destino não existe.'); return; }

  // CSS injetado no shadow root para isolar do tema
  const css = `
    :host{all:initial;font-family:Segoe UI,Roboto,sans-serif;display:block;color:#333}
    h3{margin:.4em 0;font-size:1.1rem}
    .bar{display:flex;border-bottom:2px solid #ddd;margin-bottom:.6em}
    .bar button{flex:1;padding:.4em;border:none;background:#fafafa;cursor:pointer;font-size:.9rem}
    .bar button.active{background:#fff;border-bottom:3px solid #8c7ae6;font-weight:600}
    .loading,.err{text-align:center;color:#777;margin:1em 0}
  `;

  /* ---------- helpers ---------- */
  const pad=n=>n.toString().padStart(2,'0');
  const color={'VERDE':'#4CAF50','VERMELHO':'#C62828','ROXO':'#673AB7','BRANCO':'#999'};

  /* ---------- shadow root ---------- */
  const shadow = root.attachShadow({mode:'open'});
  const style = document.createElement('style'); style.textContent = css;
  const wrapper = document.createElement('div'); shadow.append(style, wrapper);

  function render(html){ wrapper.innerHTML = html; }

  /* ---------- fetch liturgia ---------- */
  async function load(d=new Date()){
    render(`<p class="loading">Carregando leituras…</p>`);
    const url=`https://liturgia.up.railway.app/v2/?dia=${pad(d.getDate())}&mes=${pad(d.getMonth()+1)}&ano=${d.getFullYear()}`;
    const prox=`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    try{
      const r=await fetch(prox); if(!r.ok) throw 0;
      const j=await r.json();
      const leit = {
        primeira: j.primeiraLeitura || j.leituras?.primeiraLeitura,
        salmo:    j.salmo           || j.leituras?.salmo,
        evangelho:j.evangelho       || j.leituras?.evangelho
      };
      makeUI(leit, (j.cor||'VERDE').toUpperCase(), d);
    }catch(e){
      render(`<p class="err">Falha ao carregar leituras.</p>`);
    }
  }

  /* ---------- montar UI ---------- */
  function makeUI(leituras, cor, d){
    const abas = ['primeira','salmo','evangelho'];
    let atual = 'primeira';

    function htmlAba(){
      const b = leituras[atual];
      if(!b) return '<p class="err">Leitura indisponível.</p>';
      const tit = b.titulo||b.referencia||'';
      const txt = b.conteudo||b.texto||'';
      return `<h3>${tit}</h3>${txt}`;
    }

    function draw(){
      render(`
        <div style="border-left:6px solid ${color[cor]||'#4CAF50'};padding-left:.6em">
          <strong>${d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</strong>
        </div>
        <div class="bar">
          ${abas.map(a=>`<button data-a="${a}" class="${a===atual?'active':''}">${a==='primeira'?'1ª Leitura':a.charAt(0).toUpperCase()+a.slice(1)}</button>`).join('')}
        </div>
        ${htmlAba()}
        <p style="text-align:right;font-size:.7rem;color:#666;margin-top:1em">Fonte: liturgia.up.railway.app</p>
      `);
      shadow.querySelectorAll('.bar button').forEach(btn=>{
        btn.onclick = ()=>{ atual = btn.dataset.a; draw(); };
      });
    }
    draw();
  }

  /* ---------- inicial ---------- */
  load();
})();
