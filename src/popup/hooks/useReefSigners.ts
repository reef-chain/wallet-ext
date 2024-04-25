import { Provider } from '@reef-chain/evm-provider';
import Signer from '../../extension-base/page/Signer';
import { sendMessage } from '../messaging';
import { ReefSigner, rpc } from '@reef-chain/react-lib';
import { useEffect, useState } from 'react';
import { extension as extLib } from '@reef-chain/util-lib';

const injectionSigner = new Signer(sendMessage);

function toReefSigner(acc: extLib.AccountJson, provider: Provider, injectionSigner: Signer): Promise<ReefSigner | undefined> {
    const accWithMeta: extLib.InjectedAccountWithMeta = {
        address: acc.address,
        meta: {
            genesisHash: acc.genesisHash,
            name: acc.name,
            source: acc.name || ''
        },
        //@ts-ignore
        type: acc.type
    };

    return rpc.metaAccountToSigner(accWithMeta, provider, injectionSigner);
}

export const useReefSigners = (accounts: extLib.AccountJson[] | null, provider: Provider | undefined): ReefSigner[] => {
    const [signers, setSigners] = useState<ReefSigner[]>([]);

    useEffect((): void => {
        const initAsync = async () => {
            if (!accounts || !accounts?.length || !provider) {
                setSigners([]);

                return;
            }

            const sgnrs: any[] = await Promise.all<ReefSigner | undefined>(accounts?.map((acc: extLib.AccountJson) => toReefSigner(acc, provider, injectionSigner)));

            setSigners(sgnrs.filter((s) => !!s));
        };

        void initAsync();
    }, [accounts, provider]);

    return signers;
};