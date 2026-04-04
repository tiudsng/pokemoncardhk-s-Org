import fs from 'fs';

function cleanUp(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  let updated = content
    .replace(/text-gray-900 dark:text-gray-900 dark:text-white/g, 'text-gray-900 dark:text-white')
    .replace(/bg-gray-50 dark:bg-gray-100 dark:bg-black\/40/g, 'bg-gray-50 dark:bg-black/40')
    .replace(/bg-white dark:bg-gray-100 dark:bg-white\/10/g, 'bg-gray-100 dark:bg-white/10')
    .replace(/text-gray-500 dark:text-gray-500 dark:text-gray-400/g, 'text-gray-500 dark:text-gray-400')
    .replace(/bg-gray-100\/50 dark:bg-gray-50 dark:bg-white\/5/g, 'bg-gray-100/50 dark:bg-white/5')
    .replace(/text-gray-900 dark:text-gray-900 dark:text-white/g, 'text-gray-900 dark:text-white')
    .replace(/bg-gray-900\/80 dark:bg-gray-100 dark:bg-black\/60/g, 'bg-gray-900/80 dark:bg-black/60')
    .replace(/bg-blue-600\/80 dark:bg-blue-500\/60/g, 'bg-blue-600/80 dark:bg-blue-500/60')
    .replace(/border-gray-800 dark:border-gray-200 dark:border-white\/10/g, 'border-gray-800 dark:border-white/10')
    .replace(/bg-gray-900 dark:bg-white text-gray-900 dark:text-white dark:text-gray-900/g, 'bg-gray-900 dark:bg-white text-white dark:text-gray-900')
    .replace(/text-gray-900 dark:text-gray-900 dark:text-white/g, 'text-gray-900 dark:text-white')
    .replace(/bg-blue-600 border-blue-600 text-gray-900 dark:text-white/g, 'bg-blue-600 border-blue-600 text-white')
    .replace(/bg-indigo-600 border-indigo-600 text-gray-900 dark:text-white/g, 'bg-indigo-600 border-indigo-600 text-white')
    .replace(/bg-gray-100 dark:bg-black\/50 hover:bg-gray-100 dark:bg-black\/70 backdrop-blur-md rounded-full text-gray-900 dark:text-white/g, 'bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white')
    .replace(/bg-white dark:bg-gray-100 dark:bg-white\/10/g, 'bg-gray-100 dark:bg-white/10')
    .replace(/border-gray-100 dark:border-gray-100 dark:border-white\/5/g, 'border-gray-100 dark:border-white/5')
    .replace(/text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-400/g, 'text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400');

  fs.writeFileSync(filepath, updated, 'utf8');
  console.log(`Cleaned up ${filepath}`);
}

cleanUp('./src/Home.tsx');
cleanUp('./src/Articles.tsx');
