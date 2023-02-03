module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'plugin:react/recommended',
        'standard-with-typescript',
        'plugin:prettier/recommended',
    ],
    overrides: [],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['react', 'unused-imports', 'react-hooks', 'prettier'],
    rules: {
        'prettier/prettier': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
        'unused-imports/no-unused-imports': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/no-unescaped-entities': 'off',
        'prefer-const': 'warn',
        'no-self-assign': 'warn',
        'multiline-ternary': 'off',
        'no-case-declarations': 'warn',
        'array-callback-return': 'warn',
        'no-prototype-builtins': 'warn',
        '@typescript-eslint/no-dynamic-delete': 'warn',
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/triple-slash-reference': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/prefer-optional-chain': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
}
