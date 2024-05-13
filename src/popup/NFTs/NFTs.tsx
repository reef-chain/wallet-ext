import { hooks, Components, NFT as NFTData } from '@reef-chain/react-lib';
import Uik from '@reef-chain/ui-kit';
import { reefState } from '@reef-chain/util-lib';
import React, { useContext, useMemo, useState } from 'react';
import ReefSigners from '../context/ReefSigners';
import strings from '../../i18n/locales';
import { useTheme } from '../context/ThemeContext';
const { NFTCard, OverlayNFT } = Components;

function NFTs() {
    const nftsStatus = hooks.useObservableState(reefState.selectedNFTs_status$);
    const [selectedNFT, setSelectedNFT] = useState<NFTData | undefined>(undefined)
    const { accounts, selectedSigner, provider } = useContext(ReefSigners);
    const { isDarkMode } = useTheme();
    const nfts = nftsStatus?.data.map((val) => val.data);
    const isLoading = useMemo(() => {
        return nftsStatus ? !(nftsStatus.getStatus()[0].code == 6) : true;
    }, [nftsStatus]);
    return (
        <div>
            <Uik.Text text={strings.nfts} />
            <div className={isLoading ? 'nft_loader' : `nfts-container__list`}>
                {isLoading ? <Uik.Loading /> : nfts && nfts.length > 0 ? nfts.map((nft) => <div
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

                </div>) : <Uik.Text text={strings.no_nfts} className={isDarkMode ? "text--dark-mode" : ""} />}
                {
                    !!selectedNFT && (

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

                    )
                }
            </div >
        </div >
    )
}

export default NFTs