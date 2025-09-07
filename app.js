// ====== PIXI stage setup ======
const stageWrap = document.getElementById('stageWrap');
const app = new PIXI.Application({ resizeTo: stageWrap, backgroundAlpha: 0 });
stageWrap.appendChild(app.view);

// layers
const bgLayer = new PIXI.Container();
const charLayer = new PIXI.Container();
app.stage.addChild(bgLayer, charLayer);

// character state
let mode = 'mascot';      // 'mascot' | 'image'
let mascot = null;        // container (parts)
let sprite = null;        // uploaded image sprite
let talkingInterval = null;

// controls
const fileInput  = document.getElementById('fileInput');
const genMascot  = document.getElementById('genMascot');
const bgSelect   = document.getElementById('bgSelect');
const storyEl    = document.getElementById('story');
const playBtn    = document.getElementById('playStory');
const waveBtn    = document.getElementById('waveBtn');
const walkBtn    = document.getElementById('walkBtn');
const jumpBtn    = document.getElementById('jumpBtn');
const talkBtn    = document.getElementById('talkBtn');
const stopAllBtn = document.getElementById('stopAll');
const accentSel  = document.getElementById('accent');

// ====== Backgrounds (drawn with Graphics) ======
function drawBackground(type = 'forest') {
  bgLayer.removeChildren();

  const w = app.renderer.width;
  const h = app.renderer.height;

  // sky
  const sky = new PIXI.Graphics();
  if (type === 'space'){
    sky.beginFill(0x0d1137).drawRect(0,0,w,h).endFill();
    // stars
    for (let i=0;i<120;i++){
      const s = new PIXI.Graphics();
      const x = Math.random()*w, y=Math.random()*h*0.8;
      s.beginFill(0xffffff, Math.random()*0.8+0.2).drawCircle(0,0, Math.random()*2+0.5).endFill();
      s.x = x; s.y = y; bgLayer.addChild(s);
    }
  } else if (type === 'beach'){
    sky.beginFill(0x87ceeb).drawRect(0,0,w,h*0.55).endFill(); // sky
    const sea = new PIXI.Graphics();
    sea.beginFill(0x2aa7ff).drawRect(0,h*0.55,w,h*0.25).endFill();
    const sand = new PIXI.Graphics();
    sand.beginFill(0xf4d195).drawRect(0,h*0.80,w,h*0.20).endFill();
    bgLayer.addChild(sky, sea, sand);
    return;
  } else {
    sky.beginFill(0x9fe7ff).drawRect(0,0,w,h).endFill();
    // ground
    const ground = new PIXI.Graphics();
    ground.beginFill(0x9be39b).drawRect(0,h*0.8,w,h*0.2).endFill();
    bgLayer.addChild(sky, ground);
    // trees
    for (let i=0;i<6;i++){
      const x = (i+0.5)*w/6 + (Math.random()*40-20);
      const trunk = new PIXI.Graphics();
      trunk.beginFill(0x7a4b1f).drawRect(-8,0,16,80).endFill();
      trunk.x = x; trunk.y = h*0.8-80;
      const crown = new PIXI.Graphics();
      crown.beginFill(0x2f9e44).drawCircle(0,-30, 45).endFill();
      const tree = new PIXI.Container();
      tree.addChild(trunk,crown);
      bgLayer.addChild(tree);
    }
  }
  bgLayer.addChild(sky);
}
drawBackground(bgSelect.value);
bgSelect.addEventListener('change', ()=> drawBackground(bgSelect.value));

// ====== Mascot (original, non-infringing) ======
function buildMascot() {
  mode = 'mascot';
  charLayer.removeChildren();
  sprite = null;

  const body = new PIXI.Graphics();
  body.beginFill(0x4aa3ff).drawEllipse(0,0, 70, 90).endFill();

  const belly = new PIXI.Graphics();
  belly.beginFill(0xffffff).drawEllipse(0,25, 38, 32).endFill();

  const earL = new PIXI.Graphics();
  earL.beginFill(0x4aa3ff).drawEllipse(-55,-70, 22, 38).endFill();
  const earR = new PIXI.Graphics();
  earR.beginFill(0x4aa3ff).drawEllipse(55,-70, 22, 38).endFill();

  const eyeL = new PIXI.Graphics();
  eyeL.beginFill(0xffffff).drawCircle(-22,-20, 14).endFill();
  const eyeLp = new PIXI.Graphics();
  eyeLp.beginFill(0x002244).drawCircle(-18,-18, 6).endFill();
  const eyeR = new PIXI.Graphics();
  eyeR.beginFill(0xffffff).drawCircle(22,-20, 14).endFill();
  const eyeRp = new PIXI.Graphics();
  eyeRp.beginFill(0x002244).drawCircle(18,-18, 6).endFill();

  const mouth = new PIXI.Graphics();
  mouth.lineStyle(4, 0x002244).moveTo(-15,10).quadraticCurveTo(0,25,15,10);

  const armL = new PIXI.Graphics();
  armL.beginFill(0x4aa3ff).drawRoundedRect(-88,-8, 30,16,8).endFill();
  const armR = new PIXI.Graphics();
  armR.beginFill(0x4aa3ff).drawRoundedRect(58,-8, 30,16,8).endFill();

  const legL = new PIXI.Graphics();
  legL.beginFill(0x4aa3ff).drawRoundedRect(-30,80, 20,26,6).endFill();
  const legR = new PIXI.Graphics();
  legR.beginFill(0x4aa3ff).drawRoundedRect(10,80, 20,26,6).endFill();

  mascot = new PIXI.Container();
  mascot.addChild(earL, earR, body, belly, eyeL, eyeLp, eyeR, eyeRp, mouth, armL, armR, legL, legR);
  mascot.x = app.renderer.width/2;
  mascot.y = app.renderer.height*0.75 - 60;
  mascot.pivot.set(0,0);
  mascot.mouth = mouth;
  mascot.armR = armR;

  charLayer.addChild(mascot);
}
buildMascot();

