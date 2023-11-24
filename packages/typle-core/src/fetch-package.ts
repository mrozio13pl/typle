import phin from 'phin';
import { REGISTRY_URL } from 'typle-util';
import type { Packument } from '@npm/types';

/**
 * Fetch package in NPM registry.\
 * Returns `undefined` if it was not found.
 * @param {string} lib library name
 * @returns {Promise<Packument | undefined>}
 * @see https://npm.im/@npm/types#types
 */
export async function fetchPackage(lib: string): Promise<Packument | undefined> {
    const res = (await phin<Packument & { error?: string }>({
        url: new URL(lib, REGISTRY_URL),
        parse: 'json'
    })).body;

    if (res.error) {
        return void 0;
    }

    return res;
}