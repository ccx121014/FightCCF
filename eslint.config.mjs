import eslint from '@eslint/js'

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'tsconfig.tsbuildinfo'],
  },
  eslint.configs.recommended,
]
