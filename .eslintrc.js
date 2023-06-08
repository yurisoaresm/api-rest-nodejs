module.exports = {
  extends: ['universe/node', 'universe/shared/typescript-analysis'],
  overrides: [
    {
      files: ['*.ts', '*.d.ts'],
      parserOptions: {
        project: './tsconfig.base.json',
      },
    },
  ],
};
