import { createContext } from 'react';
import { ReefSigner } from '@reef-chain/react-lib';
import { network as nw } from '@reef-chain/util-lib';
import { Provider } from '@reef-chain/evm-provider';
import { Observable } from 'rxjs';

interface setAddr {
    (val: string): void;
}
interface setNet {
    (val: nw.Network): void;
}
export interface ReefState {
    setSelectedAddress: setAddr;
    setSelectedNetwork: setNet;
    selectedTokenPrices$: Observable<never>
}

interface ReefSignersContext {
    accounts: ReefSigner[] | undefined;
    selectedSigner: ReefSigner | undefined;
    network: nw.Network;
    provider: Provider | undefined;
    reefState: ReefState;
}
export default createContext<ReefSignersContext>({
    accounts: [],
    selectedSigner: undefined,
    network: undefined,
    provider: undefined,
    reefState: undefined,
});
