import { convertToTypes, getDependencies, TYPES_PREFIX } from 'typle-util';
import { hasOwnTypes } from './has-own-types';
import type { PackageJSON } from '@npm/types';

export declare interface Dependency {
    name: string;
    version: string;
}

/**
 * Filter libraries that don't have types built-in or types installed.
 * @param {PackageJSON} pkg package.json
 * @param {string} cwd cwd
 */
export async function filterTypes(pkg: PackageJSON, cwd = process.cwd()): Promise<Dependency[]> {
    const dependencies = Object.keys(getDependencies(pkg));
    const typesDependencies = dependencies.filter(dependency => dependency.startsWith(TYPES_PREFIX));
    const filteredDependencies = await Promise.all(
        dependencies.map(async dep => {
            const hasOwn = await hasOwnTypes(dep, cwd);
            return !dep.startsWith(TYPES_PREFIX) && !typesDependencies.includes(convertToTypes(dep)) && !hasOwn;
        })
    );

    return dependencies
        .filter((_, i) => filteredDependencies[i])
        .map(dep => ({
            name: dep,
            version: getDependencies(pkg)[dep] as string
        }));
}