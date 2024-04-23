import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import CopyToClipboard from "react-copy-to-clipboard";
import { utils } from "ethers";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Provider } from "@reef-chain/evm-provider";

import { AccountsContext, ActionContext } from "../contexts";
import Account from "../Accounts/Account";
import { toAddressShortDisplay, toReefAmount } from "../util/util";
import { AccountWithSigner, TxStatusUpdate } from "../types";
import { sendToNativeAddress } from "../util/transactionUtil";
import { bindEvmAddress } from "../util/bindUtil";
import AccountSelector from "../Accounts/AccountSelector";
import { SectionTitle } from "../components/SectionTitle";
import { Loading } from "../components/Loading";
import { ErrorMessage } from "../components/ErrorMessage";
import Uik from "@reef-chain/ui-kit";

const MIN_BALANCE = BigInt(utils.parseEther("5").toString());

enum EvmBindComponentTxType {
  TRANSFER = "TRANSFER",
  BIND = "BIND",
}

interface Props {
  provider?: Provider;
}

const getSignersWithEnoughBalance = (
  signers: AccountWithSigner[],
  bindFor: AccountWithSigner
): AccountWithSigner[] => {
  return signers?.length
    ? signers
      .filter(
        (sig) =>
          sig.address !== bindFor.address &&
          sig.balance > MIN_BALANCE * BigInt(2)
      )
      .sort((a, b) => (a.balance > b.balance ? -1 : 1))
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

    const txIdent = sendToNativeAddress(
      provider,
      transferBalanceFrom,
      MIN_BALANCE,
      bindFor.address,
      (val: TxStatusUpdate) => {
        if (val.error || val.isInBlock) {
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

  const bindAccount = async () => {
    if (!bindFor) return;

    const txIdent = bindEvmAddress(
      bindFor,
      provider as Provider,
      (val: TxStatusUpdate) => {
        if (val.error || val.isInBlock) {
          provider.api.query.evmAccounts
            .evmAddresses(bindFor.address)
            .then((claimedAddress) => {
              if (!claimedAddress.isEmpty) {
                setBindFor({
                  ...bindFor,
                  isEvmClaimed: true,
                });
              }
            });
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
  };

  return (
    <>
      <SectionTitle text="Connect EVM" />
      {bindFor ? (
        <div className="flex flex-col">
          {!bindFor.isEvmClaimed && (
            <>
              <Uik.Text type="light" className="mb-2" text="Start using Reef EVM smart contracts." />
              <Uik.Text type="light" text="First connect EVM address for" />
              <Account account={{ ...bindFor }} />
            </>
          )}
          {bindFor.isEvmClaimed && (
            <>
              <Account account={{ ...bindFor }} />
              <span className="mb-2">
                Successfully connected to EVM address
                <br />
                <b>{toAddressShortDisplay(bindFor.evmAddress, 18)}</b>
                <CopyToClipboard
                  text={bindFor.evmAddress}
                  className="inline-block hover:cursor-pointer"
                >
                  <span title={bindFor.evmAddress}>
                    <FontAwesomeIcon
                      className="ml-2"
                      icon={faCopy as IconProp}
                      size="sm"
                      title="Copy EVM Address"
                    />
                  </span>
                </CopyToClipboard>
              </span>
              <Uik.Button onClick={() => onAction("/")} text="Continue" />
            </>
          )}
          {!bindFor.isEvmClaimed && (
            <>
              {txStatus && (
                <>
                  {/* In progress */}
                  {!txStatus.error &&
                    !txStatus.isInBlock &&
                    !txStatus.isComplete && (
                      <Loading
                        text={
                          txStatus.componentTxType ===
                            EvmBindComponentTxType.BIND
                            ? `Connecting EVM address in progress`
                            : `Transfer in progress`
                        }
                      />
                    )}
                  {/* Bound */}
                  {!txStatus.error &&
                    txStatus.isInBlock &&
                    txStatus.componentTxType ===
                    EvmBindComponentTxType.BIND && (
                      <span>
                        Connected EVM address is <b>{bindFor.evmAddress}</b>
                      </span>
                    )}
                  {/* Error message */}
                  {txStatus.error && (
                    <ErrorMessage text={txStatus.error.message} />
                  )}
                </>
              )}

              {/* Not enough balance */}
              {!txStatus && !hasBalanceForBinding(bindFor.balance) && (
                <>
                  {!txStatus && !transferBalanceFrom && (
                    <Uik.Text type="light" text="Not enough REEF in account for connect EVM address transaction fee." />
                  )}
                  {!txStatus && !!transferBalanceFrom && (
                    <>
                      <div>
                        <span className="font-bold">
                          ~{toReefAmount(MIN_BALANCE)} REEF{" "}
                        </span>
                        <Uik.Text type="light" text="is needed for transaction fee." />
                      </div>
                      <div className="mt-2">
                        <Uik.Text type="light" text="Coins will be transferred from account:" />

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
                      <Uik.Button onClick={transfer} text="Continue" />
                    </>
                  )}
                </>
              )}

              {/* Start binding */}
              {((!txStatus && hasBalanceForBinding(bindFor.balance)) ||
                (txStatus &&
                  !txStatus.error &&
                  txStatus.isInBlock &&
                  txStatus.componentTxType ===
                  EvmBindComponentTxType.TRANSFER)) && (
                  <>
                    {txStatus && (
                      <Uik.Text type="light" text="Transfer complete. Now run connect EVM account
                      transaction."/>
                    )}
                    <Uik.Button onClick={() => bindAccount()} text="Continue" />
                  </>
                )}
            </>
          )}
        </div>
      ) : (
        <Loading text="Loading..." />
      )}
    </>
  );
};
