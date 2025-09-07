// =============== Diagnosztika ===============
const diagEl = document.getElementById('diag');
function setDiag(text, ok=false){
  if(!diagEl) return;
  diagEl.textContent = text;
  diagEl.style.background = ok ? '#e6ffed' : '#fff4cc';
  diagEl.style.color = ok ? '#155724' : '#7a5b00';
}

// Globális JS hiba megjelenítése
window.onerror = function(msg, src, line, col){
  setDiag(`Hiba: ${msg} @ ${src}:${line}:${col}`);
};

// =============== Indítás ===============
(function init(){
  try{
    if(!window.PIXI){
      setDiag('Hiba: PixiJS nem töltődött be. (CDN?)');
      return;
    }

    // Gyors teszt gomb – ha ez alertet dob, az event binding működik
    const testBtn = document.getElementById('testBtn');
    if (testBtn) testBtn.addEventListener('click', ()=> alert('TESZT OK – eventek élnek ✅'));

    // ====== PIXI stage ======
    const stageWrap = document.getElementById('stageWrap');
    const app = new PIXI.Application({ resizeTo: stageWrap, backgroundAlpha: 0, antialias: true });
    stageWrap.appendChild(app.view);

    const bgLayer = new PIXI.Container();
    const charLayer = new PIXI.Container();
    app.stage.addChild(bgLayer, charLayer);

    // ====== Controls ======
    const fileInput  = document.getElementById('fileInput');
    const genMascot  = document.getElementById('genMascot');
    const bgSelect   = document.getElementById('bgSelect');
    const storyEl    = document.getElementById('story');
    const playBtn    = document.getElementById('playStory');
    const waveBtn    = document.getElementById('waveBtn');
    const walkBtn    = document.getElementById('walkBtn');
    const jumpBtn    = document.getElementById('jumpBtn');
    const danceBtn   = document.getElementById('danceBtn');
    const talkBtn    = document.getElementById('talkBtn');
    const stopAllBtn = document.getElementById('stopAll');
    const accentSel  = document.getElementById('accent');

    const chkWave = document.getElementById('anim-wave');
    const chkWalk = document.getElementById('anim-walk');
    const chkJump = document.getElementById('anim-jump');
    const chkDance= document.getElementById('anim-dance');

    const autoBtn  = document.getElementById('autoStory');
    const minutesSel = document.getElementById('storyMinutes');

    // ====== State ======
    let mode = 'mascot';      // 'mascot' | 'image'
    let mascot = null;        // container (parts)
    let sprite = null;        // uploaded image sprite
    let talkingInterval = null;

    // ====== Backgrounds ======
    function drawBackground(type='forest'){
      bgLayer.removeChildren();
      const w = app.renderer.width, h = app.renderer.height;
      const add = g => bgLayer.addChild(g);

      const sky = new PIXI.Graphics();
      if (type==='space'){
        sky.beginFill(0x0d1137).drawRect(0,0,w,h).endFill(); add(sky);
        for(let i=0;i<120;i++){
          const s=new PIXI.Graphics();
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

    // ====== Mascot ======
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
    }

    function centerCharacter(){
      const W=app.renderer.width, H=app.renderer.height;
      if(mascot){ mascot.x=W/2; mascot.y=H*0.75-60; }
      if(sprite){ sprite.x=W/2; sprite.y=H*0.8; }
    }

    // első kirajzolás
    drawBackground(document.getElementById('bgSelect').value);
    buildMascot();

    // reagáljunk az átméretezésre
    app.renderer.on('resize', ()=>{ drawBackground(bgSelect.value); centerCharacter(); });
    window.addEventListener('resize', ()=>{ drawBackground(bgSelect.value); centerCharacter(); });
    bgSelect.addEventListener('change', ()=>{ drawBackground(bgSelect.value); centerCharacter(); });

    // Feltöltött kép
    fileInput.addEventListener('change', async (e)=>{
      const file=e.target.files?.[0]; if(!file) return;
      const url=URL.createObjectURL(file);
      const base=await PIXI.Assets.load(url);
      sprite=new PIXI.Sprite(base);
      sprite.anchor.set(0.5,1.0);
      const scale=Math.min(220/sprite.texture.width, 280/sprite.texture.height);
      sprite.scale.set(scale);
      mode='image'; charLayer.removeChildren(); charLayer.addChild(sprite);
      centerCharacter();
    });

    // Finom „lélegzés”
    let t=0;
    app.ticker.add((delta)=>{ t+=delta; const obj=mode==='mascot'?mascot:sprite; if(obj) obj.scale.y=1+Math.sin(t/30)*0.02; });

    // Animációk
    function wave(){
      const obj=mode==='mascot'?mascot?.armR:sprite; if(!obj) return;
      let dir=1,count=0; const base=obj.rotation;
      const id=setInterval(()=>{ obj.rotation=base+dir*0.45; dir*=-1; if(++count>8){ clearInterval(id); obj.rotation=base; } },120);
    }
    function walk(){
      const obj=mode==='mascot'?mascot:sprite; if(!obj) return;
      const targetX=Math.random()*(app.renderer.width*0.8)+app.renderer.width*0.1;
      const step=setInterval(()=>{ const dx=targetX-obj.x;
        if(Math.abs(dx)<2){ clearInterval(step); return; }
        obj.x+=Math.sign(dx)*Math.min(6,Math.abs(dx)/10);
        obj.y+=Math.sin(t/3)*0.6;
      },16);
    }
    function jump(){
      const obj=mode==='mascot'?mascot:sprite; if(!obj) return;
      let v=-10; const baseY=obj.y;
      const id=setInterval(()=>{ obj.y+=v; v+=0.7; if(obj.y>=baseY){ obj.y=baseY; clearInterval(id);} },16);
    }
    function dance(){
      const obj=mode==='mascot'?mascot:sprite; if(!obj) return;
      let k=0; const baseR=obj.rotation, baseS=obj.scale.x;
      const id=setInterval(()=>{ k+=0.2; obj.rotation=baseR+Math.sin(k)*0.25; obj.scale.x=baseS+Math.sin(k*2)*0.08; },16);
      setTimeout(()=>{ clearInterval(id); obj.rotation=baseR; obj.scale.x=baseS; },2600);
    }

    waveBtn.addEventListener('click', wave);
    walkBtn.addEventListener('click', walk);
    jumpBtn.addEventListener('click', jump);
    danceBtn.addEventListener('click', dance);

    // TTS + „szájszinkron”
    let voices=[];
    function loadVoices(){ voices=window.speechSynthesis.getVoices(); }
    loadVoices(); window.speechSynthesis.onvoiceschanged=loadVoices;

    function pickVoice(langCode){
      if(!voices.length) return null;
      let v=voices.find(v=>v.lang===langCode && /Google|Microsoft|Apple/i.test(v.name));
      if(v) return v;
      const pref=langCode.split('-')[0];
      v=voices.find(v=>v.lang?.startsWith(pref) && /Google|Microsoft|Apple/i.test(v.name));
      if(v) return v;
      v=voices.find(v=>v.lang?.startsWith(pref));
      return v||voices[0]||null;
    }

    function stopTalking(){ if(talkingInterval){ clearInterval(talkingInterval); talkingInterval=null; }
      const obj=mode==='mascot'?mascot:sprite; if(obj) obj.scale.set(1,1); }

    function speak(text){
      if(!text) return;
      const code=accentSel.value||'hu-HU';
      const u=new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g,''));
      const voice=pickVoice(code); u.lang=code; if(voice) u.voice=voice; u.rate=1.0; u.pitch=1.0;
      stopTalking();
      const obj=mode==='mascot'?mascot:sprite; let ph=0;
      talkingInterval=setInterval(()=>{ if(!obj) return; obj.scale.y=1+Math.sin(ph)*0.015; ph+=0.6; },50);
      u.onend=stopTalking;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }

    talkBtn.addEventListener('click', ()=>{ const txt=storyEl.value.trim(); if(txt) speak(txt); });

    // Kipipált animációkból válasszunk
    function pickAllowedAnim(){
      const a=[]; if(chkWave.checked)a.push(wave); if(chkWalk.checked)a.push(walk);
      if(chkJump.checked)a.push(jump); if(chkDance.checked)a.push(dance);
      return a.length?a:[wave];
    }

    // Lejátszás
    playBtn.addEventListener('click', ()=>{
      const txt=storyEl.value.trim(); if(!txt) return;
      const parts=txt.split(/\n+/).filter(Boolean); let i=0; const allowed=pickAllowedAnim();
      const runNext=()=>{ if(i>=parts.length) return; const line=parts[i++]; const fn=allowed[Math.floor(Math.random()*allowed.length)];
        fn(); speak(line); setTimeout(runNext, Math.max(2000, Math.min(7000, line.length*80))); };
      runNext();
    });

    stopAllBtn.addEventListener('click', ()=>{ window.speechSynthesis.cancel(); stopTalking(); });

    // Auto mese (backend -> fallback)
    async function localGenerateStory(minutes){
      const themes=['erdei kaland','tengerparti nap','űrutazás','barátság','varázserdő'];
      const who=['kislány','kisfiú','kis hős','kis manó'];
      const name=['Lili','Emma','Bence','Noel','Zsófi','Mira','Marci'][Math.floor(Math.random()*7)];
      const theme=themes[Math.floor(Math.random()*themes.length)];
      const hero=who[Math.floor(Math.random()*who.length)];
      const paras=Math.min(6, Math.max(3, minutes+2));
      const sentences=Math.min(6, Math.max(3, minutes+3));
      let story=`Egyszer volt, hol nem volt, élt egy ${hero}, akit úgy hívtak: ${name}. Egy nap különös kaland kezdődött: ${theme}.`;
      story+='\n\n';
      for(let p=0;p<paras;p++){
        let para=[];
        for(let s=0;s<sentences;s++){ para.push(`${name} mosolyogva folytatta a kalandot, és minden fordulatban barátokra talált.`); }
        story+=para.join(' ')+'\n\n';
      }
      story+='A nap végén mindenki megpihent, és a kis hős megtanulta: a bátorság és a kedvesség mindig utat mutat. VÉGE.';
      return story;
    }

    autoBtn.addEventListener('click', async ()=>{
      const minutes=parseInt(minutesSel.value,10)||3;
      storyEl.value='✨ Mese készül…';
      try{
        const res = await fetch('/.netlify/functions/chat',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ mode:'storyGen', minutes })
        });
        if(res.ok){
          const data=await res.json();
          if(data.story){ storyEl.value=data.story.trim(); setDiag('INIT OK – function válaszol ✅', true); return; }
        }
        storyEl.value = await localGenerateStory(minutes);
        setDiag('INIT OK – helyi generálás használva ✅', true);
      }catch{
        storyEl.value = await localGenerateStory(minutes);
        setDiag('INIT OK – helyi generálás használva ✅', true);
      }
    });

    // Ha idáig eljutottunk, az init rendben
    setDiag('INIT OK ✅', true);

  }catch(e){
    setDiag('Hiba: '+(e.message||String(e)));
  }
})();
