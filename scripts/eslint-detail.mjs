import { execSync } from 'child_process';

let out = '';
try {
  out = execSync('npx eslint src --format json', {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
} catch (e) {
  out = e.stdout?.toString() ?? '';
}

const results = JSON.parse(out);
const unused = [];
const anys = [];

for (const f of results) {
  for (const m of f.messages) {
    const rel = f.filePath.replace(/.*kabishop - Copie[\\/]/, '');
    if (m.ruleId === '@typescript-eslint/no-unused-vars') unused.push(`${rel}:${m.line} ${m.message}`);
    if (m.ruleId === '@typescript-eslint/no-explicit-any') anys.push(`${rel}:${m.line} ${m.message}`);
  }
}

console.log('UNUSED', unused.length);
unused.forEach((u) => console.log(u));
console.log('ANY', anys.length);
anys.forEach((a) => console.log(a));

let total = 0;
const rules = {};
for (const f of results) {
  for (const m of f.messages) {
    rules[m.ruleId] = (rules[m.ruleId] || 0) + 1;
    total++;
  }
}
console.log('TOTAL', total);
console.log(JSON.stringify(rules, null, 2));
