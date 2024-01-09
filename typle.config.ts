import fs from 'node:fs';
import yaml from '@mroz/js-yaml';
import { defineConfig } from './packages/typle/dist';

const { packages } = yaml.load(fs.readFileSync('./pnpm-workspace.yaml', 'utf8')) as { packages: string[] };

export default defineConfig({
    ignorePackages: ['eslint', 'lerna', '@mrozio/eslint-config'],
    patterns: packages
});