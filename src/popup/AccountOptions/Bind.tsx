import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { utils } from "ethers";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Provider } from "@reef-chain/evm-provider";

import { AccountsContext, ActionContext } from "../contexts";
import Account from "../Accounts/Account";
import { toAddressShortDisplay, toReefAmount } from "../util/util";
import { AccountWithSigner, TxStatusUpdate } from "../types";
import { sendToNativeAddress } from "../util/transactionUtil";
import {
  bindCustomEvmAddress,
  bindEvmAddress,
  signBindEvmAddress,
} from "../util/bindUtil";
import AccountSelector from "../Accounts/AccountSelector";

const MIN_BALANCE = BigInt(utils.parseEther("5").toString());

enum EvmBindComponentTxType {
  TRANSFER = "TRANSFER",
  BIND = "BIND",
}

interface CustomBindState {
  useCustomEvmAddress: boolean;
  signingInProcess?: boolean;
  evmAddress?: string;
  signature?: string;
  error?: string;
}

interface Props {
  provider?: Provider;
}

const getSignersWithEnoughBalance = (
  signers: AccountWithSigner[],
  bindFor: AccountWithSigner
): AccountWithSigner[] => {
  return signers?.length
    ? signers.filter(
        (sig) => sig.address !== bindFor.address
        // && sig.balance > MIN_BALANCE * BigInt(2) TODO: UNCOMMENT
      )
    : [];
};

