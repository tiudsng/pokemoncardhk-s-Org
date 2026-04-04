import fs from 'fs';

function fixLeaderboard(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  let updated = content
    .replace(/bg-gray-50 dark:bg-\[#1c1c1e\]/g, 'bg-gray-50 dark:bg-black');

  fs.writeFileSync(filepath, updated, 'utf8');
  console.log(`Fixed ${filepath}`);
}

fixLeaderboard('./src/components/PriceLeaderboard.tsx');
