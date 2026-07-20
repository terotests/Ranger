// Baked photoreal-ish pinball playfield art. All lighting, soft shadows, ambient
// occlusion, gloss and illustration are BAKED into the texture — the dominant
// flat surface then reads photoreal even under a plain software rasterizer.
const zlib = require('zlib'), fs = require('fs');
const W = 512, H = 768;
const px = Buffer.alloc(W * H * 4);
function clamp255(v){return v<0?0:v>255?255:v|0;}
function set(x,y,r,g,b){x|=0;y|=0;if(x<0||x>=W||y<0||y>=H)return;const o=(y*W+x)*4;px[o]=clamp255(r);px[o+1]=clamp255(g);px[o+2]=clamp255(b);px[o+3]=255;}
function get(x,y){x|=0;y|=0;if(x<0||x>=W||y<0||y>=H)return[0,0,0];const o=(y*W+x)*4;return[px[o],px[o+1],px[o+2]];}
function blend(x,y,r,g,b,a){if(a<=0)return;x|=0;y|=0;if(x<0||x>=W||y<0||y>=H)return;const o=(y*W+x)*4;px[o]=clamp255(px[o]*(1-a)+r*a);px[o+1]=clamp255(px[o+1]*(1-a)+g*a);px[o+2]=clamp255(px[o+2]*(1-a)+b*a);px[o+3]=255;}
function add(x,y,r,g,b){x|=0;y|=0;if(x<0||x>=W||y<0||y>=H)return;const o=(y*W+x)*4;px[o]=clamp255(px[o]+r);px[o+1]=clamp255(px[o+1]+g);px[o+2]=clamp255(px[o+2]+b);px[o+3]=255;}

// deterministic value noise for a subtle surface grain
function hash(x,y){let n=(x*374761393+y*668265263)|0;n=(n^(n>>13))*1274126177|0;return((n^(n>>16))>>>0)/4294967295;}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi;const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;}

// ---- 1. base: cosmic blue field with baked top-down dome light + vignette ----
const LX=0.5*W, LY=0.16*H;  // baked key-light origin (top centre)
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const nx=x/W-0.5, ny=y/H-0.5;
  const vig=Math.max(0,1-(nx*nx*2.1+ny*ny*1.5)); // vignette
  // distance to baked light -> warm dome falloff
  const dl=Math.hypot(x-LX,(y-LY)*0.85)/W;
  const dome=Math.max(0,1-dl*1.15);
  const grain=(vnoise(x*0.05,y*0.05)-0.5)*10 + (vnoise(x*0.4,y*0.4)-0.5)*5;
  let r=14+dome*70+vig*10+grain;
  let g=20+dome*80+vig*14+grain;
  let b=54+dome*95+vig*40+grain;
  set(x,y,r,g,b);
}
// faint concentric energy rings (baked neon glow, screen-additive)
for(let ring=0;ring<7;ring++){const rr=60+ring*54;for(let a=0;a<1440;a++){const t=a/1440*Math.PI*2;const wob=Math.sin(t*6+ring)*6;const x=LX+Math.cos(t)*(rr+wob),y=0.34*H+Math.sin(t)*(rr+wob)*0.9;add(x,y,6,10,26);}}

