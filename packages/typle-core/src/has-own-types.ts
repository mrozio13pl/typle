import resolve from 'resolve';
import findUpKeys from 'find-up-keys';
import path from 'node:path';
import fs from 'node:fs';
import { readPkg } from 'typle-util';

/**
 * Does a library provide built-in type definitions.\
 * Note that it has to be installed locally first.
 * @param {string} lib library name
 * @param {string} cwd cwd
 * @returns {Promise<boolean>}
 */
export async function hasOwnTypes(lib: string, cwd = process.cwd()): Promise<boolean> {
    const pkgPath = resolve.sync(lib + '/package.json', { basedir: cwd });
    const libDir = path.dirname(pkgPath);

    if (!fs.existsSync(pkgPath)) throw new Error(`${lib} not found (probably not installed)`);

    const pkgJson = await readPkg(pkgPath);
    const types = findUpKeys(pkgJson, 'types')[0] || /** LEGACY */findUpKeys(pkgJson, 'typings')[0];

    if (types) {
        if (typeof types === 'string') return fs.existsSync(path.join(libDir, types));
        if (typeof types === 'object') {
            return Object.values(types)
                .filter(tdfile => typeof tdfile === 'string')
                .some(tdfile => fs.existsSync(path.join(libDir, tdfile as string)));
        }
    }

    const mainFile = pkgJson.main || 'index.js';
    const typesFile = mainFile.replace(/\.[^.]+$/, '');

    return ['.d.ts', '.d.mts', '.d.cts'].some(ext => fs.existsSync(path.join(libDir, typesFile + ext)));
}