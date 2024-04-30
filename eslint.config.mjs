// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const tslint_config = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
tslint_config.push({
  ignores: ['dist/**/*', 'tests/**/*', 'docs/**/*', 'node_modules/**/*', '*.js', '*.mjs', '*.ts'],
});

export default tslint_config;