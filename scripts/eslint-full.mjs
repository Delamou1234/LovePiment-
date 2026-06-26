import { execSync } from 'child_process';

let out = '';
try {
  out = execSync('npx eslint . --format json', {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
} catch (e) {
  out = e.stdout?.toString() ?? '';
}

const results = JSON.parse(out);
const rules = {};
let total = 0;
let sse = 0;

for (const f of results) {
  for (const m of f.messages) {
    rules[m.ruleId] = (rules[m.ruleId] || 0) + 1;
    total++;
    if (m.ruleId === 'react-hooks/set-state-in-effect') sse++;
  }
}

console.log('set-state-in-effect:', sse);
console.log('TOTAL:', total);
console.log(JSON.stringify(rules, null, 2));
