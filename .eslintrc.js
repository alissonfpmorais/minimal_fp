module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'functional', 'sonarjs', 'unicorn', 'folders'],
  extends: ['plugin:@typescript-eslint/recommended', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    eqeqeq: 'error',
    'folders/match-regex': ['error', '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$', '/src/'],
    'func-call-spacing': 'error',
    'no-empty': 'error',
    'no-unreachable': 'error',
    'no-constant-condition': 'error',
    'no-param-reassign': 'error',
    'no-unsafe-finally': 'error',
    'require-atomic-updates': 'error',
    'use-isnan': 'error',
    'valid-typeof': ['error', { requireStringLiterals: true }],
    'functional/immutable-data': [
      'error',
      {
        assumeTypes: true,
        ignoreClass: 'fieldsOnly',
        ignoreImmediateMutation: true,
      },
    ],
    'functional/no-method-signature': 'error',
    'functional/prefer-readonly-type': [
      'error',
      {
        allowLocalMutation: false,
        allowMutableReturnType: false,
        checkImplicit: false,
        ignoreClass: 'fieldsOnly',
        ignoreInterface: false,
        ignoreCollections: false,
        ignorePattern: '^mutable',
      },
    ],
    'functional/no-return-void': 'error',
    'sonarjs/cognitive-complexity': ['error', 15],
    'sonarjs/no-inverted-boolean-check': 'error',
    'sonarjs/no-redundant-jump': 'error',
    'sonarjs/no-empty-collection': 'error',
    'unicorn/filename-case': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/typedef': [
      'error',
      {
        arrayDestructuring: true,
        arrowParameter: true,
        memberVariableDeclaration: true,
        objectDestructuring: true,
        parameter: true,
        propertyDeclaration: true,
        variableDeclaration: true,
        variableDeclarationIgnoreFunction: true,
      },
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'variableLike', format: ['camelCase'] },
      {
        selector: 'variable',
        types: ['boolean'],
        format: ['PascalCase'],
        prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
      },
      {
        selector: 'variable',
        types: ['boolean'],
        format: ['PascalCase'],
        prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
      },
      {
        selector: 'parameter',
        types: ['boolean'],
        format: ['PascalCase'],
        prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
      },
      {
        selector: 'variable',
        modifiers: ['const'],
        format: ['camelCase', 'UPPER_CASE'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
      {
        selector: 'memberLike',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'require',
      },
      {
        selector: 'memberLike',
        modifiers: ['protected', 'public'],
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
      },
      {
        selector: 'memberLike',
        modifiers: ['private', 'static', 'readonly'],
        format: ['UPPER_CASE'],
        leadingUnderscore: 'forbid',
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'typeParameter',
        format: ['PascalCase'],
        custom: {
          regex: '^[A-Za-z]{2,}',
          match: true,
        },
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: true,
        },
      },
    ],
  },
};
