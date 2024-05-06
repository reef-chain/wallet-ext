import { hooks, Components, NFT as NFTData } from '@reef-chain/react-lib';
import Uik from '@reef-chain/ui-kit';
import { reefState } from '@reef-chain/util-lib';
import React, { useContext, useState } from 'react'
import { SectionTitle } from '../components/SectionTitle';
import ReefSigners from '../context/ReefSigners';
import strings from '../../i18n/locales';
const { NFTCard, OverlayNFT } = Components;

function NFTs() {
    const nfts = hooks.useObservableState(reefState.selectedNFTs$);
    const [selectedNFT, setSelectedNFT] = useState<NFTData | undefined>(undefined)
    const { accounts, selectedSigner, provider } = useContext(ReefSigners);
    return (
        <div>
            <SectionTitle text={strings.nfts} />
            <div className={nfts == undefined ? 'nft_loader' : `nfts-container__list`}>
                {nfts == undefined ? <Uik.Loading /> : nfts && nfts.length > 0 ? nfts.map((nft) => <div
                    className='nft__button'
                    role="button"
                    onClick={() => setSelectedNFT(nft)}
                >
                    <NFTCard
                        balance={nft.balance}
                        iconUrl={nft.iconUrl}
                        name={nft.name}
                        mimetype={nft.mimetype}
                    />
                </div>) : strings.no_nfts}
                {!!selectedNFT && (

                    <OverlayNFT
                        isOpen={!!selectedNFT}
                        onClose={() => setSelectedNFT(undefined)}
                        nftName={selectedNFT.name}
                        isVideoNFT={selectedNFT.mimetype !== undefined && selectedNFT.mimetype?.includes('mp4')}
                        iconUrl={selectedNFT.iconUrl}
                        balance={selectedNFT.balance.toString()}
                        address={selectedNFT.address}
                        contractType={selectedNFT.contractType}
                        nftId={selectedNFT.nftId}
                        accounts={accounts}
                        selectedSigner={selectedSigner}
                        provider={provider}
                    />

                )}
            </div>
        </div>
    )
}

export default NFTs