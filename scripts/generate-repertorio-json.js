const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '..', 'repertorio');
const outFile = path.resolve(__dirname, '..', 'json', 'repertorio.json');

function isPdf(name){ return path.extname(name).toLowerCase() === '.pdf' }

try{
  const files = fs.readdirSync(repoDir, { withFileTypes: true })
    .filter(d=>d.isFile() && isPdf(d.name))
    .map(d=>d.name)
  // sort alphabetically (pt locale)
  files.sort((a,b)=> a.localeCompare(b,'pt', {sensitivity:'base'}))
  fs.writeFileSync(outFile, JSON.stringify(files, null, 2), 'utf8')
  console.log(`Wrote ${files.length} entries to ${path.relative(process.cwd(), outFile)}`)
    // after updating the list, update the OCR index as well
    try{
      const { execFileSync } = require('child_process');
      execFileSync('node', [path.resolve(__dirname, 'generate-repertorio-ocr.js')], { stdio: 'inherit' });
    }catch(err){
      console.error('Failed to run OCR generator:', err && err.message || err);
    }
}catch(err){
  console.error('Failed to generate repertorio.json:', err.message)
  process.exit(1)
}
