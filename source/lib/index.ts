import { execAsync, Logger } from './utils';

export enum VirtualizeCanResult {
    VIRTUALIZED = 'virtualized',
    ALREADY_VIRTUALIZED = 'already_virtualized'
};
export interface VirtualizeCanOptions {
    silent: boolean;
};
const DEFAULT_VIRTUALIZE_CAN_OPTIONS: VirtualizeCanOptions =  {
    silent: true
};
export async function virtualizeCan(canInterface: string = 'can0', options: Partial<VirtualizeCanOptions> = {}): Promise<VirtualizeCanResult> {
    const handledOptions: VirtualizeCanOptions = {...DEFAULT_VIRTUALIZE_CAN_OPTIONS, ...options};
    const logger = new Logger(handledOptions.silent, 'CAN');

    let result: VirtualizeCanResult = VirtualizeCanResult.VIRTUALIZED;
    
    try {
        logger.info('Setting up CAN interface');
        logger.debug('Can interface: ', canInterface);
        await execAsync(`sudo modprobe vcan`, { silent: handledOptions.silent });
        await execAsync(`sudo ip link add dev ${canInterface} type vcan`, { silent: handledOptions.silent });
        await execAsync(`sudo ip link set up ${canInterface}`, { silent: handledOptions.silent });
        logger.success('CAN interface virtualized');
    }
    catch (error) {
        if (error.code === 2 && error.stderr === 'RTNETLINK answers: File exists\n') {
            result = VirtualizeCanResult.ALREADY_VIRTUALIZED;
            logger.warning('CAN inteface already virtualized');
        }
    }
 
    return result;
}

export async function simulateCan() {

}

export async function simulateGPS() {

}

async function main() {
    try{
        const res = await virtualizeCan('vvcan0', {silent: false});
        console.log(res)
    }
    catch (error) {
        console.log(error);
    }
}
main();