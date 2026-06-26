import fs from 'fs';
import path from 'path';

const importLine = "import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';\n";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (/\.tsx?$/.test(entry.name)) files.push(p);
  }
  return files;
}

for (const file of walk('src')) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('useRunAfterMount(')) continue;
  if (content.includes("from '@/shared/hooks/useRunAfterMount'")) continue;

  const m = content.match(/^(['"]use client['"];?\s*\n)/);
  if (m) content = m[0] + importLine + content.slice(m[0].length);
  else {
    const idx = content.indexOf('\n\n');
    content = content.slice(0, idx + 1) + importLine + content.slice(idx + 1);
  }
  fs.writeFileSync(file, content);
  console.log('import added', file);
}
