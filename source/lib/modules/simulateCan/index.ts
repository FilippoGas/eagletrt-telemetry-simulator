import * as path from 'path';
import * as treeKill from 'tree-kill';
import { exec } from 'shelljs';
import { ChildProcess } from 'child_process';
import { Logger } from '../../utils';

export interface SimulateCanOptions {
    silent: boolean;
    canInterface: string;
    iterations: number;
    simulateTime: boolean;
};

export class CanSimulatorInstance {
    
    public readonly childprocess: ChildProcess;
    public readonly canInterface: string;
    private logger: Logger;

    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.childprocess.killed) {
                resolve();
            }
            else {
                this.childprocess.on('exit', (code, signal) => {
                    if (signal === 'SIGTERM') {
                        this.logger.success('Can player closed');
                        resolve();
                    }
                    else {
                        this.logger.error('Can player exited');
                        reject({code, signal});
                    }
                });
                this.childprocess.on('error', (code, signal) => {
                    reject({code, signal});
                });
                treeKill(this.childprocess.pid);
            }
        });
    }

    constructor (childprocess: ChildProcess, canInterface: string, logger: Logger) {
        this.childprocess = childprocess;
        this.canInterface = canInterface;
        this.logger = logger;

        this.childprocess.on('exit', (code, signal) => {
            logger.success('Can player finished');
        });
    }

}

const DEFAULT_SOURCE = path.join(__dirname, '..', '..', 'default_sources', 'default.can.log');
const DEFAULT_OPTIONS: SimulateCanOptions = {
    silent: true,
    canInterface: 'can0',
    iterations: Infinity,
    simulateTime: true
};

export async function simulateCan(src: string | null = DEFAULT_SOURCE, options: Partial<SimulateCanOptions> = {}): Promise<CanSimulatorInstance> {
    return new Promise<CanSimulatorInstance>((resolve, reject) => {
        const handledSrc = src ?? DEFAULT_SOURCE;
        const handledOptions: SimulateCanOptions = {...DEFAULT_OPTIONS, ...options};
        const logger = new Logger(handledOptions.silent, 'CAN');

        const commandOptions: string[] = [`-I ${handledSrc}`];
        if (handledOptions.iterations) {
            const value = handledOptions.iterations === Infinity ? 'i' : `${handledOptions.iterations}`;
            commandOptions.push(`-l ${value}`);
        }
        if (!handledOptions.simulateTime) {
            commandOptions.push('-t');
        }
        const stringifiedCommandOptions = commandOptions.join(' ');

        logger.info('Starting canplayer');
        const childProcess = exec(`canplayer ${stringifiedCommandOptions}`, { async: true, silent: handledOptions.silent });
        logger.debug('PID:', null, childProcess.pid);
        const canSimulatorInstance = new CanSimulatorInstance(childProcess, handledOptions.canInterface, logger);
        resolve(canSimulatorInstance);
    });
}
