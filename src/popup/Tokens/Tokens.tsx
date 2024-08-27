import React, { useContext, useMemo } from 'react'
import { SectionTitle } from '../components/SectionTitle'
import { AddressToNumber, Components, Token, TokenWithAmount, hooks } from '@reef-chain/react-lib'
import "./index.css"
import ReefSigners from '../context/ReefSigners';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { useDexConfig } from '../hooks/useDexConfig';
import Uik from '@reef-chain/ui-kit';
import { useTheme } from '../context/ThemeContext';
import strings from '../../i18n/locales';
import { useHideBalance } from '../context/HideBalance';

const { Skeleton, TokenCard } = Components;

function Tokens() {
    const { selectedSigner, provider, network, accounts, reefState } = useContext(ReefSigners);
    const pools = hooks.useAllPools(axios);
    const selectedTknPrices = hooks.useObservableState<any>(reefState.selectedTokenPrices_status$);
    const hideBalance = useHideBalance();

    const { isDarkMode } = useTheme();

    const tokens = useMemo(() => {
        return selectedTknPrices ? selectedTknPrices.data.map((val) => val.data) : [];
    }, [selectedTknPrices]);

    const isError = selectedTknPrices?.hasStatus(reefState.FeedbackStatusCode.ERROR);

    const tokenPrices = useMemo(
        () => (tokens ? tokens.reduce((prices: AddressToNumber<number>, tkn) => {
            prices[tkn.address] = tkn.price;// eslint-disable-line
            return prices;
        }, {}) : []),
        [tokens],
    );

    const balanceValue = (token: Token, price = 0): number => (new BigNumber(token.balance.toString())
        .div(new BigNumber(10).pow(token.decimals))
        .multipliedBy(price)
        .toNumber());


    const tokenCards = tokens?.filter(({ balance }) => {
        try {
            return balance.gt(0);
        } catch (error) {
        }
        return false;
    })
        .sort((a, b) => {
            const balanceA = balanceValue(a, tokenPrices[a.address] || 0);
            const balanceB = balanceValue(b, tokenPrices[b.address] || 0);

            if (balanceA > balanceB) return -1;
            return 1;
        })
        .sort((a) => {
            if (a.symbol !== 'REEF') return 1;
            return -1;
        })
        .map((token, idx) => {
            return (
                <TokenCard
                    accounts={accounts as any}
                    hideBalance={hideBalance}
                    pools={pools}
                    tokenPrices={tokenPrices as any}
                    signer={selectedSigner as any}
                    nw={network}
                    selectedSigner={selectedSigner as any}
                    provider={provider}
                    useDexConfig={useDexConfig}
                    isReefswapUI={true}
                    price={tokenPrices[token.address] || 0}
                    token={token}
                    tokens={tokens}
                    isDarkMode={isDarkMode}
                // isLoading={selectedTknPrices.data[idx].hasStatus(reefState.FeedbackStatusCode.LOADING)} todo undo later
                />

            );
        });
    return (
        <>
            {
                isError ? <div className="card-bg-light card token-card--no-balance">
                    <div className={`no-token-activity ${isDarkMode ? 'no-token-activity--dark' : ''} `}>
                        {strings.encountered_error}
                    </div>
                </div> :
                    selectedTknPrices == undefined ?
                        <div>
                            <Skeleton isDarkMode={isDarkMode} />
                            <Skeleton isDarkMode={isDarkMode} />
                            <Skeleton isDarkMode={isDarkMode} />
                        </div> : Object.keys(tokenPrices).length ?
                            <>{tokenCards}</> :
                            <div className="card-bg-light card token-card--no-balance">
                                <div className={`no-token-activity ${isDarkMode ? 'no-token-activity--dark' : ''} `}>
                                    {strings.no_tokens_found} &nbsp;
                                    {network.name === 'mainnet'
                                        ? <a className="text-btn" href={"https://onramp.money/main/buy/?appId=487411&walletAddress="}>{strings.get_reef_tokens}</a>
                                        : (
                                            <a className="text-btn" href={'https://discord.com/channels/1116016091014123521/1120371707019010128'} target="_blank" rel="noopener noreferrer">
                                                {strings.get_reef_test_tokens}
                                            </a>
                                        )}
                                </div>
                            </div>
            }
        </>
    )
}

export default Tokens