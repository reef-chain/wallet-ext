import { hooks, Components, NFT as NFTData } from '@reef-chain/react-lib';
import Uik from '@reef-chain/ui-kit';
import { reefState } from '@reef-chain/util-lib';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import ReefSigners from '../context/ReefSigners';
import strings from '../../i18n/locales';
import { useTheme } from '../context/ThemeContext';
import SqwidButton from './SqwidButton';
import { useHideBalance } from '../context/HideBalance';
const { NFTCard, OverlayNFT } = Components;

function NFTs() {
    const nftsStatus = hooks.useObservableState(reefState.selectedNFTs_status$);
    const [selectedNFT, setSelectedNFT] = useState<NFTData | undefined>(undefined)
    const { accounts, selectedSigner, provider } = useContext(ReefSigners);
    const { isDarkMode } = useTheme();
    const { isHidden } = useHideBalance()
    const isError = nftsStatus?.hasStatus(reefState.FeedbackStatusCode.ERROR);

    const Skeleton = (): JSX.Element => (
        <div className="nft-skeleton">
            <div className={`nft-skeleton__image${isDarkMode ? '-dark' : ''}`} />
            <div className={`nft-skeleton__name${isDarkMode ? '-dark' : ''}`} />
        </div>
    );

    useEffect(() => {
        const balanceElements = document.querySelectorAll('.nfts__item-balance');
        balanceElements.forEach(element => {
            if (isHidden) {
                (element as any).style.display = 'none';
            } else {
                (element as any).style.display = '';
            }
        });
    }, [isHidden, nftsStatus]);

    return (

        isError ? <div className="card-bg-light card token-card--no-balance">
            <div className={`no-token-activity ${isDarkMode ? 'no-token-activity--dark' : ''} `}>
                {strings.encountered_error}
            </div>
        </div> :
            <div>
                <div className={`nfts-container__list`}>
                    {nftsStatus && nftsStatus.data.length > 0 ? nftsStatus.data.map((nft) =>
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
                                    isDarkMode={isDarkMode}
                                />

                            </div> : <Skeleton />
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