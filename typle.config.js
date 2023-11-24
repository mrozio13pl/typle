const fs = require('fs');
const yaml = require('js-yaml');
const { defineConfig } = require('./packages/typle/dist');

const { packages } = yaml.load(fs.readFileSync('./pnpm-workspace.yaml', 'utf8'));

module.exports = defineConfig({
    ignorePackages: ['eslint', 'lerna', '@mrozio/eslint-config'],
    patterns: packages
});