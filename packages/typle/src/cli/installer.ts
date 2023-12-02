import fs from 'node:fs';
import semver from 'semver';
import pc from 'picocolors';
import { installPackage } from '@antfu/install-pkg';
import { convertToTypes } from 'typle-util';
import { fetchPackage, hasOwnTypes } from 'typle-core';
import updater from '../updater';
import logger from '../utils/logger';
import { allowedPackageManagers, getTypescriptVersion, joincwd } from '../utils/util';
import type { Options } from '../types';
import type { PackageJson } from '@npm/types';
import type { Argv } from 'ofi';

/**
 * Install packages with `@types` definitions.
 * @param {string[]} libs libraries to install
 * @param {Pick<Options, 'pkgManager'>} [options] options
 */
export async function install(libs: string[], options: Pick<Options, 'pkgManager'> = {}): Promise<void> {
    if (!fs.existsSync(joincwd('package.json'))) {
        logger.error('could\'t find \'package.json\' in this directory');
        process.exit(1);
    }

    // additional arguments
    const args = options as Argv;
    const additionalArgs: string[] = [];

    Object.keys(args).forEach(arg => {
        const opt = args[arg];
        if (Array.isArray(opt)) return;
        additionalArgs.push('--' + arg);
        if (!/^(true|false)$/i.test(opt)) additionalArgs.push(opt);
    });

    const typescriptVersion = await getTypescriptVersion();
    const tsTag = typescriptVersion && 'ts' + semver.major(typescriptVersion) + '.' + semver.minor(typescriptVersion);

    if (typescriptVersion) {
        logger.info('typescript: v' + typescriptVersion);
    } else {
        logger.warn('couldn\'t find any typescript version, is it installed?');
    }

    if (options.pkgManager && !allowedPackageManagers.includes(options.pkgManager)) {
        logger.warn(
            options.pkgManager, 'is not a valid or supported package manager', pc.gray(pc.italic((`(we only support ${pc.underline('npm')} ${pc.underline('yarn')} ${pc.underline('pnpm')} and ${pc.underline('bun')})`)))
        );
        delete options.pkgManager;
    }

    logger.warn('this feature is experimental');

    await updater();

    logger.info('installing libraries');

    await installPackage(libs, { additionalArgs });

    const libraries: PackageJson[] = [];

    await Promise.all(
        libs.map(async lib => {
            const lastindex = lib.lastIndexOf('@');
            if (lastindex !== -1) lib = lib.slice(0, Math.max(0, lastindex));

            try {
                if (await hasOwnTypes(lib)) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                logger.error(error.message);
                process.exit(1);
            }

            const dtlib = convertToTypes(lib);
            const packument = await fetchPackage(dtlib);

            if (!packument) {
                logger.warn(lib, 'doesn\'t provide any type definitions');
                return;
            }

            const tags = packument['dist-tags'];
            const tag = tsTag ? tags[tsTag] || tags.latest : tags.latest;

            if (!tag || !packument.versions[tag]) {
                logger.error(`No valid release tag found for ${packument.name}`);
                return;
            }

            const pkg = packument.versions[tag];
            libraries.push(pkg);
        })
    );

    if (!libraries.length) return;

    logger.info('installing types');

    await installPackage(libraries.map(lib => lib.name + '@^' + lib.version), { dev: true, additionalArgs });
}