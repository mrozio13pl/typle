import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import pc from 'picocolors';
import { scan } from '../scanner';
import updater from '../updater';
import logger from '../utils/logger';
import { session } from '../utils/session';
import { globs } from '../utils/glob';
import { getTypescriptVersion, joincwd, defaultOptions, allowedPackageManagers } from '../utils/util';
import type { Options } from '../types';

const { exit } = process;

// eslint-disable-next-line jsdoc/require-param
/** Run typle. */
export async function run(options_: Partial<Options> = {}): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: Options & Record<string, any> = { ...defaultOptions, ...options_ };

    const start = Date.now(); // start time
    const typescriptVersion = await getTypescriptVersion();
    const tsTag = typescriptVersion ? 'ts' + semver.major(typescriptVersion) + '.' + semver.minor(typescriptVersion) : void 0;

    if (typescriptVersion) {
        logger.info('typescript: v' + typescriptVersion);
    } else {
        logger.warn('couldn\'t find any typescript version, is it installed?');
    }

    if (options.pkgManager && !allowedPackageManagers.includes(options.pkgManager)) {
        logger.warn(
            pc.bold(options.pkgManager), 'is not a valid or supported package manager', pc.gray(pc.italic((`(supported: ${pc.bold('npm')}, ${pc.bold('yarn')}, ${pc.bold('pnpm')} and ${pc.bold('bun')})`)))
        );
        delete options.pkgManager;
    }

    await updater();

    const pkgPath = joincwd('package.json');

    if (!options.patterns?.length) {
        // no patterns
        if (!fs.existsSync(pkgPath)) {
            logger.error('couldn\'t find \'package.json\' in this directory');
            exit(1);
        }

        await scan(pkgPath, tsTag, options);
    } else {
        const files = await globs(options.patterns, { dot: true, absolute: true, nodir: false });

        if (!files.length) {
            logger.info('no matching patterns found');
            return;
        }

        logger.info(`found ${files.length} matching patterns`);

        for (const file of files) {
            const pkgPath = path.join(file, 'package.json');

            if (!fs.existsSync(pkgPath)) {
                logger.warn('couldn\'t find \'package.json\' in ', path.dirname(pkgPath));
                return;
            }

            await scan(pkgPath, tsTag, options);
        }
    }

    if (options.dryRun) logger.info(`no changes made ${pc.gray(pc.italic('(--dry-run)'))}`);

    // show results
    const time = ((Date.now() - start) / 1e3).toFixed(1) + 's';
    if (session.install_count) {
        logger.success(`added ${session.install_count} new typings in ${time}`);
    } else {
        logger.success(`no typings added in ${time}`);
    }
}