// soft radial glow helper (baked insert light)
function glow(cx,cy,rad,r,g,b,pk){for(let y=cy-rad;y<=cy+rad;y++)for(let x=cx-rad;x<=cx+rad;x++){const d=Math.hypot(x-cx,y-cy);if(d<rad){const f=Math.pow(1-d/rad,2)*pk;add(x,y,r*f,g*f,b*f);}}}
// soft BAKED contact shadow (dark, offset down-right from the element)
function softShadow(cx,cy,rad){for(let y=cy-rad;y<=cy+rad;y++)for(let x=cx-rad;x<=cx+rad;x++){const d=Math.hypot((x-cx)*1.0,(y-cy)*1.1);if(d<rad){const a=Math.pow(1-d/rad,1.6)*0.55;blend(x,y,4,4,14,a);}}}
// ambient-occlusion ring hugging a raised element base
function aoRing(cx,cy,rad){for(let y=cy-rad-6;y<=cy+rad+6;y++)for(let x=cx-rad-6;x<=cx+rad+6;x++){const d=Math.hypot(x-cx,y-cy);if(d>rad-2&&d<rad+7){const a=(1-Math.abs(d-(rad+2.5))/5)*0.4;blend(x,y,2,3,10,Math.max(0,a));}}}
// glossy 3D-looking dome cap (radial shade + baked specular toward light)
function domeCap(cx,cy,rad,r,g,b){
  softShadow(cx+rad*0.28,cy+rad*0.34,rad*1.35);
  aoRing(cx,cy,rad);
  for(let y=cy-rad;y<=cy+rad;y++)for(let x=cx-rad;x<=cx+rad;x++){const dx=(x-cx)/rad,dy=(y-cy)/rad,d2=dx*dx+dy*dy;if(d2<=1){const nz=Math.sqrt(1-d2);
    // lambert toward baked light dir (up-left) + ambient
    const lx=-0.4,ly=-0.5,lz=0.76;const nrm=Math.hypot(x-LX,y-LY);const ndl=Math.max(0,(-dx)*0.3+(-dy)*0.42+nz*0.85);
    const sh=0.32+0.85*ndl;set(x,y,r*sh,g*sh,b*sh);}}
  // rim light
  for(let a=0;a<720;a++){const t=a/720*Math.PI*2;const x=cx+Math.cos(t)*(rad-1.5),y=cy+Math.sin(t)*(rad-1.5);const rimf=Math.max(0,-Math.cos(t-2.2));blend(x,y,180,210,255,0.5*rimf);}
  // hot specular blob (up-left)
  glow(cx-rad*0.34,cy-rad*0.4,rad*0.5,255,255,255,0.9);
}
// crisp neon ring
function neonRing(cx,cy,rad,th,r,g,b){for(let y=cy-rad-2;y<=cy+rad+2;y++)for(let x=cx-rad-2;x<=cx+rad+2;x++){const d=Math.hypot(x-cx,y-cy);if(d>rad-th&&d<rad){const e=1-Math.abs(d-(rad-th*0.5))/(th*0.7);blend(x,y,r,g,b,Math.max(0,e));}}glow(cx,cy,rad*1.3,r*0.4,g*0.4,b*0.4,0.5);}

// ---- 2. inlane/outlane guide rails (glossy metal) ----
function metalRail(x0,y0,x1,y1,wd){const steps=Math.hypot(x1-x0,y1-y0)|0;for(let i=0;i<=steps;i++){const t=i/steps,cx=x0+(x1-x0)*t,cy=y0+(y1-y0)*t;for(let o=-wd;o<=wd;o++){const nx=-(y1-y0),ny=(x1-x0);const nl=Math.hypot(nx,ny);const sx=cx+nx/nl*o,sy=cy+ny/nl*o;const sh=1-Math.abs(o)/wd;blend(sx,sy,150+sh*90,165+sh*90,205+sh*50,0.9);blend(sx,sy,255,255,255,sh>0.7?0.5*(sh-0.7)/0.3:0);}}}

// ---- 3. lane arrows (glowing) ----
function arrow(cx,cy,r,g,b){for(let i=0;i<44;i++){const w=Math.max(7,34-i);for(let x=cx-w;x<cx+w;x++)blend(x,cy-i-22,r,g,b,0.95);}for(let y=cy-22;y<cy+34;y++)for(let x=cx-13;x<cx+13;x++)blend(x,y,r,g,b,0.95);glow(cx,cy,52,r*0.4,g*0.4,b*0.4,0.6);
  // inner white core
  for(let i=0;i<40;i++){const w=Math.max(3,18-i*0.6|0);for(let x=cx-w;x<cx+w;x++)blend(x,cy-i-24,255,255,255,0.35);}}

