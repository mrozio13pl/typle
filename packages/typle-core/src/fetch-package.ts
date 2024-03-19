import * as https from 'node:https';
import { URL } from 'node:url';
import { REGISTRY_URL } from 'typle-util';
import type { Packument } from '@npm/types';

/**
 * Fetch package in NPM registry.\
 * Returns `undefined` if it was not found.
 * @param {string} lib library name
 * @returns {Promise<Packument | undefined>}
 * @see https://npm.im/@npm/types#types
 */
export function fetchPackage(lib: string): Promise<Packument | undefined> {
    return new Promise((resolve, reject) => {
        const url = new URL(lib, REGISTRY_URL);

        const req = https.get(url, res => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                const packument: Packument & { error?: string } = JSON.parse(data);
                if (packument.error) {
                    resolve(void 0);
                } else {
                    resolve(packument);
                }
            });
        });

        req.on('error', error => {
            reject(error);
        });

        req.end();
    });
}
