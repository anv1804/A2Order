import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
 { ignores: ['**/dist/**', '**/node_modules/**', '**/android/**', '**/ios/**', '**/prisma/migrations/**'] },
 js.configs.recommended,
 { rules: { "no-empty": ["error", { allowEmptyCatch: true }] } },
 { files: ['**/*.ts', '**/*.tsx'], languageOptions: { parser: tseslint.parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } }, rules: { 'no-undef': 'off', 'no-unused-vars': 'off', 'no-redeclare': 'off', 'no-dupe-class-members': 'off', 'no-useless-escape': 'off' } },
 { files: ['**/*.mjs', '**/*.js'], languageOptions: { globals: { console:'readonly', process:'readonly', Buffer:'readonly', setTimeout:'readonly', clearTimeout:'readonly', URL:'readonly', fetch:'readonly', module:'readonly', require:'readonly', __dirname:'readonly', setInterval:'readonly', clearInterval:'readonly' } } }
);
