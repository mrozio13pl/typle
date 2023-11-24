import glob, { IOptions as GlobOptions } from 'glob';
import { promisify } from 'node:util';

const globPromise = promisify(glob);

/**
 * Function that accepts multiple glob patterns.
 * @param {string | string[]} patterns Glob patterns.
 * @param {GlobOptions} options Options.
 * @returns {Promise<string[]>}
 */
export async function globs(patterns: string | string[], options: GlobOptions): Promise<string[]> {
    if (!Array.isArray(patterns)) {
        patterns = [patterns];
    }

    const results = await Promise.all(patterns.map(pattern => globPromise(pattern, options)));
    return results.flat();
}