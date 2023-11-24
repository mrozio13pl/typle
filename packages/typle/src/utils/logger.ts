import pc from 'picocolors';
import { getUnicode } from './util';

// Simple logger.

const PREFIX = 'typle';
const logger: Record<string, (...msg: string[]) => void> = {};
const levels = {
    info: pc.cyan('INFO'),
    warn: pc.yellow('WARN'),
    error: pc.red('ERROR'),
    success: pc.green(getUnicode('✔', '√')),
};

function log(...msg: string[]): void {
    console.log(PREFIX, ...msg);
}

logger.info = (...msg: string[]) => {
    log(levels.info, ...msg);
};
logger.success = (...msg: string[]) => {
    log(levels.success, ...msg);
};
logger.warn = (...msg: string[]) => {
    log(levels.warn, ...msg);
};
logger.error = (...msg: string[]) => {
    log(levels.error, ...msg);
};

export default logger;