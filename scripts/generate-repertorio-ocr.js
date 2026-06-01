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
  const entries = listPdfFiles(repoDir);

  let prevIndex = {};
  if(fs.existsSync(outFile)){
    try{ prevIndex = JSON.parse(fs.readFileSync(outFile,'utf8')) }catch(e){ prevIndex = {} }
  }

  const result = {};

  for(const name of entries){
    const full = path.join(repoDir, name);
    const stat = fs.statSync(full);
    const mtime = stat.mtimeMs;

    if(prevIndex[name] && prevIndex[name].mtime === mtime){
      result[name] = prevIndex[name];
      continue;
    }

    console.log('OCR ->', name);

    // create a temporary base path for images
    const tmpBase = path.join(os.tmpdir(), `ocr-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try{
      // convert PDF pages to PNG images (requires pdftoppm)
      execFileSync('pdftoppm', ['-png', '-r', '300', full, tmpBase], { stdio: 'ignore' });
    }catch(err){
      console.error('pdftoppm error (is poppler installed?):', err.message);
      process.exit(1);
    }

    // collect generated images
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

    // cleanup images
    cleanupFiles(imgs);

    const sanitized = sanitize(fullText);
    result[name] = { title: path.basename(name, '.pdf'), text: sanitized, mtime };
  }

  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
  console.log('Wrote OCR index to', path.relative(process.cwd(), outFile));
}catch(err){
  console.error('generate-repertorio-ocr failed:', err && err.message || err);
  process.exit(1);
}
