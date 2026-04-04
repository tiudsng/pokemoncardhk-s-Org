import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let newContent = content.replace(/<img([^>]+)>/g, (match, p1) => {
      if (p1.includes('referrerPolicy')) {
        return match;
      }
      if (p1.endsWith('/')) {
        return `<img${p1.slice(0, -1)} referrerPolicy="no-referrer" />`;
      }
      return `<img${p1} referrerPolicy="no-referrer">`;
    });
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
