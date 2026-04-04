import fs from 'fs';

function standardize(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  let updated = content
    .replace(/bg-\[#0a0a0a\]/g, 'bg-[#1c1c1e]')
    .replace(/bg-\[#1a1a1a\]/g, 'bg-black')
    .replace(/bg-\[#2a2a2a\]/g, 'bg-white/10')
    .replace(/bg-\[#222\]/g, 'bg-white/5');

  fs.writeFileSync(filepath, updated, 'utf8');
  console.log(`Standardized ${filepath}`);
}

standardize('./src/components/PriceLeaderboard.tsx');
standardize('./src/components/PriceRankingBoard.tsx');
