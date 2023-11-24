import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import detectIndent from 'detect-indent';
import { detectPackageManager, installPackage } from '@antfu/install-pkg';
import { convertToTypes, readPkg } from 'typle-util';
import { fetchPackage, filterTypes } from 'typle-core';
import logger from './utils/logger';
import { session } from './utils/session';
import { generateList } from './utils/generate-list';
import { clearSpinner, defaultOptions, joincwd, matchVersion, spinner } from './utils/util';
import type { Options } from './types';
import type { PackageJson } from '@npm/types';

const { exit } = process;
const pkgCwd = joincwd('package.json');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function scan(pkgPath = pkgCwd, tsTag = 'latest', options: Options & Record<string, any>) {
    const cwd = path.resolve(pkgPath);
    const pkgDir = path.relative(process.cwd(), cwd);
    const prettyPkgPath = (cwd === pkgCwd ? '' : pc.gray(pc.italic(' (' + pkgDir + ')')));

    spinner.start({ text: `scanning ${cwd === pkgCwd ? pc.blue('package.json') : pc.blue(pkgDir)} for typings\r`, color: 'blue' });

    const pkgJson = await readPkg(pkgPath);
    const types = [];
    const libraries: PackageJson[] = [];

    try {
        types.push(...await filterTypes(pkgJson, cwd));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        logger.error(error.message);
        exit(1);
    }

    // filter out packages that don't have their typings in '@types'
    // convert package names to '@types'
    await Promise.all(
        types.map(async lib => {
            if (options.ignorePackages.includes(lib.name)) return;
            if (options.ignoreDeps.some(deps => {
                if (deps === 'deps') deps = 'dependencies';
                const pkgEl = (pkgJson[(deps as keyof PackageJson)] || pkgJson[(deps + 'Dependencies' as keyof PackageJson)]) as Record<string, unknown>;

                return pkgEl?.[lib.name];
            })) return;

            const dtlib = convertToTypes(lib.name);
            const packument = await fetchPackage(dtlib);

            if (!packument) {
                logger.warn(pc.bold(lib.name), 'doesn\'t provide any type definitions');
                return;
            }

            // get the correct version
            const tags = packument['dist-tags'];
            const version = matchVersion(lib, packument) || (tsTag ? tags[tsTag] || tags.latest : tags.latest);

            if (!version || !packument.versions[version]) {
                logger.error(`No valid release tag found for ${packument.name}`);
                return;
            }

            const pkg = packument.versions[version];
            libraries.push(pkg);
        })
    );

    // clear spinner after a scan
    clearSpinner();

    if (!libraries.length) {
        logger.info('no typings to add' + prettyPkgPath);
        return;
    }

    // display what types will be added
    console.log(
        generateList(libraries.map(({ name }) => name).sort(), cwd === pkgCwd ? 'package.json' : pkgDir)
    );

    // stop if --dry-run
    if (options.dryRun) return;

    const pkgManager = options.pkgManager || ((await detectPackageManager(cwd)) || 'npm').split('@')[0];
    const installCmd = pkgManager === 'yarn' ? 'add' : 'install';
    if (options.install) {
        /**
         * install libraries using current package manager
         */
        const pkgs = libraries.map(pkg => pkg.name.trim() + '@^' + pkg.version.trim());
        const additionalArgs: string[] = options.additionalArgs;

        // clear args
        Object.keys(options).filter(option => !Object.keys(defaultOptions).includes(option)).forEach(option => {
            const opt = options[option];
            if (Array.isArray(opt)) return;
            additionalArgs.push('--' + option);
            if (!/^(true|false)$/i.test(opt)) additionalArgs.push(opt);
        });

        // display a preview of the install command
        const cmd = `${pkgManager} ${installCmd} --save-dev ${pkgs.join(' ')} ${additionalArgs.join(' ')}`;
        logger.info(`$ ${cmd}`);

        if (options.silent) spinner.start({ text: `installing ${pc.cyan(pkgs.length + ' package' + (pkgs.length > 1 ? 's' : ''))} via ${pkgManager}\r`, color: 'cyan' });
        try {
            await installPackage(pkgs, { dev: true, silent: options.silent, additionalArgs, cwd: path.dirname(cwd), packageManager: pkgManager });
        } catch {
            logger.error('Something went wrong while installing dependencies. Try running the following command yourself:', pc.gray(cmd));
            exit(1);
        }
        if (options.silent) clearSpinner();
    } else {
        /**
         * don't install, just update package.json
         */
        pkgJson.devDependencies = pkgJson.devDependencies || {};
        libraries.forEach(lib => {
            (pkgJson.devDependencies as Record<string, string>)[lib.name] = `^${lib.version}`;
        });

        // sort dependencies alphabetically
        pkgJson.devDependencies = Object.fromEntries(Object.keys(pkgJson.devDependencies).sort().map(key => [key, pkgJson.devDependencies![key]]));

        // make sure to keep the indent
        const indent = detectIndent(await fs.promises.readFile(pkgPath, 'utf8')).amount || 2;
        await fs.promises.writeFile(pkgPath, JSON.stringify(pkgJson, undefined, indent), 'utf8');
        logger.info('succesfully updated package.json');
        logger.info(`run ${pc.cyan(`${pkgManager} ${installCmd}`)} to install newly added packages`);
    }

    session.install_count += libraries.length;
}