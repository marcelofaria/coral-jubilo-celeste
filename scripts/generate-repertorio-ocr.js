const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const repoDir = path.resolve(__dirname, '..', 'repertorio');
const outFile = path.resolve(__dirname, '..', 'json', 'repertorio_ocr.json');

function sanitize(text){
  if(!text) return '';
  // keep accented letters (no NFD removal), remove digits and non-letters
  return text
    // replace digits with space
    .replace(/\d+/g, ' ')
    // keep letters (including accented) and spaces only
    .replace(/[^\p{L}\s]/gu, ' ')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
}

function joinHyphenated(text){
  if(!text) return '';
  return text
    // remove hyphen at end of line produced by PDF line-break hyphenation
    .replace(/-\r?\n\s*/g, '')
    // join words separated by hyphen/dash/underscore with optional spaces
    .replace(/(\p{L})[-–—_]\s+(\p{L})/gu, '$1$2')
    .replace(/(\p{L})[-–—_](\p{L})/gu, '$1$2');
}
function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive:true }) }

function listPdfFiles(dir){
  return fs.readdirSync(dir, { withFileTypes:true })
    .filter(d=>d.isFile() && path.extname(d.name).toLowerCase()==='.pdf')
    .map(d=>d.name);
}

function cleanupFiles(files){
  for(const f of files){
    try{ fs.unlinkSync(f) }catch(e){}
  }
}

try{
  ensureDir(path.dirname(outFile));

  // prefer reading the canonical list from json/repertorio.json if available
  let files = null;
  const repListPath = path.resolve(__dirname, '..', 'json', 'repertorio.json');
  if(fs.existsSync(repListPath)){
    try{ files = JSON.parse(fs.readFileSync(repListPath,'utf8')) }catch(e){ files = null }
  }
  if(!Array.isArray(files)){
    files = listPdfFiles(repoDir);
  }

  let prevIndexArr = [];
  if(fs.existsSync(outFile)){
    try{ prevIndexArr = JSON.parse(fs.readFileSync(outFile,'utf8')) }catch(e){ prevIndexArr = [] }
  }
  const prevIndex = prevIndexArr.reduce((m,e)=>{ m[e.name]=e; return m }, {});

  const resultArr = [];

  for(const name of files){
    const full = path.join(repoDir, name);
    let mtime = 0;
    try{ const stat = fs.statSync(full); mtime = stat.mtimeMs }catch(e){ mtime = 0 }

    if(prevIndex[name] && prevIndex[name].mtime === mtime){
      resultArr.push(prevIndex[name]);
      // write incremental progress so JSON stays up-to-date
      try{ fs.writeFileSync(outFile, JSON.stringify(resultArr, null, 2), 'utf8') }catch(e){}
      continue;
    }

    console.log('OCR ->', name);

    // create a temporary base path for images
    const tmpBase = path.join(os.tmpdir(), `ocr-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try{
      // higher DPI helps OCR accuracy
      execFileSync('pdftoppm', ['-png', '-r', '400', full, tmpBase], { stdio: 'ignore' });
    }catch(err){
      console.error('pdftoppm error (is poppler installed?):', err.message);
      // continue but add empty letra to avoid losing entry
      resultArr.push({ name, title: path.basename(name, '.pdf'), letra: '', mtime });
      try{ fs.writeFileSync(outFile, JSON.stringify(resultArr, null, 2), 'utf8') }catch(e){}
      continue;
    }

    const tmpDir = path.dirname(tmpBase);
    const baseName = path.basename(tmpBase);
    const imgs = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith(baseName) && f.toLowerCase().endsWith('.png'))
      .map(f => path.join(tmpDir, f))
      .sort();

    let rawText = '';
    for(const img of imgs){
      try{
        // use LSTM engine and a reasonable PSM for lines/blocks
        const out = execFileSync('tesseract', [img, 'stdout', '-l', 'por', '--oem', '1', '--psm', '6'], { encoding:'utf8' });
        rawText += '\n' + out;
      }catch(e){
        console.warn('tesseract failed on', img, e && e.message);
      }
    }

    cleanupFiles(imgs);

    // basic post-processing heuristics to reduce OCR noise
    function postProcess(text){
      if(!text) return '';
      let t = text;
      // remove very long repeated characters
      t = t.replace(/([a-zA-Z])\1{4,}/g, '$1$1');
      // remove long digit sequences (page numbers, footers)
      t = t.replace(/\d{5,}/g, ' ');
      // common OCR confusions: rn -> m when between vowels
      t = t.replace(/([aeiou])rn([aeiou])/gi, '$1m$2');
      // replace isolated 1/0 inside words: e.g. c1e -> cle, a0a -> aoa
      t = t.replace(/(\p{L})1(\p{L})/gu, '$1l$2');
      t = t.replace(/(\p{L})0(\p{L})/gu, '$1o$2');
      return t;
    }

    const combined = joinHyphenated(rawText);
    const post = postProcess(combined);
    const sanitized = sanitize(post);
    resultArr.push({ name, title: path.basename(name, '.pdf'), letra: sanitized, mtime });
    // write incremental progress after each processed document
    try{ fs.writeFileSync(outFile, JSON.stringify(resultArr, null, 2), 'utf8') }catch(e){}
  }

  fs.writeFileSync(outFile, JSON.stringify(resultArr, null, 2), 'utf8');
  console.log('Wrote OCR index to', path.relative(process.cwd(), outFile));
}catch(err){
  console.error('generate-repertorio-ocr failed:', err && err.message || err);
  process.exit(1);
}
