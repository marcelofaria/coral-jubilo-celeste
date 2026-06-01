const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const repoDir = path.resolve(__dirname, '..', 'repertorio');
const outFile = path.resolve(__dirname, '..', 'json', 'repertorio_ocr.json');

function sanitize(text){
  if(!text) return '';
  return text
     .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
     .replace(/[^0-9A-Za-zÀ-ÿ\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
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
      continue;
    }

    console.log('OCR ->', name);

    // create a temporary base path for images
    const tmpBase = path.join(os.tmpdir(), `ocr-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try{
      execFileSync('pdftoppm', ['-png', '-r', '300', full, tmpBase], { stdio: 'ignore' });
    }catch(err){
      console.error('pdftoppm error (is poppler installed?):', err.message);
      // continue but add empty letra to avoid losing entry
      resultArr.push({ name, title: path.basename(name, '.pdf'), letra: '', mtime });
      continue;
    }

    const tmpDir = path.dirname(tmpBase);
    const baseName = path.basename(tmpBase);
    const imgs = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith(baseName) && f.toLowerCase().endsWith('.png'))
      .map(f => path.join(tmpDir, f))
      .sort();

    let fullText = '';
    for(const img of imgs){
      try{
        const out = execFileSync('tesseract', [img, 'stdout', '-l', 'por'], { encoding:'utf8' });
        fullText += '\n' + out;
      }catch(e){
        console.warn('tesseract failed on', img, e && e.message);
      }
    }

    cleanupFiles(imgs);

    const sanitized = sanitize(fullText);
    resultArr.push({ name, title: path.basename(name, '.pdf'), letra: sanitized, mtime });
  }

  fs.writeFileSync(outFile, JSON.stringify(resultArr, null, 2), 'utf8');
  console.log('Wrote OCR index to', path.relative(process.cwd(), outFile));
}catch(err){
  console.error('generate-repertorio-ocr failed:', err && err.message || err);
  process.exit(1);
}
