import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

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
const rules = {};
const sse = [];

for (const f of results) {
  for (const m of f.messages) {
    rules[m.ruleId] = (rules[m.ruleId] || 0) + 1;
    if (m.ruleId === 'react-hooks/set-state-in-effect') {
      const rel = f.filePath.replace(/.*kabishop - Copie[\\/]/, '');
      sse.push(`${rel}:${m.line}`);
    }
  }
}

const summary = { rules, sseCount: sse.length, sse };
writeFileSync('eslint-summary.json', JSON.stringify(summary, null, 2));
console.log('SSE:', sse.length);
console.log('Rules:', JSON.stringify(rules, null, 2));
sse.forEach((s) => console.log(s));
