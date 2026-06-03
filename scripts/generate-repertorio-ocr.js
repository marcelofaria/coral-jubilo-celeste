//npm run generate-repertorio
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const repoDir = path.resolve(__dirname, '..', 'repertorio');
const outFile = path.resolve(__dirname, '..', 'json', 'repertorio_ocr.json');
const OCR_VERSION = 4;
const OCR_DPI = Number(process.env.OCR_DPI || 300);
const MIN_WORD_CONF = Number(process.env.OCR_MIN_CONF || 45);

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
    // join syllables commonly printed under musical notes: Te - nho, li--do, ha-bi- tar
    .replace(/(\p{L})\s*[-–—_]+\s*(\p{L})/gu, '$1$2');
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

function postProcess(text){
  if(!text) return '';
  let t = text;
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  t = joinHyphenated(t);
  // remove repeated OCR artifacts while preserving legitimate double letters.
  t = t.replace(/([a-zA-Z])\1{4,}/g, '$1$1');
  t = t.replace(/\d{5,}/g, ' ');
  // common OCR confusions in Portuguese hymn text.
  t = t.replace(/([aeiouáéíóúâêôãõ])rn([aeiouáéíóúâêôãõ])/gi, '$1m$2');
  t = t.replace(/(\p{L})1(\p{L})/gu, '$1l$2');
  t = t.replace(/(\p{L})0(\p{L})/gu, '$1o$2');
  t = t.replace(/\b8\.\s*/g, '3. ');
  t = t.replace(/\bManvue\)?\b/gi, 'Manuel');
  t = t.replace(/\bdescança\b/gi, 'descansa');
  return t;
}

