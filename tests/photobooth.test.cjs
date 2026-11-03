/* Canvas + control-handler tests with a minimal DOM stub, not a browser/iPhone test.
 * Dependency: @napi-rs/canvas. Set NODE_PATH or CODEX_PRIMARY_RUNTIME_NODE_MODULES.
 * Generates the exact transparent template assets used by the bundled editor.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,Image,GlobalFonts,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
for(const [file,family] of [['DejaVuSerif.ttf','Georgia'],['DejaVuSans.ttf','system-ui']]){
 const font='/usr/share/fonts/truetype/dejavu/'+file;if(fs.existsSync(font))GlobalFonts.registerFromPath(font,family);
}
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'photobooth/photobooth.html'),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements={},downloads=[],objects=new Map();let id=0;
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.style={};this.dataset={};this.attributes={};this.listeners={};this.value='';this.checked=false;this.disabled=false;this.files=[];}
 append(...xs){this.children.push(...xs);}
 replaceChildren(...xs){this.children=xs;}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,fn){this.listeners[k]=fn;}
 click(){if(this.disabled)return;if(this.tagName==='a')downloads.push({name:this.download,blob:objects.get(this.href)});else return this.onclick?.();}
}
const surface=createCanvas(1600,1600),canvas=new Element('canvas');
Object.defineProperties(canvas,{width:{get:()=>surface.width,set:v=>surface.width=v},height:{get:()=>surface.height,set:v=>surface.height=v}});
canvas.getContext=x=>surface.getContext(x);canvas.toBlob=cb=>cb(new Blob([surface.toBuffer('image/png')],{type:'image/png'}));
elements.canvas=canvas;
for(const name of ['files','layouts','themes','caption','square','date','mono','crop','download','share','reset','template','status','size','count','photos'])elements[name]=new Element('div');
elements.caption.value='little moments, big feelings';elements.square.checked=true;elements.crop.value='center';
const document={getElementById:k=>elements[k],createElement:t=>new Element(t),createTextNode:t=>({textContent:t})};
class LocalImage extends Image{set src(url){const item=objects.get(url);super.src=item?.data||url;}get src(){return super.src;}}
const env=vm.createContext({document,Image:LocalImage,Blob,File,Date,console,navigator:{},URL:{createObjectURL:x=>{const url='blob:test-'+(++id);objects.set(url,x);return url;},revokeObjectURL:x=>objects.delete(x)},setTimeout:()=>0});
vm.runInContext(code,env,{timeout:2000});
const run=s=>vm.runInContext(s,env,{timeout:2000});
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('six layout controls and eight frame controls',()=>{assert.equal(elements.layouts.children.length,6);assert.equal(elements.themes.children.length,8);});
test('export disabled with empty slots',()=>assert.equal(elements.download.disabled,true));
test('square default is 1600px',()=>{assert.equal(canvas.width,1600);assert.equal(canvas.height,1600);});
test('no external code or network API',()=>{assert.ok(!/fetch\s*\(|XMLHttpRequest|WebSocket|<script[^>]*\bsrc=|<link\b/i.test(html));assert.ok(html.includes("connect-src 'none'"));});
const manifest=JSON.parse(run('JSON.stringify({layouts,themes})'));
manifest.schema='little-moments-photobooth-v1';manifest.note='Local renderer schema, NOT a Locket Remote Config schema.';
fs.writeFileSync(path.join(root,'photobooth/layouts.json'),JSON.stringify(manifest,null,2));
const frames=path.join(root,'photobooth/frames');fs.mkdirSync(frames,{recursive:true});
let templateCount=0;
for(const layout of manifest.layouts)for(const theme of manifest.themes){
 run(`activeLayout=layouts.find(l=>l.id===${JSON.stringify(layout.id)});activeTheme=themes.find(t=>t.id===${JSON.stringify(theme.id)});$('square').checked=false;renderTemplate();`);
 assert.equal(canvas.width,layout.w);assert.equal(canvas.height,layout.h);
 for(const [x,y,w,h] of layout.slots){assert.ok(x>=0&&y>=0&&x+w<=1&&y+h<=1);let p=surface.getContext('2d').getImageData(Math.round((x+w/2)*layout.w),Math.round((y+h/2)*layout.h),1,1).data;assert.equal(p[3],0);}
 const png=surface.toBuffer('image/png');assert.ok(png.length>2000);fs.writeFileSync(path.join(frames,layout.id+'-'+theme.id+'.png'),png);templateCount++;
}
test('48 templates have exact dimensions and transparent photo slots',()=>assert.equal(templateCount,48));
// Synthetic solid-color images make order, crop and compositing assertions observable.
const colors=['#CC2222','#22AA44','#2244CC','#EEBB22'];
const fixtures=colors.map((color,i)=>{let c=createCanvas(400,600),x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,400,600);return {name:'synthetic-'+i+'.png',size:2000,data:c.toBuffer('image/png')};});
(async()=>{
 elements.files.files=fixtures;await elements.files.onchange.call(elements.files);
 run("activeLayout=layouts.find(l=>l.id==='grid4');activeTheme=themes[0];$('square').checked=false;render();");
 test('image chooser loads four photos and enables export',()=>{assert.equal(run('photos.length'),4);assert.equal(elements.download.disabled,false);});
 test('drawn image pixels match the first input',()=>{const p=surface.getContext('2d').getImageData(300,300,1,1).data;assert.deepEqual(Array.from(p),[204,34,34,255]);});
 const before=run('photos[0].url');elements.photos.children[0].children[3].click();
 test('reorder button moves an image',()=>assert.equal(run('photos[1].url'),before));
 elements.caption.value='Ngày thật đẹp · Niên';elements.caption.listeners.input();
 test('caption change renders without errors',()=>assert.ok(surface.toBuffer('image/png').length>5000));
 elements.mono.checked=true;elements.mono.listeners.input();
 test('black-and-white export uses grayscale pixels',()=>{let p=surface.getContext('2d').getImageData(300,300,1,1).data;assert.ok(Math.abs(p[0]-p[1])<2&&Math.abs(p[1]-p[2])<2);});
 elements.mono.checked=false;elements.square.checked=true;elements.square.listeners.input();
 test('switching to square retains 1600px output',()=>assert.equal(surface.width,1600));
 await elements.download.click();test('PNG download produces a real image blob',()=>{assert.equal(downloads.at(-1).blob.type,'image/png');assert.ok(downloads.at(-1).blob.size>5000);});
 await elements.template.click();test('template download produces a PNG',()=>{assert.ok(downloads.at(-1).name.startsWith('frame-'));assert.ok(downloads.at(-1).blob.size>5000);});
 elements.reset.click();test('reset removes photo references and disables photo export',()=>{assert.equal(run('photos.length'),0);assert.equal(elements.download.disabled,true);assert.equal(elements.photos.children.length,0);});
 // Build an exact contact sheet from the generated transparent PNGs.
 const sheet=createCanvas(1760,2240),s=sheet.getContext('2d');s.fillStyle='#EEE9DF';s.fillRect(0,0,sheet.width,sheet.height);
 s.fillStyle='#363A2E';s.font='44px Georgia';s.fillText('little moments. / 48 frames',40,66);s.font='18px system-ui';s.fillText('6 layouts × 8 styles · Transparent photo slots · Independent Photobooth renderer',40,101);
 for(let col=0;col<manifest.themes.length;col++){s.font='17px system-ui';s.fillText(manifest.themes[col].name,col*215+45,142);}
 for(let row=0;row<manifest.layouts.length;row++)for(let col=0;col<manifest.themes.length;col++){
  const l=manifest.layouts[row],t=manifest.themes[col],im=await loadImage(fs.readFileSync(path.join(frames,l.id+'-'+t.id+'.png')));
  const scale=Math.min(175/l.w,275/l.h),x=col*215+45+(175-l.w*scale)/2,y=180+row*340;
  s.fillStyle='#CFD0C6';s.fillRect(x,y,l.w*scale,l.h*scale);s.drawImage(im,x,y,l.w*scale,l.h*scale);s.fillStyle='#5A5D50';s.font='14px system-ui';s.textAlign='center';s.fillText(l.name,col*215+132,480+row*340);s.textAlign='left';
 }
 fs.writeFileSync(path.join(root,'photobooth/frames-preview.png'),sheet.toBuffer('image/png'));
 console.log('\n'+passed+' Canvas/control-handler tests passed. No browser CSS rendering or iPhone execution was performed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
