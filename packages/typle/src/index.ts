import type { Options } from './types';

/* eslint-disable jsdoc/require-param-description */
/**
 * Define typle config.
 * @param {Partial<Options>} options
 * @returns {Partial<Options>} options
 */
export function defineConfig(options: Partial<Options>): Partial<Options> {
    return options;
}

export * from './cli/runner';
export * from './cli/installer';