function stripTokenNoise(token){
  return String(token || '')
    .replace(/[|_=+~^<>[\]{}\\/]+/g, ' ')
    .replace(/[.,;:!?()"«»]+$/g, '')
    .replace(/^[.,;:!?()"«»]+/g, '')
    .trim();
}

function isVerseMarker(token){
  return /^[1-9][.)]?$/.test(token);
}

function isLikelyWord(token){
  const t = stripTokenNoise(token);
  if(isVerseMarker(t)) return true;
  const letters = (t.match(/\p{L}/gu) || []).length;
  if(letters < 2) return /^[AÉEIÓOU]$/iu.test(t);
  const symbols = (t.match(/[^\p{L}\d\s.,;:!?'"«»()\-–—]/gu) || []).length;
  return symbols <= 1;
}

function parseTsv(tsv){
  const lines = String(tsv || '').split(/\r?\n/);
  const rows = [];
  for(let i = 1; i < lines.length; i++){
    if(!lines[i]) continue;
    const cols = lines[i].split('\t');
    if(cols.length < 12 || cols[0] !== '5') continue;
    const text = cols.slice(11).join('\t').trim();
    if(!text) continue;
    rows.push({
      block: Number(cols[2]),
      par: Number(cols[3]),
      line: Number(cols[4]),
      word: Number(cols[5]),
      left: Number(cols[6]),
      top: Number(cols[7]),
      width: Number(cols[8]),
      height: Number(cols[9]),
      conf: Number(cols[10]),
      text,
    });
  }
  return rows;
}

function groupWordsIntoLines(rows){
  const byLine = new Map();
  for(const row of rows){
    const key = `${row.block}:${row.par}:${row.line}`;
    if(!byLine.has(key)) byLine.set(key, []);
    byLine.get(key).push(row);
  }
  return Array.from(byLine.values()).map(words => {
    words.sort((a,b) => a.word - b.word || a.left - b.left);
    return {
      top: Math.min(...words.map(w => w.top)),
      left: Math.min(...words.map(w => w.left)),
      words,
    };
  }).sort((a,b) => a.top - b.top || a.left - b.left);
}

function cleanOcrLine(line){
  const kept = [];
  for(const word of line.words){
    const token = stripTokenNoise(word.text);
    if(!token) continue;
    if(/^[-–—]+$/.test(token)){
      kept.push('-');
      continue;
    }
    if(!isLikelyWord(token)) continue;
    const hasLetters = /\p{L}/u.test(token);
    const confOk = word.conf >= MIN_WORD_CONF || (hasLetters && token.length >= 4 && word.conf >= 35);
    if(confOk || isVerseMarker(token)) kept.push(token);
  }

  const alphaTokens = kept.filter(t => /\p{L}/u.test(t));
  const alphaChars = alphaTokens.join('').match(/\p{L}/gu) || [];
  const avgConf = line.words.reduce((sum,w) => sum + Math.max(0, w.conf), 0) / Math.max(1, line.words.length);
  const shortRatio = alphaTokens.length
    ? alphaTokens.filter(t => (t.match(/\p{L}/gu) || []).length <= 2).length / alphaTokens.length
    : 1;
  const keptRatio = kept.length / Math.max(1, line.words.length);
  const upperTokens = alphaTokens.filter(t => {
    const letters = t.replace(/[^\p{L}]/gu, '');
    return letters.length >= 2 && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
  }).length;
  const upperRatio = alphaTokens.length ? upperTokens / alphaTokens.length : 0;

  if(alphaTokens.length < 2 || alphaChars.length < 6) return '';
  if(line.words.length >= 8 && keptRatio < 0.45) return '';
  if(avgConf < 30 && alphaTokens.length < 4) return '';
  if(shortRatio > 0.75 && alphaTokens.length < 5) return '';
  if(alphaTokens.length >= 4 && upperRatio > 0.65 && !kept.some(isVerseMarker)) return '';

  return kept.join(' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function organizeLines(lines){
  const header = [];
  const verses = {};
  const other = [];

  for(const original of lines){
    const line = original.replace(/\b8\./g, '3.').trim();
    const match = line.match(/^([1-9])[.)]?\s+(.+)/);
    if(match){
      const n = match[1];
      if(!verses[n]) verses[n] = [];
      verses[n].push(match[2]);
    }else if(Object.keys(verses).length === 0){
      header.push(line);
    }else{
      other.push(line);
    }
  }

  return [
    ...header,
    ...Object.keys(verses).sort((a,b) => Number(a) - Number(b)).map(n => verses[n].join(' ')),
    ...other,
  ].join('\n');
}

function runTesseractTsv(img, outBase){
  const tsvFile = `${outBase}.tsv`;
  try{ fs.unlinkSync(tsvFile) }catch(e){}
  execFileSync('tesseract', [
    img,
    outBase,
    '-l', 'por',
    '--oem', '1',
    '--psm', '6',
    '-c', 'tessedit_create_tsv=1',
    '-c', 'preserve_interword_spaces=1',
  ], { stdio: 'ignore' });
  const tsv = fs.readFileSync(tsvFile, 'utf8');
  try{ fs.unlinkSync(tsvFile) }catch(e){}
  return tsv;
}

function extractTextFromImage(img, outBase){
  const rows = parseTsv(runTesseractTsv(img, outBase));
  const lines = groupWordsIntoLines(rows)
    .map(cleanOcrLine)
    .filter(Boolean);
  return organizeLines(lines);
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

    if(prevIndex[name] && prevIndex[name].mtime === mtime && prevIndex[name].ocrVersion === OCR_VERSION){
      resultArr.push(prevIndex[name]);
      // write incremental progress so JSON stays up-to-date
      try{ fs.writeFileSync(outFile, JSON.stringify(resultArr, null, 2), 'utf8') }catch(e){}
      continue;
    }

    console.log('OCR ->', name);

    // create a temporary base path for images
    const tmpBase = path.join(os.tmpdir(), `ocr-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try{
      // Render at a stable DPI; extremely high DPI tends to amplify staff-line noise.
      execFileSync('pdftoppm', ['-png', '-r', String(OCR_DPI), full, tmpBase], { stdio: 'ignore' });
    }catch(err){
      console.error('pdftoppm error (is poppler installed?):', err.message);
      // continue but add empty letra to avoid losing entry
      resultArr.push({ name, title: path.basename(name, '.pdf'), letra: '', mtime, ocrVersion: OCR_VERSION });
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
    const generatedFiles = [...imgs];
    for(let i = 0; i < imgs.length; i++){
      const img = imgs[i];
      try{
        rawText += '\n' + extractTextFromImage(img, `${tmpBase}-page-${i + 1}`);
      }catch(e){
        console.warn('tesseract failed on', img, e && e.message);
      }
    }

    cleanupFiles(generatedFiles);

    const post = postProcess(rawText);
    const sanitized = sanitize(post);
    resultArr.push({ name, title: path.basename(name, '.pdf'), letra: sanitized, mtime, ocrVersion: OCR_VERSION });
    // write incremental progress after each processed document
    try{ fs.writeFileSync(outFile, JSON.stringify(resultArr, null, 2), 'utf8') }catch(e){}
  }

  fs.writeFileSync(outFile, JSON.stringify(resultArr, null, 2), 'utf8');
  console.log('Wrote OCR index to', path.relative(process.cwd(), outFile));
}catch(err){
  console.error('generate-repertorio-ocr failed:', err && err.message || err);
  process.exit(1);
}