export const Bind = ({ provider }: Props): JSX.Element => {
  const { address: bindAddress } = useParams();
  const { accountsWithSigners } = useContext(AccountsContext);
  const onAction = useContext(ActionContext);

  const [bindFor, setBindFor] = useState<AccountWithSigner>();
  const [availableTxAccounts, setAvailableTxAccounts] = useState<
    AccountWithSigner[]
  >([]);
  const [transferBalanceFrom, setTransferBalanceFrom] =
    useState<AccountWithSigner>();
  const [txStatus, setTxStatus] = useState<TxStatusUpdate | undefined>();
  const [customBindState, setCustomBindState] = useState<CustomBindState>({
    useCustomEvmAddress: false,
  });

  useEffect(() => {
    if (!accountsWithSigners.length || !bindAddress || !provider) return;

    const bindFor = accountsWithSigners?.find(
      (acc) => acc.address === bindAddress
    );
    if (!bindFor) return;

    setBindFor(bindFor);
    provider.api.query.system.account(bindFor.address, ({ data: balance }) => {
      setBindFor({ ...bindFor, balance: BigInt(balance.free.toString()) });
    });

    const fromSigners = getSignersWithEnoughBalance(
      accountsWithSigners,
      bindFor
    );
    setAvailableTxAccounts(fromSigners);
    setTransferBalanceFrom(fromSigners.length ? fromSigners[0] : undefined);
  }, [accountsWithSigners, bindAddress, provider]);

  const hasBalanceForBinding = (balance: bigint): boolean =>
    balance >= MIN_BALANCE;

  const transfer = async (): Promise<void> => {
    if (!provider) {
      return;
    }

    setCustomBindState({ ...customBindState, error: undefined });

    const txIdent = sendToNativeAddress(
      provider,
      transferBalanceFrom,
      MIN_BALANCE,
      bindFor.address,
      (val: TxStatusUpdate) => {
        if (val.error || val.isInBlock) {
          console.log("transfer tx status", val);
          setTxStatus({
            ...val,
            componentTxType: EvmBindComponentTxType.TRANSFER,
            addresses: [transferBalanceFrom.address, bindFor.address],
          });
        }
      }
    );

    setTxStatus({
      txIdent,
      componentTxType: EvmBindComponentTxType.TRANSFER,
      addresses: [transferBalanceFrom.address, bindFor.address],
    });
  };

  const signEvmMessage = (): void => {
    setCustomBindState({ useCustomEvmAddress: true, signingInProcess: true });
    signBindEvmAddress(bindFor)
      .then((res) => {
        if (res.error) {
          setCustomBindState({
            useCustomEvmAddress: true,
            signingInProcess: false,
            error: res.error,
          });
        } else {
          setCustomBindState({
            useCustomEvmAddress: true,
            signingInProcess: false,
            evmAddress: res.evmAddress,
            signature: res.signature,
          });
        }
      })
      .catch((e) => {
        console.error(e);
        setCustomBindState({
          useCustomEvmAddress: true,
          signingInProcess: false,
          error: "Failed to sign message.",
        });
      });
  };

  const bindAccount = async () => {
    if (!bindFor) return;
    setCustomBindState({ ...customBindState, error: undefined });

    if (customBindState.useCustomEvmAddress) {
      const txIdent = bindCustomEvmAddress(
        bindFor,
        provider as Provider,
        customBindState.evmAddress!,
        customBindState.signature!,
        (val: TxStatusUpdate) => {
          if (val.error || val.isInBlock) {
            setTxStatus({
              ...val,
              componentTxType: EvmBindComponentTxType.BIND,
              addresses: [bindFor.address],
            });
          }
        }
      );

      if (txIdent) {
        setTxStatus({
          txIdent,
          componentTxType: EvmBindComponentTxType.BIND,
          addresses: [bindFor.address],
        });
      }
    } else {
      const txIdent = bindEvmAddress(
        bindFor,
        provider as Provider,
        (val: TxStatusUpdate) => {
          if (val.error || val.isInBlock) {
            setTxStatus({
              ...val,
              componentTxType: EvmBindComponentTxType.BIND,
              addresses: [bindFor.address],
            });
          }
        }
      );

      if (txIdent) {
        setTxStatus({
          txIdent,
          componentTxType: EvmBindComponentTxType.BIND,
          addresses: [bindFor.address],
        });
      }
    }
  };

  return (
    <>
      <div className="mb-2 text-center text-lg font-bold">Connect EVM</div>
      {bindFor ? (
        <div className="flex flex-col align-top">
          {!bindFor.isEvmClaimed && (
            <>
              <div className="mb-2">Start using Reef EVM smart contracts.</div>
              <div>First connect EVM address for</div>
              <Account account={{ ...bindFor }} />
            </>
          )}
          {/* TODO: */}
          {bindFor.isEvmClaimed && (
            <>
              <Account account={{ ...bindFor }} />
              <p>
                {" "}
                Successfully connected to EVM address&nbsp;
                <b>{toAddressShortDisplay(bindFor.evmAddress)}</b>
                .
                <br />
              </p>

              <button
                className="sm m-0"
                onClick={() => alert("Copy EVM address")}
              >
                Copy EVM address
              </button>

              <button className="sm m-0" onClick={() => onAction("/")}>
                Continue
              </button>
            </>
          )}
          {!bindFor.isEvmClaimed && (
            <>
              {txStatus && (
                <>
                  {/* In progress */}
                  {/* TODO: */}
                  {!txStatus.error &&
                    !txStatus.isInBlock &&
                    !txStatus.isComplete && (
                      <>
                        <span>Loading...</span>
                        <span>Tx status: {txStatus.txIdent}</span>
                        <span>
                          {txStatus.componentTxType ===
                          EvmBindComponentTxType.BIND
                            ? "Connecting EVM address"
                            : "Transfer"}{" "}
                          in progress
                        </span>
                      </>
                    )}
                  {/* TODO: */}
                  {customBindState.signingInProcess && (
                    <>
                      <span>Loading...</span>
                      <span>Signing message with EVM wallet in progress</span>
                    </>
                  )}
                  {/* Bound */}
                  {/* TODO: */}
                  {!txStatus.error &&
                    txStatus.isInBlock &&
                    txStatus.componentTxType ===
                      EvmBindComponentTxType.BIND && (
                      <span>
                        Connected Ethereum VM address is{" "}
                        {customBindState.useCustomEvmAddress &&
                        customBindState.evmAddress
                          ? customBindState.evmAddress
                          : bindFor.evmAddress}
                      </span>
                    )}
                  {/* Error message */}
                  {/* TODO: */}
                  {txStatus.error && <p>{txStatus.error.message}</p>}
                  {customBindState.error && <p>{customBindState.error}</p>}
                </>
              )}

              {/* Not enough balance */}
              {!txStatus && !hasBalanceForBinding(bindFor.balance) && (
                <>
                  {!txStatus && !transferBalanceFrom && (
                    <div>
                      Not enough REEF in account for connect EVM address
                      transaction fee.
                    </div>
                  )}
                  {!txStatus && !!transferBalanceFrom && (
                    <>
                      <div>
                        <span className="font-bold">
                          ~{toReefAmount(MIN_BALANCE)} REEF{" "}
                        </span>
                        <span>is needed for transaction fee.</span>
                      </div>
                      <div className="mt-2">
                        Coins will be transferred from account:
                      </div>
                      <AccountSelector
                        accounts={availableTxAccounts.map((acc) => ({
                          ...acc,
                        }))}
                        initialSelection={{ ...transferBalanceFrom }}
                        onAccountSelect={(account) =>
                          setTransferBalanceFrom(
                            availableTxAccounts.find(
                              (acc) => acc.address === account.address
                            )
                          )
                        }
                        small={true}
                      />
                      <button onClick={transfer}>Continue</button>
                    </>
                  )}
                </>
              )}

              {/* Start binding */}
              {!customBindState.signingInProcess &&
                ((!txStatus && hasBalanceForBinding(bindFor.balance)) ||
                  (txStatus &&
                    !txStatus.error &&
                    txStatus.isInBlock &&
                    txStatus.componentTxType ===
                      EvmBindComponentTxType.TRANSFER)) && (
                  <>
                    {/* TODO: */}
                    {!customBindState.signature && txStatus && (
                      <span>
                        Transfer complete. Now run connect EVM account
                        transaction.
                      </span>
                    )}
                    {/* TODO: */}
                    {customBindState.signature &&
                      customBindState.evmAddress && (
                        <span>
                          Message signed for
                          {customBindState.evmAddress} address. Now run connect
                          EVM account transaction.
                        </span>
                      )}
                    {/* TODO: */}
                    {!customBindState.signature && (
                      <span>
                        {/* <Uik.Toggle
                          value={customBindState.useCustomEvmAddress}
                          onChange={() =>
                            setCustomBindState({
                              useCustomEvmAddress:
                                !customBindState.useCustomEvmAddress,
                            })
                          }
                        /> */}
                        <div className="prompt">
                          <span>Use custom EVM address</span>
                          <div>
                            <span data-tip data-for="custom-evm-select">
                              <FontAwesomeIcon
                                icon={faQuestionCircle as IconProp}
                              />
                            </span>
                            {/* <ReactTooltip
                              id="custom-evm-select"
                              place="top"
                              effect="solid"
                              backgroundColor="#46288b"
                            >
                              By default, your Reef account will be bound to a
                              predetermined EVM address. You should use this EVM
                              address <b>only in the Reef network</b>
                              .
                              <br />
                              Enabling this option you will bind your Reef
                              account to an EVM address you own by signing a
                              message with an EVM wallet.
                            </ReactTooltip> */}
                          </div>
                        </div>
                      </span>
                    )}

                    <button
                      onClick={() =>
                        customBindState.useCustomEvmAddress &&
                        !customBindState.signature
                          ? signEvmMessage()
                          : bindAccount()
                      }
                    >
                      Continue
                    </button>
                  </>
                )}
            </>
          )}
        </div>
      ) : (
        <div>Loading ...</div>
      )}
    </>
  );
};
