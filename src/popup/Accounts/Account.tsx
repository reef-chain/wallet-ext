import React, { useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCopy, faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import { getAddress } from "@ethersproject/address";
import { Provider, Signer } from "@reef-chain/evm-provider";
import Identicon from "@polkadot/react-identicon";

import {
  computeDefaultEvmAddress,
  toAddressShortDisplay,
  toReefAmount,
} from "../util";
import { AccountJson } from "../../extension-base/background/types";
import {
  editAccount,
  forgetAccount,
  selectAccount,
  sendMessage,
} from "../messaging";
import SigningKey from "../../extension-base/page/Signer";

interface Props {
  account: AccountJson;
  provider?: Provider;
  isSelected?: boolean;
  className?: string;
}

const Account = ({
  account,
  provider,
  isSelected,
  className,
}: Props): JSX.Element => {
  const [name, setName] = useState<string>(account.name);
  const [balance, setBalance] = useState<BigInt>();
  const [evmAddress, setEvmAddress] = useState<string>();
  const [isEvmClaimed, setIsEvmClaimed] = useState<boolean>();
  const [signer, setSigner] = useState<Signer>();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    unsubBalance();
    if (account.address && provider) {
      const _signer = new Signer(
        provider,
        account.address,
        new SigningKey(sendMessage)
      );
      setSigner(_signer);
      queryEvmAddress(account.address, provider);
      subscribeToBalance(account.address, provider);
    } else {
      setSigner(undefined);
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

  const bindDefaultEvmAddress = async () => {
    signer
      .claimDefaultAccount()
      .then((response) => {
        console.log("evm bind response", response);
      })
      .catch((error) => {
        console.log("evm bind error", error);
        alert("Failed to bind EVM address");
      });
  };

  return (
    <div
      className={`account ${
        isSelected ? "border-white border-2" : ""
      } ${className}`}
    >
      <div className="avatar">
        {account.icon ? (
          <img src={account.icon as string} className="avatar-image"></img>
        ) : (
          <Identicon value={account.address} size={44} theme="substrate" />
        )}
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
              className="sm"
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
          <button className="sm m-0" onClick={bindDefaultEvmAddress}>
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
