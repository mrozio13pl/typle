import updateNotifier from 'tiny-update-notifier';
import pc from 'picocolors';
import logger from './utils/logger';
import { getPkgJson, getUnicode } from './utils/util';

/** Check for updates. */
export default async function updater(): Promise<void> {
    const pkg = await getPkgJson();

    try {
        const update = await updateNotifier({ pkg });

        if (update) {
            logger.info(`update available: ${pc.gray(update.current)} ${getUnicode('→', '->')} ${pc.green(update.latest)} (${update.type})`);
        }
    } catch {
        logger.warn('couldn\'t fetch new updates');
    }
}