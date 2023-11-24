import pc from 'picocolors';
import { getUnicode } from './util';
import { TYPES_PREFIX } from 'typle-util';

/**
 * Create a list of packages 📦
 * @param {string[]} pkgs List of packages
 * @param {string} filepath File path
 * @returns {string}
 */
export function generateList(pkgs: string[], filepath: string): string {
    let list = `${' '.repeat(process.stdout.columns || 30)}\n${getUnicode('📦 ')}typle ${pc.gray(pc.italic('- ' + filepath))} ${pc.italic(`(added ${pkgs.length} package${pkgs.length > 1 ? 's' : ''})`)}`;

    pkgs.forEach((pkg, i) => {
        const c = getUnicode(i === pkgs.length - 1 ? '└╴' : '├╴', '- ');
        list += '\n' + pc.white(c) + pc.gray(TYPES_PREFIX) + pc.blue(pc.bold(pkg.replace(TYPES_PREFIX, '')));
    });

    return list + '\n';
}