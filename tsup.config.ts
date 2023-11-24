import { defineConfig } from 'tsup';

/** tsup config */
export default defineConfig({
    clean: true,
    format: ['esm', 'cjs'],
    minifySyntax: true,
    dts: true,
    shims: true,
    splitting: true
});