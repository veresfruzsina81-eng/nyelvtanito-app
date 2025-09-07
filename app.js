// ========== diag ==========
const diagEl = document.getElementById('diag');
function setDiag(text, ok=false){
  if(!diagEl) return;
  diagEl.textContent = text;
  diagEl.style.background = ok ? '#e6ffed' : '#fff4cc';
  diagEl.style.color = ok ? '#155724' : '#7a5b00';
}
window.onerror = (m,src,l,c)=> setDiag(`Hiba: ${m} @ ${l}:${c}`);

// ========== init ==========
(function(){
  if(!window.PIXI){ setDiag('Hiba: PixiJS nem töltődött be.'); return; }

  // elemek
  const stageWrap = document.getElementById('stageWrap');
  const fileInput  = document.getElementById('fileInput');
  const makeChar   = document.getElementById('makeChar');
  const genMascot  = document.getElementById('genMascot');
  const testBtn    = document.getElementById('testBtn');
  const bgSelect   = document.getElementById('bgSelect');
  const storyEl    = document.getElementById('story');
  const playBtn    = document.getElementById('playStory');
  const waveBtn    = document.getElementById('waveBtn');
  const walkBtn    = document.getElementById('walkBtn');
  const jumpBtn    = document.getElementById('jumpBtn');
  const danceBtn   = document.getElementById('danceBtn');
  const talkBtn    = document.getElementById('talkBtn');
  const stopAllBtn = document.getElementById('stopAll');
  const exitPlay   = document.getElementById('exitPlay');
  const accentSel  = document.getElementById('accent');
  const chkWave = document.getElementById('anim-wave');
  const chkWalk = document.getElementById('anim-walk');
  const chkJump = document.getElementById('anim-jump');
  const chkDance= document.getElementById('anim-dance');
  const autoBtn    = document.getElementById('autoStory');
  const minutesSel = document.getElementById('storyMinutes');
  const heroName = document.getElementById('heroName');
  const heroAge  = document.getElementById('heroAge');
  const heroBuddy= document.getElementById('heroBuddy');
  const heroWorld= document.getElementById('heroWorld');

  // Pixi
  const app = new PIXI.Application({ resizeTo: stageWrap, backgroundAlpha: 0, antialias: true });
  stageWrap.appendChild(app.view);
  const bgLayer = new PIXI.Container();
  const charLayer = new PIXI.Container();
  app.stage.addChild(bgLayer, charLayer);

  // állapot
  let mode='mascot'; let mascot=null; let sprite=null; let talkingInterval=null; let selectedFile=null;

  // háttér
  function drawBackground(type='forest'){
    bgLayer.removeChildren();
    const w = app.renderer.width, h = app.renderer.height, add = g=>bgLayer.addChild(g);
    const sky = new PIXI.Graphics();
    if (type==='space'){
      sky.beginFill(0x0d1137).drawRect(0,0,w,h).endFill(); add(sky);
      for(let i=0;i<120;i++){ const s=new PIXI.Graphics();
        s.beginFill(0xffffff, Math.random()*0.8+0.2).drawCircle(0,0, Math.random()*2+0.5).endFill();
        s.x=Math.random()*w; s.y=Math.random()*h*0.8; add(s);
      }
    } else if (type==='beach'){
      sky.beginFill(0x87ceeb).drawRect(0,0,w,h*0.55).endFill(); add(sky);
      const sea=new PIXI.Graphics(); sea.beginFill(0x2aa7ff).drawRect(0,h*0.55,w,h*0.25).endFill(); add(sea);
      const sand=new PIXI.Graphics(); sand.beginFill(0xf4d195).drawRect(0,h*0.80,w,h*0.20).endFill(); add(sand);
    } else {
      sky.beginFill(0x9fe7ff).drawRect(0,0,w,h).endFill(); add(sky);
      const ground=new PIXI.Graphics(); ground.beginFill(0x9be39b).drawRect(0,h*0.8,w,h*0.2).endFill(); add(ground);
      for(let i=0;i<6;i++){
        const x=(i+0.5)*w/6 + (Math.random()*40-20);
        const trunk=new PIXI.Graphics(); trunk.beginFill(0x7a4b1f).drawRect(-8,0,16,80).endFill();
        trunk.x=x; trunk.y=h*0.8-80;
        const crown=new PIXI.Graphics(); crown.beginFill(0x2f9e44).drawCircle(0,-30,45).endFill();
        const tree=new PIXI.Container(); tree.addChild(trunk,crown); add(tree);
      }
    }
  }

  // maszk
  function buildMascot(){
    mode='mascot'; charLayer.removeChildren(); sprite=null;
    const body=new PIXI.Graphics(); body.beginFill(0x4aa3ff).drawEllipse(0,0,70,90).endFill();
    const belly=new PIXI.Graphics(); belly.beginFill(0xffffff).drawEllipse(0,25,38,32).endFill();
    const earL=new PIXI.Graphics(); earL.beginFill(0x4aa3ff).drawEllipse(-55,-70,22,38).endFill();
    const earR=new PIXI.Graphics(); earR.beginFill(0x4aa3ff).drawEllipse(55,-70,22,38).endFill();
    const eyeL=new PIXI.Graphics(); eyeL.beginFill(0xffffff).drawCircle(-22,-20,14).endFill();
    const eyeLp=new PIXI.Graphics(); eyeLp.beginFill(0x002244).drawCircle(-18,-18,6).endFill();
    const eyeR=new PIXI.Graphics(); eyeR.beginFill(0xffffff).drawCircle(22,-20,14).endFill();
    const eyeRp=new PIXI.Graphics(); eyeRp.beginFill(0x002244).drawCircle(18,-18,6).endFill();
    const mouth=new PIXI.Graphics(); mouth.lineStyle(4,0x002244).moveTo(-15,10).quadraticCurveTo(0,25,15,10);
    const armL=new PIXI.Graphics(); armL.beginFill(0x4aa3ff).drawRoundedRect(-88,-8,30,16,8).endFill();
    const armR=new PIXI.Graphics(); armR.beginFill(0x4aa3ff).drawRoundedRect(58,-8,30,16,8).endFill();
    const legL=new PIXI.Graphics(); legL.beginFill(0x4aa3ff).drawRoundedRect(-30,80,20,26,6).endFill();
    const legR=new PIXI.Graphics(); legR.beginFill(0x4aa3ff).drawRoundedRect(10,80,20,26,6).endFill();

    mascot=new PIXI.Container();
    mascot.addChild(earL,earR,body,belly,eyeL,eyeLp,eyeR,eyeRp,mouth,armL,armR,legL,legR);
    mascot.mouth=mouth; mascot.armR=armR;
    charLayer.addChild(mascot);
    centerCharacter();
    wave();
  }

  function centerCharacter(){
    const W=app.renderer.width, H=app.renderer.height;
    if(mascot){ mascot.x=W/2; mascot.y=H*0.75-60; }
    if(sprite){ sprite.x=W/2; sprite.y=H*0.8; }
  }

  // képből karakter
  async function buildFromFile(file){
    try{
      const url = URL.createObjectURL(file);
      const base = await PIXI.Assets.load(url);
      sprite = new PIXI.Sprite(base);
      sprite.anchor.set(0.5, 1.0);
      // illesztés a színpadhoz
      const maxW = app.renderer.width * 0.35;  // a vászon ~35%-a
      const maxH = app.renderer.height * 0.55;
      const s = Math.min(maxW / sprite.texture.width, maxH / sprite.texture.height);
      sprite.scale.set(s);
      mode='image';
      charLayer.removeChildren();
      charLayer.addChild(sprite);
      centerCharacter();
      wave();
      setDiag('Képből karakter kész! ✅', true);
    }catch(e){
      setDiag('Kép betöltési hiba: '+e.message);
    }
  }

  // események
  document.addEventListener('visibilitychange', ()=> window.speechSynthesis.cancel());
  testBtn.addEventListener('click', ()=> alert('TESZT OK – eventek élnek ✅'));
  genMascot.addEventListener('click', buildMascot);
  bgSelect.addEventListener('change', ()=>{ drawBackground(bgSelect.value); centerCharacter(); });

  fileInput.addEventListener('change', (e)=>{
    selectedFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    makeChar.disabled = !selectedFile;
    if(selectedFile){ setDiag('Kép kiválasztva – nyomd meg: „Képből karakter”', true); }
  });
  makeChar.addEventListener('click', ()=>{
    if(!selectedFile){ setDiag('Előbb válassz képet!'); return; }
    buildFromFile(selectedFile);
  });

  // alap rajz
  drawBackground(bgSelect.value);
  buildMascot();
  app.renderer.on('resize', ()=>{ drawBackground(bgSelect.value); centerCharacter(); });
  window.addEventListener('resize', ()=>{ drawBackground(bgSelect.value); centerCharacter(); });

  // mikromozgás
  let tt=0; app.ticker.add((d)=>{ tt+=d; const o=mode==='mascot'?mascot:sprite; if(o) o.scale.y=1+Math.sin(tt/30)*0.02; });

  // animációk
  function wave(){ const o=mode==='mascot'?mascot?.armR:sprite; if(!o) return;
    let dir=1,c=0,base=o.rotation; const id=setInterval(()=>{ o.rotation=base+dir*0.45; dir*=-1; if(++c>8){ clearInterval(id); o.rotation=base; } },120); }
  function walk(){ const o=mode==='mascot'?mascot:sprite; if(!o) return;
    const tx=Math.random()*(app.renderer.width*0.8)+app.renderer.width*0.1;
    const id=setInterval(()=>{ const dx=tx-o.x; if(Math.abs(dx)<2){ clearInterval(id); return; }
      o.x+=Math.sign(dx)*Math.min(6,Math.abs(dx)/10); o.y+=Math.sin(tt/3)*0.6; },16); }
  function jump(){ const o=mode==='mascot'?mascot:sprite; if(!o) return;
    let v=-10, by=o.y; const id=setInterval(()=>{ o.y+=v; v+=0.7; if(o.y>=by){ o.y=by; clearInterval(id);} },16); }
  function dance(){ const o=mode==='mascot'?mascot:sprite; if(!o) return;
    let k=0, br=o.rotation, bs=o.scale.x; const id=setInterval(()=>{ k+=0.2; o.rotation=br+Math.sin(k)*0.25; o.scale.x=bs+Math.sin(k*2)*0.08; },16);
    setTimeout(()=>{ clearInterval(id); o.rotation=br; o.scale.x=bs; },2600); }

  waveBtn.addEventListener('click', wave);
  walkBtn.addEventListener('click', walk);
  jumpBtn.addEventListener('click', jump);
  danceBtn.addEventListener('click', dance);

  // TTS
  let voices=[]; function loadVoices(){ voices=window.speechSynthesis.getVoices(); }
  loadVoices(); window.speechSynthesis.onvoiceschanged=loadVoices;
  function pickVoice(lang){ if(!voices.length) return null;
    if (lang==='hu-HU'){ let v=voices.find(v=>/Hungarian/i.test(v.name)||v.lang==='hu-HU'); if(v) return v; }
    let v=voices.find(v=>v.lang===lang && /Google|Microsoft|Apple/i.test(v.name)); if(v) return v;
    const pref=lang.split('-')[0]; v=voices.find(v=>v.lang?.startsWith(pref) && /Google|Microsoft|Apple/i.test(v.name)); if(v) return v;
    v=voices.find(v=>v.lang?.startsWith(pref)); return v||voices[0]||null; }
  function pronounceFix(t){ if(accentSel.value==='hu-HU'){ t=t.replace(/\bKiara\b/g,'Kiára'); } return t; }
  function stopTalking(){ if(talkingInterval){ clearInterval(talkingInterval); talkingInterval=null; }
    const o=mode==='mascot'?mascot:sprite; if(o) o.scale.set(1,1); }
  function speak(text){
    if(!text) return;
    const lang=accentSel.value||'hu-HU';
    const u=new SpeechSynthesisUtterance(pronounceFix(text.replace(/<[^>]+>/g,'')));
    const v=pickVoice(lang); u.lang=lang; if(v) u.voice=v; u.rate=1.0; u.pitch=1.0;
    if(!v && lang==='hu-HU'){ setDiag('Figyelem: nincs magyar TTS hang a rendszerben.', false); }
    stopTalking();
    const o=mode==='mascot'?mascot:sprite; let ph=0;
    talkingInterval=setInterval(()=>{ if(!o) return; o.scale.y=1+Math.sin(ph)*0.015; ph+=0.6; },50);
    u.onend=stopTalking; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  }
  talkBtn.addEventListener('click', ()=>{ const t=storyEl.value.trim(); if(t) speak(t); });

  function pickAllowedAnim(){ const a=[]; if(chkWave.checked)a.push(wave); if(chkWalk.checked)a.push(walk);
    if(chkJump.checked)a.push(jump); if(chkDance.checked)a.push(dance); return a.length?a:[wave]; }

  // teljes képernyő kezelése
  async function enterFullscreen(){
    document.body.classList.add('playing');
    const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen().catch(()=>{});
  }
  async function exitFullscreen(){
    document.body.classList.remove('playing');
    if (document.fullscreenElement) await document.exitFullscreen().catch(()=>{});
  }

  function startPlayback(){
    const txt=storyEl.value.trim(); if(!txt){ setDiag('Nincs szöveg a meséhez. Generálj vagy írj!', false); return; }
    const parts=txt.split(/\n+/).filter(Boolean); let i=0; const allowed=pickAllowedAnim();
    const runNext=()=>{ if(i>=parts.length) return; const line=parts[i++]; const fn=allowed[Math.floor(Math.random()*allowed.length)];
      fn(); speak(line); setTimeout(runNext, Math.max(2000, Math.min(7000, line.length*80))); };
    runNext();
  }

  playBtn.addEventListener('click', async ()=>{
    await enterFullscreen();
    startPlayback();
  });

  // overlay vissza
  async function stopAndBack(){
    window.speechSynthesis.cancel(); stopTalking();
    await exitFullscreen();
  }
  exitPlay.addEventListener('click', stopAndBack);
  stopAllBtn.addEventListener('click', stopAndBack);

  // Auto mese (backend -> fallback)
  function deRepeat(t){ t=t.replace(/\b(\w+)(\s+\1){1,}\b/gi,'$1');
    const L=t.split(/\n+/).map(s=>s.trim()).filter(Boolean), out=[];
    for(let i=0;i<L.length;i++){ if(out.length && out[out.length-1].toLowerCase()===L[i].toLowerCase()) continue; out.push(L[i]); }
    return out.join('\n\n'); }
  async function localGenerate(minutes, meta){
    const {name, age, buddy, world}=meta;
    const paras=Math.min(6, Math.max(3, minutes+2));
    const sentences=Math.min(6, Math.max(3, minutes+2));
    let txt=`Egyszer volt, hol nem volt, élt egy ${age||'kis'} éves hős, akit úgy hívtak: ${name||'Lili'}. `+
            `Egy nap különös kaland kezdődött: ${world||'erdei kaland'}. Vele tartott a barátja, a ${buddy||'kis barát'}.`;
    txt+='\n\n'; for(let p=0;p<paras;p++){ let para=[];
      for(let s=0;s<sentences;s++){ para.push(`${name||'Lili'} és a ${buddy||'kis barát'} bátran haladt tovább, és minden fordulatnál új csodát fedeztek fel.`); }
      txt+=para.join(' ')+'\n\n'; }
    txt+='A nap végén megtanulták: a kedvesség és az összetartás mindig segít. VÉGE.'; return deRepeat(txt);
  }
  autoBtn.addEventListener('click', async ()=>{
    const minutes=parseInt(minutesSel.value,10)||3;
    const meta={ name:(heroName.value||'').trim(), age:parseInt(heroAge.value||''), buddy:(heroBuddy.value||'').trim(), world:heroWorld.value };
    storyEl.value='✨ Mese készül…';
    try{
      const r=await fetch('/.netlify/functions/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'storyGen',minutes,meta})});
      if(r.ok){ const d=await r.json(); if(d.story){ storyEl.value=deRepeat(d.story.trim()); setDiag('Function válaszol ✅', true); return; } }
      storyEl.value=await localGenerate(minutes, meta); setDiag('Helyi generálás ✅', true);
    }catch{ storyEl.value=await localGenerate(minutes, meta); setDiag('Helyi generálás ✅', true); }
  });

  setDiag('INIT OK ✅', true);
})();
