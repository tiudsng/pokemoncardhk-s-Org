import fs from 'fs';

let filepath = './src/Profile.tsx';
let content = fs.readFileSync(filepath, 'utf8');

let updated = content
  .replace(/bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white/g, 'bg-blue-600 hover:bg-blue-700 text-white')
  .replace(/bg-purple-600 hover:bg-purple-700 text-gray-900 dark:text-white/g, 'bg-purple-600 hover:bg-purple-700 text-white')
  .replace(/bg-blue-600 text-gray-900 dark:text-white/g, 'bg-blue-600 text-white')
  .replace(/bg-green-500\/80 text-gray-900 dark:text-white/g, 'bg-green-500/80 text-white')
  .replace(/bg-amber-500\/80 text-gray-900 dark:text-white/g, 'bg-amber-500/80 text-white')
  .replace(/bg-gray-500\/80 text-gray-900 dark:text-white/g, 'bg-gray-500/80 text-white')
  .replace(/bg-blue-600\/60 text-gray-900 dark:text-white/g, 'bg-blue-600/60 text-white')
  .replace(/fill-white/g, 'fill-current');

fs.writeFileSync(filepath, updated, 'utf8');
console.log('Fixed button text colors in Profile.tsx');
