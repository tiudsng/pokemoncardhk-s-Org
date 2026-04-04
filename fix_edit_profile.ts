import fs from 'fs';

function fixEditProfile(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  let updated = content
    .replace(/bg-\[#1c1c1e\]/g, 'bg-white dark:bg-[#1c1c1e]')
    .replace(/border-white\/10/g, 'border-gray-200 dark:border-white/10')
    .replace(/text-white/g, 'text-gray-900 dark:text-white')
    .replace(/text-gray-400/g, 'text-gray-500 dark:text-gray-400')
    .replace(/bg-white\/5/g, 'bg-gray-50 dark:bg-white/5')
    .replace(/bg-black\/20/g, 'bg-gray-100 dark:bg-black/20')
    .replace(/bg-black\/40/g, 'bg-gray-900/40 dark:bg-black/40')
    .replace(/bg-black/g, 'bg-gray-100 dark:bg-black')
    .replace(/border-\[#050505\]/g, 'border-white dark:border-black')
    .replace(/bg-white text-black/g, 'bg-gray-900 dark:bg-white text-white dark:text-gray-900')
    .replace(/shadow-white\/10/g, 'shadow-gray-900/10 dark:shadow-white/10')
    .replace(/hover:text-white/g, 'hover:text-gray-900 dark:hover:text-white')
    .replace(/bg-blue-600 text-gray-900 dark:text-white/g, 'bg-blue-600 text-white')
    .replace(/bg-blue-500 text-gray-900 dark:text-white/g, 'bg-blue-500 text-white');

  fs.writeFileSync(filepath, updated, 'utf8');
  console.log(`Fixed ${filepath}`);
}

fixEditProfile('./src/components/EditProfileModal.tsx');