// A "lit socket": the flat, glowing recess a RAISED 3D cap stands in. Baked
// contact shadow (grounds the 3D cap) + neon ring + coloured glow + dark centre.
// NOT a dome — the raised cap itself is a real 3D shaded mesh on top.
function socket(cx,cy,rad,r,g,b){
  softShadow(cx+rad*0.30,cy+rad*0.38,rad*1.4);
  glow(cx,cy,rad*1.5,r*0.5,g*0.5,b*0.5,0.6);
  neonRing(cx,cy,rad,4,r,g,b);
  neonRing(cx,cy,rad*0.72,3,r*0.7+60,g*0.7+60,b*0.7+60);
  for(let y=cy-rad;y<=cy+rad;y++)for(let x=cx-rad;x<=cx+rad;x++){const d=Math.hypot(x-cx,y-cy);if(d<rad*0.66){blend(x,y,r*0.25,g*0.25,b*0.25,0.5*(1-d/(rad*0.66)));}}
}
// build features -------------------------------------------------------------
// upper energy burst behind bumpers
glow(0.5*W,0.30*H,150,40,70,160,0.5);
// three pop-bumper sockets (match BUMPERS layout scaled to 512x768)
socket(0.267*W,0.242*H,42,70,130,255);
socket(0.5*W,0.187*H,42,255,80,110);
socket(0.733*W,0.242*H,42,190,110,255);
// central spinner socket (left) + big yellow target
socket(0.172*W,0.484*H,46,250,205,70);
// bank of round insert sockets (targets)
const inserts=[[0.417,0.381,255,210,60],[0.583,0.381,90,200,255],[0.35,0.484,235,80,100],[0.683,0.484,80,205,130],[0.5,0.549,250,220,80]];
for(const d of inserts){socket(d[0]*W,d[1]*H,20,d[2],d[3],d[4]);}
// centre starburst insert (multiplier)
glow(0.5*W,0.492*H,40,255,210,90,0.7);neonRing(0.5*W,0.492*H,26,4,255,225,120);
// lane arrows near flippers
arrow(0.40*W,0.60*H,255,90,70);arrow(0.5*W,0.60*H,255,215,80);arrow(0.60*W,0.60*H,255,90,70);
// slingshot faces (glowing triangles)
function slingTri(cx,cy,dir){for(let i=0;i<64;i++){const w=i*0.7|0;for(let x=0;x<w;x++){blend(cx+dir*(x),cy+i,80,160,250,0.9);}for(let x=0;x<w;x++){blend(cx+dir*x,cy+i,255,255,255,x>w-4?0.4:0);}}glow(cx+dir*20,cy+30,40,40,90,180,0.6);}
slingTri(0.20*W,0.60*H,1);slingTri(0.80*W,0.60*H,-1);
// inlane guide rails
metalRail(0.13*W,0.56*H,0.30*W,0.74*H,3);
metalRail(0.87*W,0.56*H,0.70*W,0.74*H,3);
metalRail(0.30*W,0.30*H,0.30*W,0.55*H,2);
metalRail(0.70*W,0.30*H,0.70*W,0.55*H,2);
// apron sheen at the very bottom
for(let y=0.80*H;y<H;y++){const t=(y-0.80*H)/(0.20*H);for(let x=0;x<W;x++){blend(x,y,60,66,96,t*0.5);}}
// baked drain shadow funnel
glow(0.5*W,0.82*H,120,4,6,16,0.7);

// ---- 4. gloss/varnish highlight sweep across the whole playfield ----
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const s=Math.sin((x*0.9+y*0.5)*0.006);if(s>0.85){blend(x,y,255,255,255,(s-0.85)/0.15*0.05);}}

// ---- 5. dark bevelled border frame with inner glow ----
for(let t=0;t<16;t++){const a=1-t/16;for(let x=0;x<W;x++){blend(x,t,10,12,30,a*0.9);blend(x,H-1-t,10,12,30,a*0.9);}for(let y=0;y<H;y++){blend(t,y,10,12,30,a*0.9);blend(W-1-t,y,10,12,30,a*0.9);}}
// bright inner keyline
for(let x=8;x<W-8;x++){blend(x,8,120,150,220,0.5);blend(x,H-9,120,150,220,0.5);}for(let y=8;y<H-8;y++){blend(8,y,120,150,220,0.5);blend(W-9,y,120,150,220,0.5);}

// PNG encode (RGBA) ----------------------------------------------------------
let ct=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;ct[n]=c;}
function crc32(b){let c=0xffffffff;for(let i=0;i<b.length;i++)c=ct[(c^b[i])&0xff]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(ty,d){const l=Buffer.alloc(4);l.writeUInt32BE(d.length,0);const t=Buffer.from(ty);const c=Buffer.alloc(4);c.writeUInt32BE(crc32(Buffer.concat([t,d])),0);return Buffer.concat([l,t,d,c]);}
const raw=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++){raw[y*(W*4+1)]=0;px.copy(raw,y*(W*4+1)+1,y*W*4,y*W*4+W*4);}
const ih=Buffer.alloc(13);ih.writeUInt32BE(W,0);ih.writeUInt32BE(H,4);ih[8]=8;ih[9]=6;
fs.writeFileSync(process.argv[2],Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
console.log("wrote",process.argv[2]);
// Also emit a binary P6 PPM (RGB) so the browser GL viewer can load it with no
// PNG decoder (mirrors the crate.ppm path). Second arg = ppm path (optional).
if(process.argv[3]){
  const rgb=Buffer.alloc(W*H*3);
  for(let i=0;i<W*H;i++){rgb[i*3]=px[i*4];rgb[i*3+1]=px[i*4+1];rgb[i*3+2]=px[i*4+2];}
  const header=Buffer.from(`P6\n${W} ${H}\n255\n`,'ascii');
  fs.writeFileSync(process.argv[3],Buffer.concat([header,rgb]));
  console.log("wrote",process.argv[3]);
}
