import fs from 'fs';

let filepath = './src/components/UserBadges.tsx';
let content = fs.readFileSync(filepath, 'utf8');

let updated = content
  .replace(/text-gray-900 dark:text-white bg-gradient-to-r/g, 'text-white bg-gradient-to-r')
  .replace(/bg-gradient-to-br \$\{currentLevel.color\} text-gray-900 dark:text-white/g, 'bg-gradient-to-br ${currentLevel.color} text-white');

fs.writeFileSync(filepath, updated, 'utf8');
console.log('Fixed button text colors in UserBadges.tsx');
