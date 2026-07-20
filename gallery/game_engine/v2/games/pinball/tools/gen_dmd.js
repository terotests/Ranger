// Dot-matrix display (DMD) texture for the pinball backbox: a dark panel with
// amber dot-matrix score/status text, baked to a PNG. Mapped UNLIT (emissive) on
// the backbox so it glows like a real DMD. 5x7 dot font.
const zlib = require('zlib'), fs = require('fs');
const W = 512, H = 192;
const px = Buffer.alloc(W * H * 4);
function cl(v){return v<0?0:v>255?255:v|0;}
function set(x,y,r,g,b){x|=0;y|=0;if(x<0||x>=W||y<0||y>=H)return;const o=(y*W+x)*4;px[o]=cl(r);px[o+1]=cl(g);px[o+2]=cl(b);px[o+3]=255;}
function add(x,y,r,g,b){x|=0;y|=0;if(x<0||x>=W||y<0||y>=H)return;const o=(y*W+x)*4;px[o]=cl(px[o]+r);px[o+1]=cl(px[o+1]+g);px[o+2]=cl(px[o+2]+b);px[o+3]=255;}

// 5x7 glyphs (rows top→bottom, each string 5 chars, '#'=lit)
const F = {
  '0':["01110","10001","10011","10101","11001","10001","01110"],
  '1':["00100","01100","00100","00100","00100","00100","01110"],
  '2':["01110","10001","00001","00010","00100","01000","11111"],
  '3':["11111","00010","00100","00010","00001","10001","01110"],
  '4':["00010","00110","01010","10010","11111","00010","00010"],
  '5':["11111","10000","11110","00001","00001","10001","01110"],
  '6':["00110","01000","10000","11110","10001","10001","01110"],
  '7':["11111","00001","00010","00100","01000","01000","01000"],
  '8':["01110","10001","10001","01110","10001","10001","01110"],
  '9':["01110","10001","10001","01111","00001","00010","01100"],
  ',':["00000","00000","00000","00000","00110","00100","01000"],
  'X':["10001","10001","01010","00100","01010","10001","10001"],
  'B':["11110","10001","10001","11110","10001","10001","11110"],
  'A':["01110","10001","10001","11111","10001","10001","10001"],
  'L':["10000","10000","10000","10000","10000","10000","11111"],
  ' ':["00000","00000","00000","00000","00000","00000","00000"],
};

// draw a lit/unlit dot (filled circle with a soft additive glow when lit)
function dot(cx,cy,rad,lit){
  for(let y=cy-rad-1;y<=cy+rad+1;y++)for(let x=cx-rad-1;x<=cx+rad+1;x++){
    const d=Math.hypot(x-cx,y-cy);
    if(d<=rad){ if(lit){set(x,y,255,168,40);} else {set(x,y,46,17,6);} }
  }
  if(lit){ for(let y=cy-rad*2;y<=cy+rad*2;y++)for(let x=cx-rad*2;x<=cx+rad*2;x++){const d=Math.hypot(x-cx,y-cy);if(d<rad*2){add(x,y,90*(1-d/(rad*2)),46*(1-d/(rad*2)),6);}}}
}

// render one string at (x0,y0) with dot pitch p and dot radius r
function text(str,x0,y0,p,r){
  let cx=x0;
  for(const ch of str){
    const g=F[ch]||F[' '];
    for(let ry=0;ry<7;ry++)for(let rx=0;rx<5;rx++){
      dot(cx+rx*p, y0+ry*p, r, g[ry][rx]==='1');
    }
    cx += 6*p; // 5 cols + 1 space
  }
}

// ---- panel background: dark maroon with a subtle top sheen + border ----
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=1-y/H;set(x,y,16+t*10,4+t*3,6+t*3);}
for(let t=0;t<7;t++){for(let x=0;x<W;x++){set(x,t,60,26,12);set(x,H-1-t,40,16,8);}for(let y=0;y<H;y++){set(t,y,60,26,12);set(W-1-t,y,60,26,12);}}

// ---- big score line: "245,680" centred ----
// pitch 9, radius 3 → glyph width 6*9=54; 7 glyphs → 378; centre in 512
text("245,680", (W-7*6*9)/2 + 6, 20, 9, 3);
// ---- status line: "BALL 2" left, "X2" right, smaller pitch ----
text("BALL 2", 40, 120, 7, 2);
text("X2", W-40-2*6*7, 120, 7, 2);

// PNG encode (RGBA)
let ct=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;ct[n]=c;}
function crc32(b){let c=0xffffffff;for(let i=0;i<b.length;i++)c=ct[(c^b[i])&0xff]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(ty,d){const l=Buffer.alloc(4);l.writeUInt32BE(d.length,0);const t=Buffer.from(ty);const c=Buffer.alloc(4);c.writeUInt32BE(crc32(Buffer.concat([t,d])),0);return Buffer.concat([l,t,d,c]);}
const raw=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++){raw[y*(W*4+1)]=0;px.copy(raw,y*(W*4+1)+1,y*W*4,y*W*4+W*4);}
const ih=Buffer.alloc(13);ih.writeUInt32BE(W,0);ih.writeUInt32BE(H,4);ih[8]=8;ih[9]=6;
fs.writeFileSync(process.argv[2]||"dmd.png",Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
console.log("wrote",process.argv[2]||"dmd.png");
