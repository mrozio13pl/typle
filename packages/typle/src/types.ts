import type { PackageManager } from '@antfu/install-pkg';

export declare interface Options {
    /** Run install silently */
    readonly silent: boolean;
    /** Whether to install all packages or only update `package.json` */
    readonly install: boolean;
    /**
     * Which package manager to use.\
     * Allowed: `npm`, `yarn`, `pnpm` or `bun`.
     */
    pkgManager?: PackageManager;
    /** List of packages to ignore. */
    readonly ignorePackages: string[];
    /**
     * List of certain dependency fields to ignore.\
     * For example to ignore `devDependencies` use `--ignore-deps devDependencies` or `--ignore-deps dev` for shorthand.
     */
    readonly ignoreDeps: string[];
    /** Paths or globs where `package.json` files will be scanned. */
    readonly patterns: string | string[];
    /** Additional arguments for package install. */
    readonly additionalArgs: string[];
    /** If specified, it won't make any changes in `package.json` or install any packages. */
    readonly dryRun: boolean;
}