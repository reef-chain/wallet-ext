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
import strings from "../../i18n/locales";
import { useTheme } from "../context/ThemeContext";
import LightText from "../../common/LightText";

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

  const { isDarkMode } = useTheme();

  return (
    <>
      <SectionTitle text={strings.connect_evm} />
      {bindFor ? (
        <div className="flex flex-col">
          {!bindFor.isEvmClaimed && (
            <>

              <LightText text="Start using Reef EVM smart contracts." className="mb-1" />
              <LightText text={strings.first_connect_evm_addr} />
              <Account account={{ ...bindFor }} className="account-box-padding" showCopyAddress={true} />
            </>
          )}
          {bindFor.isEvmClaimed && (
            <>
              <Account account={{ ...bindFor }} className="account-box-padding" showCopyAddress={true} />
              <span className="mb-2">
                {strings.successfully_connected_evm}
                <br />
                <b>{toAddressShortDisplay(bindFor.evmAddress, 18)}</b>
                <CopyToClipboard
                  text={bindFor.evmAddress}
                  className="inline-block hover:cursor-pointer"
                >
                  <span title={bindFor.evmAddress}>
                    <FontAwesomeIcon
                      className={isDarkMode ? "text--dark-mode ml-2" : "text-[#8f8f8f] ml-2"}
                      icon={faCopy as IconProp}
                      size="sm"
                      title={strings.copy_evm_addr}
                    />
                  </span>
                </CopyToClipboard>
              </span>
              <div className="absolute right-4 bottom-10">
                <Uik.Button onClick={() => onAction("/")} text={strings.continue} />
              </div>
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
                            ? strings.connecting_evm_in_progress
                            : strings.tx_in_progress
                        }
                      />
                    )}
                  {/* Bound */}
                  {!txStatus.error &&
                    txStatus.isInBlock &&
                    txStatus.componentTxType ===
                    EvmBindComponentTxType.BIND && (
                      <span>
                        {strings.connected_evm_addr_is}<b>{bindFor.evmAddress}</b>
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

                    <Uik.Text type="light" text={strings.not_enough_reef} className={`${isDarkMode ? "text--dark-mode" : ""}`} />
                  )}
                  {!txStatus && !!transferBalanceFrom && (
                    <>
                      <div>

                        <Uik.Text type="light" text={`~${toReefAmount(MIN_BALANCE)} REEF ` + strings.is_needed_for_tx} className={`${isDarkMode ? "text--dark-mode" : ""}`} />
                      </div>
                      <div className="mt-2">
                        <Uik.Text type="light" text={strings.coins_will_be_tx_from_acc} className={`${isDarkMode ? "text--dark-mode" : ""}`} />

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
                      <div className="absolute right-4 bottom-10">
                        <Uik.Button onClick={transfer} text={strings.continue} />
                      </div>
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
                      <Uik.Text type="light" text={strings.tx_complete} className={`${isDarkMode ? "text--dark-mode" : ""}`} />
                    )}
                    <div className="absolute right-4 bottom-10">
                      <Uik.Button onClick={() => bindAccount()} text={strings.continue} />
                    </div>
                  </>
                )}
            </>
          )}
        </div>
      ) : (
        <Loading text={strings.loading} />
      )}
    </>
  );
};
