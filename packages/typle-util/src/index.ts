import fs from 'node:fs';
import path from 'node:path';
import type { PackageJson } from '@npm/types';

/** `@types/` library prefix */
export const TYPES_PREFIX = '@types/';
/** npm registry url */
export const REGISTRY_URL = 'https://registry.npmjs.org/';

/**
 * Remove `@types/` from package name.
 * @param {string} lib library name
 * @returns {string}
 */
export function stripTypes(lib: string): string {
    lib = lib.replace(/\//g, '__');
    if (lib.codePointAt(0) === 64) lib = lib.slice(1);
    return lib;
}

/**
 * Convert package name to `@types`, e.g. `@babel/code-frame` -> `@types/babel__code-frame`.
 * @param {string} lib library name
 * @returns {string}
 */
export function convertToTypes(lib: string): string {
    lib = stripTypes(lib);
    if (!lib.startsWith(TYPES_PREFIX)) lib = TYPES_PREFIX + lib;
    return lib;
}

/**
 * Read package.json from given path.
 * @param {string} pkgPath path to package.json
 * @returns {Promise<PackageJson>}
 */
export async function readPkg(pkgPath = path.join(process.cwd(), 'package.json')): Promise<PackageJson> {
    return JSON.parse(await fs.promises.readFile(pkgPath, 'utf8'));
}

/**
 * Get all dependencies from `package.json`.
 * @param {PackageJson} pkg package.json
 * @returns {Record<string, string>}
 */
export function getDependencies(pkg: PackageJson): Record<string, string> {
    return { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies, ...(pkg as PackageJson & { optionalDependencies: Record<string, string> }).optionalDependencies };
}