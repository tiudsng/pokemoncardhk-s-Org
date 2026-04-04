import fs from 'fs';

let filepath = './src/Profile.tsx';
let content = fs.readFileSync(filepath, 'utf8');

let updated = content
  .replace(/bg-\[#1c1c1e\]/g, 'bg-white dark:bg-[#1c1c1e]')
  .replace(/bg-\[#050505\]/g, 'bg-gray-50 dark:bg-black')
  .replace(/border-\[#050505\]/g, 'border-white dark:border-black')
  .replace(/border-white\/5/g, 'border-gray-100 dark:border-white/5')
  .replace(/border-white\/10/g, 'border-gray-200 dark:border-white/10')
  .replace(/border-white\/20/g, 'border-gray-300 dark:border-white/20')
  .replace(/text-white/g, 'text-gray-900 dark:text-white')
  .replace(/text-gray-300/g, 'text-gray-600 dark:text-gray-300')
  .replace(/text-gray-400/g, 'text-gray-500 dark:text-gray-400')
  .replace(/bg-white\/5/g, 'bg-gray-50 dark:bg-white/5')
  .replace(/bg-white\/10/g, 'bg-gray-100 dark:bg-white/10')
  .replace(/bg-white\/20/g, 'bg-gray-200 dark:bg-white/20')
  .replace(/bg-black/g, 'bg-gray-100 dark:bg-black')
  .replace(/from-\[#0d0d0d\] to-\[#050505\]/g, 'from-gray-50 to-white dark:from-[#1c1c1e] dark:to-black')
  .replace(/shadow-white\/5/g, 'shadow-black/5 dark:shadow-white/5');

fs.writeFileSync(filepath, updated, 'utf8');
console.log('Updated Profile.tsx');
