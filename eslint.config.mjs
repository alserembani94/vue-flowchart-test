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
}, {
  files: ['src/components/ui/**/*.vue'],
  rules: {
    'vue-a11y/form-control-has-label': 'off',
    'vue-a11y/label-has-for': 'off',
  },
})
