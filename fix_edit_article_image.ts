import fs from 'fs';

function fixEditArticleImage(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  let updated = content
    .replace(/bg-\[#1c1c1e\]/g, 'bg-white dark:bg-[#1c1c1e]')
    .replace(/border-white\/10/g, 'border-gray-200 dark:border-white/10')
    .replace(/bg-red-900\/20/g, 'bg-red-50 dark:bg-red-900/20')
    .replace(/border-red-900\/30/g, 'border-red-100 dark:border-red-900/30')
    .replace(/text-red-300/g, 'text-red-600 dark:text-red-300')
    .replace(/bg-black\/40/g, 'bg-gray-100 dark:bg-black/40')
    .replace(/border-white\/5/g, 'border-gray-200 dark:border-white/5')
    .replace(/bg-black\/60/g, 'bg-white/60 dark:bg-black/60')
    .replace(/bg-white\/5/g, 'bg-gray-50 dark:bg-white/5')
    .replace(/hover:bg-white\/10/g, 'hover:bg-gray-100 dark:hover:bg-white/10')
    .replace(/bg-blue-900\/20/g, 'bg-blue-50 dark:bg-blue-900/20')
    .replace(/hover:bg-blue-900\/30/g, 'hover:bg-blue-100 dark:hover:bg-blue-900/30')
    .replace(/border-blue-900\/30/g, 'border-blue-200 dark:border-blue-900/30')
    .replace(/text-gray-400/g, 'text-gray-500 dark:text-gray-400')
    .replace(/hover:text-white/g, 'hover:text-gray-900 dark:hover:text-white');

  fs.writeFileSync(filepath, updated, 'utf8');
  console.log(`Fixed ${filepath}`);
}

fixEditArticleImage('./src/components/EditArticleImageModal.tsx');