// ====== Upload image as character ======
fileInput.addEventListener('change', async (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;

  const url = URL.createObjectURL(file);
  const base = await PIXI.Assets.load(url);
  sprite = new PIXI.Sprite(base);
  sprite.anchor.set(0.5, 1.0);
  sprite.x = app.renderer.width/2;
  sprite.y = app.renderer.height*0.8;
  const scale = Math.min(220/sprite.texture.width, 280/sprite.texture.height);
  sprite.scale.set(scale);

  mode = 'image';
  charLayer.removeChildren();
  charLayer.addChild(sprite);
});

genMascot.addEventListener('click', ()=> buildMascot());

// ====== Simple Animations ======
let t = 0;
app.ticker.add((delta)=>{
  t += delta;
  // subtle breathing
  if (mode === 'mascot' && mascot) {
    mascot.scale.y = 1 + Math.sin(t/30)*0.02;
  } else if (mode === 'image' && sprite) {
    sprite.scale.y = 1 + Math.sin(t/30)*0.02;
  }
});

function wave(){
  if (mode === 'mascot' && mascot?.armR) {
    let dir = 1, count=0;
    const arm = mascot.armR;
    const baseX = arm.x, baseRot = arm.rotation;
    const id = setInterval(()=>{
      arm.rotation = baseRot + dir*0.5;
      dir *= -1; count++;
      if(count>8){ clearInterval(id); arm.rotation = baseRot; }
    }, 120);
  } else if (mode === 'image' && sprite) {
    let dir=1, count=0;
    const base = sprite.rotation;
    const id = setInterval(()=>{
      sprite.rotation = base + dir*0.05;
      dir*=-1; count++;
      if(count>8){ clearInterval(id); sprite.rotation = base; }
    }, 120);
  }
}

function walk(){
  const targetX = Math.random() * (app.renderer.width*0.8) + app.renderer.width*0.1;
  const obj = mode==='mascot' ? mascot : sprite;
  if(!obj) return;
  const step = setInterval(()=>{
    const dx = targetX - obj.x;
    if (Math.abs(dx) < 2){ clearInterval(step); return; }
    obj.x += Math.sign(dx) * Math.min(6, Math.abs(dx)/10);
    obj.y += Math.sin(t/3) * 0.6; // bounce
  }, 16);
}

function jump(){
  const obj = mode==='mascot' ? mascot : sprite;
  if(!obj) return;
  let v = -10; // up
  const baseY = obj.y;
  const id = setInterval(()=>{
    obj.y += v;
    v += 0.7; // gravity
    if(obj.y >= baseY){
      obj.y = baseY; clearInterval(id);
    }
  }, 16);
}

waveBtn.addEventListener('click', wave);
walkBtn.addEventListener('click', walk);
jumpBtn.addEventListener('click', jump);

// ====== TTS with accent + simple mouth sync ======
let voices = [];
function loadVoices(){ voices = window.speechSynthesis.getVoices(); }
loadVoices();
window.speechSynthesis.onvoiceschanged = loadVoices;

function pickVoice(langCode){
  if(!voices.length) return null;
  let v = voices.find(v=>v.lang === langCode && /Google|Microsoft|Apple/i.test(v.name));
  if(v) return v;
  const pref = langCode.split('-')[0];
  v = voices.find(v=>v.lang?.startsWith(pref) && /Google|Microsoft|Apple/i.test(v.name));
  if(v) return v;
  v = voices.find(v=>v.lang?.startsWith(pref));
  return v || voices[0] || null;
}

function speak(text){
  if(!text) return;
  const code = accentSel.value || "hu-HU";
  const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g,''));
  const voice = pickVoice(code);
  u.lang = code; if(voice) u.voice = voice;
  u.rate = 1.0; u.pitch = 1.0;

  // mouth / head bob sync (very simple)
  stopTalking();
  const obj = (mode==='mascot') ? mascot : sprite;
  let phase = 0;
  talkingInterval = setInterval(()=>{
    if(!obj) return;
    const amp = 0.015;
    obj.scale.y = 1 + Math.sin(phase)*amp;
    phase += 0.6;
  }, 50);

  u.onend = stopTalking;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function stopTalking(){
  if(talkingInterval){ clearInterval(talkingInterval); talkingInterval=null; }
  // reset scale
  const obj = (mode==='mascot') ? mascot : sprite;
  if (obj) obj.scale.set(1,1);
}

talkBtn.addEventListener('click', ()=>{
  const txt = storyEl.value.trim();
  if(!txt) return;
  speak(txt);
});

// ====== Play Story (narration + small animations) ======
playBtn.addEventListener('click', ()=>{
  const txt = storyEl.value.trim();
  if(!txt) return;
  // A szöveget bekezdésekre törjük és animációt rendelünk hozzá
  const parts = txt.split(/\n+/).filter(Boolean);
  let i = 0;
  const runNext = ()=>{
    if(i>=parts.length) return;
    const line = parts[i++];
    // random kis mozdulat minden mondathoz
    const r = Math.random();
    if (r<0.33) wave(); else if (r<0.66) walk(); else jump();
    speak(line);
    // várjunk ~mondathossztól függően
    setTimeout(runNext, Math.max(2000, Math.min(7000, line.length*80)));
  };
  runNext();
});

stopAllBtn.addEventListener('click', ()=>{
  window.speechSynthesis.cancel();
  stopTalking();
});
