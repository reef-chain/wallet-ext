import { hooks, Components, NFT as NFTData } from '@reef-chain/react-lib';
import Uik from '@reef-chain/ui-kit';
import { reefState } from '@reef-chain/util-lib';
import React, { useContext, useMemo, useState } from 'react';
import ReefSigners from '../context/ReefSigners';
import strings from '../../i18n/locales';
import { useTheme } from '../context/ThemeContext';
import SqwidButton from './SqwidButton';
const { NFTCard, OverlayNFT } = Components;

function NFTs() {
    const nftsStatus = hooks.useObservableState(reefState.selectedNFTs_status$);
    const [selectedNFT, setSelectedNFT] = useState<NFTData | undefined>(undefined)
    const { accounts, selectedSigner, provider } = useContext(ReefSigners);
    const { isDarkMode } = useTheme();
    const isLoading = nftsStatus?.hasStatus(reefState.FeedbackStatusCode.LOADING);
    return (
        <div>
            <div className={isLoading ? 'nft_loader' : `nfts-container__list`}>
                {isLoading ? <Uik.Loading /> : nftsStatus && nftsStatus.data.length > 0 ? nftsStatus.data.map((nft) =>
                    nft.hasStatus(reefState.FeedbackStatusCode.COMPLETE_DATA) ?
                        <div
                            className='nft__button'
                            role="button"
                            onClick={() => setSelectedNFT(nft.data)}
                        >
                            <NFTCard
                                balance={nft.data.balance}
                                iconUrl={nft.data.iconUrl}
                                name={nft.data.name}
                                mimetype={nft.data.mimetype}
                            />

                        </div> : <Uik.Loading />

                ) : <div className='flex justify-center align-middle flex-col'>

                    <Uik.Text text={strings.no_nfts} className={isDarkMode ? "text--dark-mode" : ""} />

                    <SqwidButton />
                </div>
                }
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