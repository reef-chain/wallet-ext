import { faPaperPlane, faRepeat } from '@fortawesome/free-solid-svg-icons';
import Uik from '@reef-chain/ui-kit';
import BigNumber from 'bignumber.js';
import React, { useMemo, useState } from 'react';
import './index.css';
import { network as libNet } from '@reef-chain/util-lib';
import { Provider } from '@reef-chain/evm-provider';
import { PoolWithReserves, Token, TokenPrices, Components, utils } from '@reef-chain/react-lib';
import { ReefSigner } from '../../extension-base/page/ReefSigner';

const { OverlaySend, OverlaySwap } = Components;
const { notify, toCurrencyFormat } = utils;

interface TokenCard {
    price: number;
    token: Token
    onClickPrice?: () => void;
    className?: string;
    tokens: Token[];
    selectedSigner: ReefSigner | undefined;
    provider: Provider | undefined;
    accounts: ReefSigner[] | undefined;
    hideBalance: any;
    tokenPrices: TokenPrices;
    pools: PoolWithReserves[];
    signer: ReefSigner | undefined;
    nw: any;
    useDexConfig: any;
    isReefswapUI: boolean;
    isDarkMode?: boolean;
    isLoading?: boolean;
    isWalletConnect?: boolean;
    handleWalletConnectModal?: (val: boolean) => void;
}

