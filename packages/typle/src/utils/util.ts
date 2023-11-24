import path from 'node:path';
import semver from 'semver';
import spawn from 'cross-spawn';
import isUnicodeSupported from 'is-unicode-supported';
import { createSpinner } from 'nanospinner';
import { getDependencies, readPkg } from 'typle-util';
import type { Options } from '../types';
import type { Dependency } from 'typle-core';
import type { PackageJson, Packument } from '@npm/types';
import type { PackageManager } from '@antfu/install-pkg';

export const joincwd = path.join.bind(void 0, process.cwd());
export const spinner = createSpinner();
export const allowedPackageManagers: PackageManager[] = ['npm', 'yarn', 'pnpm', 'bun'] as const;
export const defaultOptions: Options = {
    silent: true,
    install: true,
    dryRun: false,
    pkgManager: void 0,
    patterns: [],
    ignorePackages: [],
    ignoreDeps: [],
    additionalArgs: []
};

/** Clear spinner. */
export function clearSpinner(): void {
    // looks sort of ugly but i really wanna get rid of the spinner
    spinner.stop();
    process.stdout.moveCursor(0, -1);
    process.stdout.write(' '.repeat(process.stdout.columns || 50) + '\r');
}

/** Read local package.json. */
export async function getPkgJson(): Promise<PackageJson> {
    return await readPkg(path.join(__dirname, '../package.json'));
}

/** Get typle version. */
export async function getVersion(): Promise<string> {
    const pkgJson = await getPkgJson();
    return pkgJson.version;
}

/**
 * Clean version e.g. `^5.0.0` -> `5.0.0`.
 * @param {string} version version
 * @returns {string | null}
 */
function cleanSemver(version: string): string | null {
    return semver.clean(version, { loose: true }) || semver.valid(semver.coerce(version));
}

/** Get current Typescript version. */
export async function getTypescriptVersion(): Promise<string | null> {
    const pkgJson = await readPkg();
    const localTypescriptVersion = getDependencies(pkgJson).typescript;

    if (localTypescriptVersion) {
        return cleanSemver(localTypescriptVersion);
    }

    // installed globally
    return new Promise((resolve, reject) => {
        const proc = spawn('tsc -v');
        proc.stdout?.on('data', version => {
            resolve(cleanSemver(version.toString()));
        });

        // typescript not installed ig
        proc.once('exit', () => {
            reject();
        });
    });
}

/**
 * Get matching `@types` library version with the actual library.
 * @param {Dependency} dep dependency
 * @param {Packument} packument packument
 */
export function matchVersion(dep: Dependency, packument: Packument): string | null {
    return Object.keys(packument.versions)
        .filter(version => {
            try {
                return (
                    semver.satisfies(version, semver.validRange(dep.version) || '^' + semver.major(cleanSemver(dep.version) || dep.version), { includePrerelease: true })
                    || semver.satisfies(version, '^' + semver.major(cleanSemver(dep.version) || dep.version), { includePrerelease: true })
                ) && !('deprecated' in packument.versions[version]);
            } catch {
                return false;
            }
        })
        .sort((a, b) => semver.rcompare(a, b))[0];
}

/**
 * Check if the current terminal supports unicode.
 * @param {string} str string that has unicode
 * @param {string} alt alt value if the current terminal doesn't support unicde
 * @returns {string}
 */
export function getUnicode(str: string, alt = ''): string {
    return isUnicodeSupported() ? str : alt;
}