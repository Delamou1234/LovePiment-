import fs from 'fs';
import path from 'path';

const root = path.resolve('src');

const replacements = [
  {
    from: /useEffect\(\(\) => \{\s*load\(\);\s*\}, \[load\]\);/g,
    to: 'useRunAfterMount(() => void load(), [load]);',
  },
  {
    from: /useEffect\(\(\) => \{\s*void load\(\);\s*\}, \[load\]\);/g,
    to: 'useRunAfterMount(() => void load(), [load]);',
  },
  {
    from: /useEffect\(\(\) => \{\s*void load\(\);\s*\}, \[load, refreshToken\]\);/g,
    to: 'useRunAfterMount(() => void load(), [load, refreshToken]);',
  },
  {
    from: /useEffect\(\(\) => \{\s*void load\(\);\s*\}, \[load, refreshKey\]\);/g,
    to: 'useRunAfterMount(() => void load(), [load, refreshKey]);',
  },
  {
    from: /useEffect\(\(\) => \{\s*void charger\(\);\s*\}, \[charger\]\);/g,
    to: 'useRunAfterMount(() => void charger(), [charger]);',
  },
  {
    from: /useEffect\(\(\) => \{\s*void charger\(\);\s*\}, \[charger, refreshToken\]\);/g,
    to: 'useRunAfterMount(() => void charger(), [charger, refreshToken]);',
  },
  {
    from: /useEffect\(\(\) => \{\s*load\(\);\s*const interval = setInterval\(load, ([^)]+)\);\s*return \(\) => clearInterval\(interval\);\s*\}, \[load\]\);/g,
    to: 'useRunAfterMount(() => void load(), [load]);\n\n  useEffect(() => {\n    const interval = setInterval(load, $1);\n    return () => clearInterval(interval);\n  }, [load]);',
  },
  {
    from: /useEffect\(\(\) => \{\s*void load\(\);\s*const interval = setInterval\(load, ([^)]+)\);\s*return \(\) => clearInterval\(interval\);\s*\}, \[load\]\);/g,
    to: 'useRunAfterMount(() => void load(), [load]);\n\n  useEffect(() => {\n    const interval = setInterval(load, $1);\n    return () => clearInterval(interval);\n  }, [load]);',
  },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(p);
  }
  return files;
}

const importLine = "import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';\n";

for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const { from, to } of replacements) {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
    from.lastIndex = 0;
  }
  if (changed && !content.includes("useRunAfterMount")) {
    const m = content.match(/^(['"]use client['"];?\s*\n)/);
    if (m) content = m[0] + importLine + content.slice(m[0].length);
    else if (content.startsWith('import ')) {
      const idx = content.indexOf('\n\n');
      content = content.slice(0, idx + 1) + importLine + content.slice(idx + 1);
    }
  }
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('fixed', file);
  }
}