export const TokenCard: React.FC<TokenCard> = ({
    token,
    price,
    onClickPrice,
    className,
    tokens,
    selectedSigner,
    provider,
    accounts,
    hideBalance,
    tokenPrices,
    pools,
    signer,
    nw,
    useDexConfig,
    isReefswapUI,
    isDarkMode = false,
    isLoading = false,
    isWalletConnect = false,
    handleWalletConnectModal
}: TokenCard): JSX.Element => {
    const [isSwapOpen, setSwapOpen] = useState(false);
    const [isSendOpen, setSendOpen] = useState(false);
    const [hasPool, setHasPool] = useState(false);

    const network: libNet.DexProtocolv2 | undefined = useDexConfig(nw);

    const copyAddress = (): void => {
        navigator.clipboard.writeText(token.address).then(() => {
            Uik.notify.info('Copied token address to clipboard');
        }, () => {
            Uik.notify.danger('Cannot copy to clipboard');
        });
    };

    const showBalance = (
        {
            decimals, balance, name, symbol,
        },
        decimalPoints = 4,
    ): string => {
        if (!balance) {
            return '';
        }
        const balanceStr = balance.toString();
        if (balanceStr === '0') {
            return `${balanceStr} ${symbol || name}`;
        }
        const headLength = Math.max(balanceStr.length - decimals, 0);
        const tailLength = Math.max(headLength + decimalPoints, 0);
        const head = balanceStr.length < decimals ? '0' : balanceStr.slice(0, headLength);
        let tail = balanceStr.slice(headLength, tailLength);
        if (tail.search(/[^0]+/gm) === -1) {
            tail = '';
        }
        return tail.length
            ? `${head}.${tail} ${symbol || name}`
            : `${head} ${symbol || name}`;
    };

    const displayBalanceFromToken = (token: Token): string => {
        const balance = new BigNumber(showBalance(token).replace(token.name, '').replace(token.symbol, '')).toString();
        return displayBalance(balance);
    }

    const formatHumanAmount = (value = ''): string => {
        let amount = new BigNumber((value as any).replaceAll(',', ''));
        let output = '';

        if (amount.isNaN()) return amount.toString();

        const decPlaces = 100;
        const abbrev = ['k', 'M', 'B'];

        for (let i = abbrev.length - 1; i >= 0; i -= 1) {
            // eslint-disable-next-line
            const size = Math.pow(10, (i + 1) * 3);

            if (amount.isGreaterThanOrEqualTo(size)) {
                amount = amount.times(decPlaces).dividedBy(size).integerValue().dividedBy(decPlaces);

                if (amount.isEqualTo(1000) && (i < abbrev.length - 1)) {
                    amount = BigNumber(1);
                    i += 1;
                }

                output = `${amount.toString()} ${abbrev[i]}`;
                break;
            }
        }

        return output;
    };

    const balanceValue = new BigNumber(token.balance.toString())
        .div(new BigNumber(10).pow(token.decimals))
        .multipliedBy(price)
        .toNumber();

    const displayBalance = (value: string | number): string => {
        // eslint-disable-next-line
        const balance = new BigNumber(value);

        if (balance.isNaN()) return '0';

        if (balance.isGreaterThanOrEqualTo(1000000)) {
            const humanReadableBalance = formatHumanAmount(balance.toString());
            return humanReadableBalance;
        }

        return balance.toString();
    };

    const balance = useMemo(() => {
        if (Number.isNaN(balanceValue)) {
            return 'N/A';
        }

        if (balanceValue >= 1000000) {
            return `$${displayBalance(balanceValue)}`;
        }

        return toCurrencyFormat(balanceValue);
    }, [balanceValue]);

    return (
        <div className={`
      token-card
      ${className || ''}
    `}
        >
            <div>
                <div className={`token-card__wrapper ${isDarkMode ? 'token-card__wrapper-dark' : ''}`}>
                    <div className='token-card__wrapper-upper-child'>
                        <div className="token-card__main">
                            <Uik.Tooltip
                                text="Copy token address"
                                delay={0}
                            >
                                <button
                                    className="token-card__image"
                                    style={{ backgroundImage: `url(${token.iconUrl})` }}
                                    type="button"
                                    aria-label="Token Image"
                                    onClick={copyAddress}
                                />
                            </Uik.Tooltip>
                            <div className="token-card__info">
                                <div className="token-card__token-info">
                                    <span className={`token-card__token-name ${isDarkMode ? 'token-card__token-name-dark' : ''}`}>{token.name}</span>
                                </div>
                                <button
                                    className={`token-card__token-price ${isDarkMode ? 'token-card__token-price-dark' : ''}`}
                                    disabled={!onClickPrice}
                                    onClick={onClickPrice}
                                    type="button"
                                >
                                    {
                                        isLoading ? <>Loading</> :
                                            !!price && !Number.isNaN(+price)
                                                ? (
                                                    <>
                                                        $
                                                        {Uik.utils.formatAmount(Uik.utils.maxDecimals(price, 4)).length ? Uik.utils.formatAmount(Uik.utils.maxDecimals(price, 4)) : Uik.utils.formatAmount(price.toFixed(20))}
                                                    </>
                                                )
                                                : 'N/A'
                                    }
                                </button>
                            </div>
                        </div>
                        <div className="token-card__aside">
                            <div className="token-card__values">
                                <button
                                    type="button"
                                    className={`
                token-card__value
                ${hideBalance.isHidden ? 'token-card__value--hidden' : ''}
              `}
                                    onClick={() => {
                                        if (hideBalance.isHidden) hideBalance.toggle();
                                    }}
                                >
                                    {
                                        !hideBalance.isHidden
                                            ? balance
                                            : (
                                                <>
                                                    <div />
                                                    <div />
                                                    <div />
                                                    <div />
                                                    <div />
                                                </>
                                            )
                                    }
                                </button>
                                <button
                                    type="button"
                                    className={`
                token-card__amount
                ${isDarkMode ? 'token-card__amount-dark' : ''}
                ${hideBalance.isHidden ? 'token-card__amount--hidden' : ''}
              `}
                                    onClick={() => {
                                        if (hideBalance.isHidden) hideBalance.toggle();
                                    }}
                                >
                                    {
                                        !hideBalance.isHidden
                                            ? !isLoading ? `${displayBalanceFromToken(token)} ${token.symbol}` : <>
                                                <div />
                                                <div />
                                                <div />
                                                <div /></>
                                            : (
                                                <>
                                                    <div />
                                                    <div />
                                                    <div />
                                                    <div />
                                                </>
                                            )
                                    }
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="token-card__btn-group w-full flex">
                        {isReefswapUI && (
                            <Uik.Button
                                text={"Swap"}
                                icon={faRepeat}
                                onClick={() => setSwapOpen(true)}
                                size="small"
                                disabled={!hasPool}
                                className="flex-1"
                            />
                        )}

                        <Uik.Button
                            text={"Send"}
                            icon={faPaperPlane}
                            onClick={() => setSendOpen(true)}
                            size="small"
                            fill
                            className="flex-1"
                        />
                    </div>
                </div>


            </div>

            <OverlaySwap
                tokenAddress={token.address}
                isOpen={isSwapOpen}
                onClose={() => setSwapOpen(false)}
                onPoolsLoaded={setHasPool}
                signer={signer as any}
                tokens={tokens}
                nw={nw}
                tokenPrices={tokenPrices}
                isDarkMode={isDarkMode}
                pools={pools}
                network={network}
                notify={notify}
            />

            <OverlaySend
                tokenAddress={token.address}
                isOpen={isSendOpen}
                onClose={() => setSendOpen(false)}
                tokens={tokens}
                selectedSigner={selectedSigner as any}
                provider={provider}
                accounts={accounts as any}
                isDarkMode={isDarkMode}
                notify={notify}
                isWalletConnect={isWalletConnect}
                handleWalletConnectModal={handleWalletConnectModal}
            />
        </div>
    );
};

