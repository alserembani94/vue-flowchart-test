import antfu from '@antfu/eslint-config'

export default antfu({
  vue: {
    a11y: true,
  },
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },
  ignores: ['typed-router.d.ts'],
})
