import { cli } from 'clittle';
import { lilconfigSync } from 'lilconfig';
import { existsSync } from 'node:fs';
import { getVersion, joincwd } from './utils/util';
import { run } from './cli/runner';
import { install } from './cli/installer';
import logger from './utils/logger';
import type { Options } from './types';

export async function runCLI() {
    const version = await getVersion();
    const prog = cli('typle [patterns...]').version(version);

    const configExplorer = lilconfigSync('typle', {
        stopDir: process.cwd(),
        packageProp: 'typleConfig',
        cache: true
    });

    function loadConfig (configPath?: string): Partial<Options> {
        try {
            if (configPath && !existsSync(joincwd(configPath))) {
                logger.warn(configPath, 'doesn\'t exist');
                return {};
            }

            return (configPath ? configExplorer.load(configPath) : configExplorer.search())?.config;
        } catch {
            logger.error('couldn\'t load the config file');
            return {};
        }
    }

    logger.info('v' + version);

    prog
        .describe('Scan and install missing Typescript type definitions for dependencies in \'package.json\'.')
        .option('--no-silent, Run install silently.')
        .option('--no-install, Whether to install packages automatically or just update package.json.')
        .option('--pkg-manager [manager], Which package manager to use.', { type: 'string' })
        .option('--ignore-packages [packages...], List of packages to ignore.')
        .option('--ignore-deps [deps...], List of certain dependency fields to ignore e.g. \'dev\'.')
        .option('--config [path], Path to the config file.')
        .option('--cwd [path], The current working directory.',)
        .option('--dry-run, It won\'t cause any changes to package.json.')
        .example('$ typle --ignore-packages nodemon eslint')
        .example('$ typle packages/*')
        .action(async args => {
            const config = loadConfig(args.options.config);
            const options = { patterns: args.patterns, ...config, ...args.options } as Partial<Options>;

            await run(options);
        });

    prog
        .command('install [...libraries]', 'Install packages with their corresponding type declarations.', { alias: 'i' })
        .example('$ typle i semver (will install both semver and @types/semver)')
        .action(async args => {
            const options = { ...loadConfig(), ...args.options };
            await install(args.libraries, options);
        });

    prog.parse();
}