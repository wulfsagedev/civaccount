import fs from 'fs';

const file = 'src/data/councils/unitary.ts';
let content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

const result = [];
let prevLine = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  const prevTrimmed = prevLine.trim();

  // Skip duplicate accounts_url or transparency_url lines
  if (trimmed.startsWith('accounts_url:') && prevTrimmed.startsWith('accounts_url:')) {
    console.log(`Removed duplicate accounts_url at line ${i + 1}`);
    continue;
  }
  if (trimmed.startsWith('transparency_url:') && prevTrimmed.startsWith('transparency_url:')) {
    console.log(`Removed duplicate transparency_url at line ${i + 1}`);
    continue;
  }

  result.push(line);
  prevLine = line;
}

// Also check for duplicate sources[] blocks (consecutive)
let finalContent = result.join('\n');

// Fix indentation: old broken lines used 12 spaces, correct is 6 spaces
// Normalize accounts_url and transparency_url indentation to 6 spaces
finalContent = finalContent.replace(/^            (accounts_url:)/gm, '      $1');
finalContent = finalContent.replace(/^            (transparency_url:)/gm, '      $1');

fs.writeFileSync(file, finalContent);

// Count remaining
const remaining = finalContent.match(/accounts_url/g)?.length || 0;
const transpRemaining = finalContent.match(/transparency_url/g)?.length || 0;
console.log(`\nDone! accounts_url count: ${remaining}, transparency_url count: ${transpRemaining}`);
