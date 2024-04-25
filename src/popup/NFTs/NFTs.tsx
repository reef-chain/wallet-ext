import { hooks } from '@reef-chain/react-lib';
import Uik from '@reef-chain/ui-kit';
import { reefState } from '@reef-chain/util-lib';
import React from 'react'
import { SectionTitle } from '../components/SectionTitle';
import NftContainer from './NftContainer';

function NFTs() {
    const nfts = hooks.useObservableState(reefState.selectedNFTs$);
    return (
        <div>
            <SectionTitle text='NFTs' />
            <div className={nfts == undefined ? 'nft_loader' : `nfts-container__list`}>
                {nfts == undefined ? <Uik.Loading /> : nfts && nfts.length > 0 ? nfts.map((nft) => <div>

                    <NftContainer iconUrl={nft.iconUrl} balance={nft.balance.toString()} name={nft.name} id={nft.nftId.toString()} />
                </div>) : "No NFTs"}
            </div>
        </div>
    )
}

export default NFTs