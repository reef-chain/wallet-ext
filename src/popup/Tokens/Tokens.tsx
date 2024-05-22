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

const { Skeleton, TokenCard } = Components;

function Tokens() {
    const { selectedSigner, provider, network, accounts, reefState } = useContext(ReefSigners);
    const pools = hooks.useAllPools(axios);
    const selectedTknPrices = hooks.useObservableState<any>(reefState.selectedTokenPrices_status$);

    const { isDarkMode } = useTheme();

    const tokens = useMemo(() => {
        return selectedTknPrices ? selectedTknPrices.data.map((val) => val.data) : [];
    }, [selectedTknPrices]);

    const isLoading = (selectedTknPrices?.hasStatus(reefState.FeedbackStatusCode.LOADING));

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
                selectedTknPrices.data[idx].hasStatus(reefState.FeedbackStatusCode.LOADING) ? <>
                    <Uik.Loading />
                </> :
                    <TokenCard
                        accounts={accounts as any}
                        hideBalance={false} //todo: if we want to use hiding eye
                        pools={pools}
                        tokenPrices={tokenPrices as any}
                        signer={selectedSigner as any}
                        nw={network}
                        selectedSigner={selectedSigner as any}
                        provider={provider}
                        useDexConfig={useDexConfig}
                        isReefswapUI={false} //todo: set to true if we want to show swap overlay
                        price={tokenPrices[token.address] || 0}
                        token={token}
                        tokens={tokens}
                        isDarkMode={isDarkMode}
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
                    isLoading ?
                        <div>
                            <Skeleton isDarkMode={true} />
                            <Skeleton isDarkMode={true} />
                            <Skeleton isDarkMode={true} />
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