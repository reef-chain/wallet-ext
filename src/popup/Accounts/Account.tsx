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
import { editAccount, forgetAccount, selectAccount } from "../messaging";
import { ActionContext } from "../contexts";

interface Props {
  account: extLib.AccountJson;
  provider?: Provider;
  isSelected?: boolean;
}

const Account = ({ account, provider, isSelected }: Props): JSX.Element => {
  const onAction = useContext(ActionContext);
  const [name, setName] = useState<string>(account.name);
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
    } else {
      setEvmAddress(undefined);
      setIsEvmClaimed(undefined);
      setBalance(undefined);
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

  let unsubBalance = () => {};

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
      className={`account w-full ${isSelected ? "border-white border-2" : ""}`}
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
            account.name
          )}
          {provider && !isSelected && (
            <button
              className="sm inline-block m-0 ml-2"
              onClick={() => selectAccount(account.address)}
            >
              Select
            </button>
          )}
        </div>
        {provider && (
          <div>
            <img src="/icons/icon.png" className="reef-amount-logo"></img>
            {balance !== undefined ? toReefAmount(balance) : "loading..."}
          </div>
        )}
        <CopyToClipboard
          text={account.address}
          className="hover:cursor-pointer"
        >
          <div title={account.address}>
            <label>Native address: </label>
            {toAddressShortDisplay(account.address)}
            <FontAwesomeIcon
              className="ml-2"
              icon={faCopy as IconProp}
              size="sm"
              title="Copy Reef Account Address"
            />
          </div>
        </CopyToClipboard>
        {provider && (
          <CopyToClipboard
            text={evmAddress ? evmAddress + " (ONLY for Reef chain!)" : ""}
            className="inline-block hover:cursor-pointer"
          >
            <div title={evmAddress || ""}>
              <label>EVM address: </label>
              {evmAddress ? toAddressShortDisplay(evmAddress) : "loading..."}
              <FontAwesomeIcon
                className="ml-2"
                icon={faCopy as IconProp}
                size="sm"
                title="Copy EVM Address"
              />
            </div>
          </CopyToClipboard>
        )}
        {isEvmClaimed !== undefined && !isEvmClaimed && (
          <button
            className="sm m-0"
            onClick={() => onAction(`/bind/${account.address}`)}
          >
            Connect EVM
          </button>
        )}
      </div>
      {provider && (
        <div className="relative">
          <FontAwesomeIcon
            className="hover:cursor-pointer p-2"
            onClick={() => setIsOptionsOpen(!isOptionsOpen)}
            icon={faEllipsisVertical as IconProp}
            title="Account options"
          />
          {isOptionsOpen && (
            <div className="absolute right-0 p-2 bg-white text-secondary font-bold text-left rounded-lg">
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
                  onAction(`/account/derive/${account.address}`);
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
              {/* TODO: Confirmation popup */}
              <div
                className="hover:cursor-pointer hover:text-primary"
                onClick={() => {
                  forgetAccount(account.address);
                  setIsOptionsOpen(false);
                }}
              >
                Forget account
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Account;
