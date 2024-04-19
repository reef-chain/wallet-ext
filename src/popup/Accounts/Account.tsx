import React, { useContext, useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCopy, faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import { getAddress } from "@ethersproject/address";
import { Provider } from "@reef-chain/evm-provider";
import { extension as extLib } from "@reef-chain/util-lib";
import Identicon from "@polkadot/react-identicon";

import {
  computeDefaultEvmAddress,
  toAddressShortDisplay,
  toReefAmount,
} from "../util/util";
import { editAccount, selectAccount } from "../messaging";
import { ActionContext, ProviderContext } from "../contexts";
import Uik from "@reef-chain/ui-kit";

interface Props {
  account: extLib.AccountJson;
  isSelected?: boolean;
  showOptions?: boolean;
  showCopyAddress?: boolean;
  onClick?: (account: extLib.AccountJson) => void;
}

const Account = ({
  account,
  isSelected,
  showOptions,
  showCopyAddress,
  onClick,
}: Props): JSX.Element => {
  const onAction = useContext(ActionContext);
  const provider = useContext(ProviderContext);
  const [name, setName] = useState<string>();
  const [balance, setBalance] = useState<BigInt>();
  const [evmAddress, setEvmAddress] = useState<string>();
  const [isEvmClaimed, setIsEvmClaimed] = useState<boolean>();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    unsubBalance();
    if (account.address && provider) {
      queryEvmAddress(account.address, provider);
      subscribeToBalance(account.address, provider);
      setName(account.name);
    } else {
      setEvmAddress(undefined);
      setIsEvmClaimed(undefined);
      setBalance(undefined);
      setName(undefined);
    }
  }, [account, provider]);

  const queryEvmAddress = async (address: string, provider: Provider) => {
    const claimedAddress = await provider.api.query.evmAccounts.evmAddresses(
      address
    );

    if (!claimedAddress.isEmpty) {
      const _evmAddress = getAddress(claimedAddress.toString());
      setEvmAddress(_evmAddress);
      setIsEvmClaimed(true);
    } else {
      setEvmAddress(computeDefaultEvmAddress(address));
      setIsEvmClaimed(false);
    }
  };

  let unsubBalance = () => { };

  const subscribeToBalance = async (address: string, provider: Provider) => {
    unsubBalance = await provider.api.query.system.account(
      address,
      ({ data: balance }) => {
        setBalance(BigInt(balance.free.toString()));
      }
    );
  };

  return (
    <div
      className={`account w-full ${isSelected && showOptions ? "border-pink-600 border-2" : ""
        } ${onClick ? "hover:cursor-pointer" : ""}`}
      onClick={() => {
        if (!isSelected) selectAccount(account.address)
        onClick && onClick(account)
      }}
    >
      <div className="avatar">
        <Identicon value={account.address} size={44} theme="substrate" />
      </div>
      <div className="content">
        <div className="font-bold">
          {isEditingName ? (
            <input
              className="text-primary rounded-md px-2 my-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                editAccount(account.address, name);
                setIsEditingName(false);
              }}
            />
          ) : (
            <div style={{
              color: 'white!important'
            }} >
              <Uik.Text text={account.name} type="title" />
            </div>
          )}
        </div>
        {account.address && provider && (
          <div>
            <img src="/icons/icon.png" className="reef-amount-logo"></img>
            {balance !== undefined ? toReefAmount(balance) : "loading..."}
          </div>
        )}
        <div className="flex justify-start align-middle">
          <div>
            {showCopyAddress ? (
              <CopyToClipboard
                text={account.address}
                className="hover:cursor-pointer flex items-center"
              >
                <div title={account.address}>
                  <Uik.Text text="Native address:" type="mini" />
                  {toAddressShortDisplay(account.address)}
                  <FontAwesomeIcon
                    className="ml-2"
                    icon={faCopy as IconProp}
                    size="sm"
                    title="Copy Reef Account Address"
                  />
                </div>
              </CopyToClipboard>
            ) : (
              <div title={account.address}>
                <label>Native address: </label>
                {toAddressShortDisplay(account.address)}
              </div>
            )}
            {isEvmClaimed && (
              <>
                {showCopyAddress ? (
                  <CopyToClipboard
                    text={evmAddress ? evmAddress + " (ONLY for Reef chain!)" : ""}
                    className="hover:cursor-pointer flex items-center"
                  >
                    <div title={evmAddress || ""}>
                      <Uik.Text text="EVM address:" type="mini" />
                      {evmAddress
                        ? toAddressShortDisplay(evmAddress)
                        : "loading..."}
                      <FontAwesomeIcon
                        className="ml-2"
                        icon={faCopy as IconProp}
                        size="sm"
                        title="Copy EVM Address"
                      />
                    </div>
                  </CopyToClipboard>
                ) : (
                  <div title={evmAddress || ""}>
                    <label>EVM address: </label>
                    {evmAddress ? toAddressShortDisplay(evmAddress) : "loading..."}
                  </div>
                )}
              </>
            )}
          </div>
          {showOptions && isEvmClaimed !== undefined && !isEvmClaimed && (
            <Uik.Button text="Bind EVM" onClick={() => onAction(`/bind/${account.address}`)} fill />
          )}
        </div>
      </div>
      {
        showOptions && (
          <div className="relative">
            <FontAwesomeIcon
              className="hover:cursor-pointer p-2"
              onClick={() => setIsOptionsOpen(!isOptionsOpen)}
              icon={faEllipsisVertical as IconProp}
              title="Account options"
            />
            {isOptionsOpen && (
              <div className="absolute right-5 -top-9 p-2 bg-gray-200 text-secondary font-bold text-left rounded-lg w-[148px]">
                <div
                  className="mb-1 hover:cursor-pointer hover:text-primary"
                  onClick={() => {
                    setIsEditingName(true);
                    setIsOptionsOpen(false);
                  }}
                >
                  Rename
                </div>
                <div
                  className="mb-1 hover:cursor-pointer hover:text-primary"
                  onClick={() => {
                    onAction(`/account/derive/${account.address}/locked`);
                  }}
                >
                  Derive new account
                </div>
                <div
                  className="mb-1 hover:cursor-pointer hover:text-primary"
                  onClick={() => {
                    onAction(`/account/export/${account.address}`);
                  }}
                >
                  Export account
                </div>
                <div
                  className="hover:cursor-pointer hover:text-primary"
                  onClick={() => {
                    onAction(`/account/forget/${account.address}`);
                  }}
                >
                  Forget account
                </div>
              </div>
            )}
          </div>
        )
      }
    </div >
  );
};

export default Account;
