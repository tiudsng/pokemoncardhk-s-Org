import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', function(filepath) {
  if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let updated = content
      .replace(/bg-\[#0d0d0d\]/g, 'bg-[#1c1c1e]')
      .replace(/bg-\[#050505\]/g, 'bg-black');
    if (content !== updated) {
      fs.writeFileSync(filepath, updated, 'utf8');
      console.log(`Updated ${filepath}`);
    }
  }
});
