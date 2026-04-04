import fs from 'fs';

function fixBadges(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  let updated = content
    .replace(/bg-\[#1c1c1e\]/g, 'bg-white dark:bg-[#1c1c1e]')
    .replace(/border-white\/10/g, 'border-gray-200 dark:border-white/10')
    .replace(/text-white/g, 'text-gray-900 dark:text-white')
    .replace(/text-gray-300/g, 'text-gray-600 dark:text-gray-300')
    .replace(/text-gray-400/g, 'text-gray-500 dark:text-gray-400')
    .replace(/bg-white\/5/g, 'bg-gray-50 dark:bg-white/5')
    .replace(/bg-black\/80/g, 'bg-gray-900/80 dark:bg-black/80')
    .replace(/bg-black/g, 'bg-gray-100 dark:bg-black');

  fs.writeFileSync(filepath, updated, 'utf8');
  console.log(`Fixed ${filepath}`);
}

fixBadges('./src/components/UserBadges.tsx');
