module.exports = {
  'env': {
    'es6': true,
    'node': true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaFeatures': {
      'jsx': true,
    },
    'ecmaVersion': 2018,
    'sourceType': 'module',
  },
  'plugins': [
    'react',
    '@typescript-eslint',
    'react-hooks',
  ],
  'rules': {
    'indent': [
      'error',
      2,
      { 'SwitchCase': 1 },
    ],
    'linebreak-style': [
      'error',
      'unix',
    ],
    'quotes': [
      'error',
      'single',
    ],
    'semi': [
      'error',
      'always',
    ],
    'jsx-quotes': [
      'error',
      'prefer-single',
    ],
    '@typescript-eslint/no-use-before-define': 'off',
    'react/jsx-first-prop-new-line': [
      'error',
      'multiline',
    ],
    'react/jsx-closing-tag-location': ['error'],
    'react/jsx-max-props-per-line': ['error', { 'maximum': 2, 'when': 'multiline' }],
    '@typescript-eslint/no-empty-interface': [
      'error',
      {
        'allowSingleExtends': true,
      },
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        'selector': 'interface',
        'format': ['PascalCase'],
        'custom': {
          'regex': '^I[A-Z]',
          'match': true,
        },
      },
    ],
    'object-curly-spacing': [
      'error',
      'always',
    ],
    'comma-dangle': ['error', 'always-multiline'],
    'react-hooks/rules-of-hooks': 'error', 
    // 'react-hooks/exhaustive-deps': 'warn',
    // "react/jsx-one-expression-per-line": ["error"]
    'no-restricted-imports': [ 
      'error',
      {
        paths: [
          {
            name: 'react-native-gesture-handler',
            importNames: ['TouchableOpacity'],
            message: 'Import TouchableOpacity from react-native instead! Think 200000 times if you don`t want importing from react native',
          },
        ],
      },
    ],
  },
};
