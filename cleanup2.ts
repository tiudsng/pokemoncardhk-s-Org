import fs from 'fs';

function cleanUp(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  let updated = content
    .replace(/dark:bg-gray-50 dark:bg-white\/5/g, 'dark:bg-white/5')
    .replace(/dark:border-gray-100 dark:border-white\/5/g, 'dark:border-white/5')
    .replace(/dark:bg-gray-100 dark:bg-black\/40/g, 'dark:bg-black/40')
    .replace(/dark:text-gray-500 dark:text-gray-400/g, 'dark:text-gray-400')
    .replace(/dark:hover:text-gray-900 dark:text-white/g, 'dark:hover:text-white')
    .replace(/dark:bg-gray-100 dark:bg-white\/10/g, 'dark:bg-white/10')
    .replace(/dark:bg-gray-50 dark:bg-black/g, 'dark:bg-black')
    .replace(/dark:focus:bg-gray-100 dark:bg-white\/10/g, 'dark:focus:bg-white/10')
    .replace(/dark:text-gray-900 dark:text-white/g, 'dark:text-white');

  fs.writeFileSync(filepath, updated, 'utf8');
  console.log(`Cleaned up ${filepath}`);
}

cleanUp('./src/Home.tsx');
cleanUp('./src/Articles.tsx');
cleanUp('./src/Profile.tsx');
cleanUp('./src/ListingDetail.tsx');
