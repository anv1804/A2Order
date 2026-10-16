import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const parsePath = require.resolve('braces/lib/parse.js');
const marker = 'A2ORDER_BRACES_DEPTH_BOUND';
let source = readFileSync(parsePath, 'utf8');
if (!source.includes(marker)) {
 const target = "const parse = (input, options = {}) => {";
 if (!source.includes(target)) throw new Error('Review braces security patch before updating dependency');
 const guard = `\n  // A2ORDER_BRACES_DEPTH_BOUND: GHSA-vfj7-8cjw-p6xm\n  if (typeof input === 'string') {\n    let depth = 0;\n    for (let i = 0; i < input.length; i++) {\n      if (input[i] === '\\\\') { i++; continue; }\n      if (input[i] === '{' || input[i] === '(' || input[i] === '[') {\n        if (++depth > 64) throw new RangeError('Pattern nesting exceeds safe build limit');\n      } else if (input[i] === '}' || input[i] === ')' || input[i] === ']') depth = Math.max(0, depth - 1);\n    }\n  }\n`;
 source = source.replace(target, target + guard);
 writeFileSync(parsePath, source);
}
const braces = require('braces');
let blocked = false;
try { braces('{'.repeat(10000) + 'a' + '}'.repeat(10000)); } catch (error) { blocked = error instanceof RangeError; }
if (!blocked) throw new Error('Braces depth guard is not active');
console.log('Build pattern depth guard verified');
