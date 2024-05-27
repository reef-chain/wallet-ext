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
import strings from "../../i18n/locales";
import { useTheme } from "../context/ThemeContext";

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
  const { isDarkMode } = useTheme();
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
      className={`account ${isDarkMode ? "account--dark" : "account--light"} w-full ${isSelected && showOptions ? "border-pink-600 border-2 selected-account" : ""
        } ${onClick ? "hover:cursor-pointer" : ""}`}
    >
      <div className={`avatar`} >
        <Identicon value={account.address} className={`avatar-image ${isDarkMode ? "dark-avatar" : ""}`} size={48} theme="substrate" />
      </div>
      <div className="content">
        <div className="font-bold">
          {isEditingName ? (
            <Uik.Input
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
              <Uik.Text text={account.name} type="title" className={`ml-5 ${isDarkMode ? "text--dark-mode" : ""}`} />
            </div>
          )}
        </div>
        {account.address && provider && balance !== undefined && (
          <div className="flex ml-5 mt-1 mb-1">
            <Uik.ReefAmount value={toReefAmount(balance)} />
          </div>
        )}
        <div className="flex justify-start align-middle">
          <div>
            <div onClick={() => Uik.notify.success(`Copied ${account.address} successfully!`)}>
              {showCopyAddress ? (
                <CopyToClipboard
                  text={account.address}
                  className="hover:cursor-pointer flex items-center"
                >
                  <div title={account.address}>
                    <Uik.Text text={strings.native_addr + toAddressShortDisplay(account.address)} type="mini" className={`ml-5 mr-3 ${isDarkMode ? "text--dark-mode" : ""}`} />
                    <FontAwesomeIcon
                      className={`${isDarkMode ? "text--dark-mode" : "text-[#8f8f8f]"} ml-2`}
                      icon={faCopy as IconProp}
                      size="sm"
                      title={strings.copy_reef_acc_addr}
                    />
                  </div>
                </CopyToClipboard>
              ) : (
                <div title={account.address}>
                  <label>{strings.native_addr}</label>
                  {toAddressShortDisplay(account.address)}
                </div>
              )}
            </div>
            <div onClick={() => Uik.notify.success(`Copied ${evmAddress ? evmAddress + " (ONLY for Reef chain!)" : ""} successfully!`)}>
              {isEvmClaimed && (
                <div>
                  {showCopyAddress ? (
                    <CopyToClipboard
                      text={evmAddress ? evmAddress + strings.only_for_reef : ""}
                      className="hover:cursor-pointer flex items-center"

                    >
                      <div title={evmAddress || ""}>
                        <Uik.Text text={strings.evm_addr + (evmAddress
                          ? toAddressShortDisplay(evmAddress)
                          : strings.loading)} type="mini" className={`ml-5 mr-3 ${isDarkMode ? "text--dark-mode" : ""}`} />
                        <FontAwesomeIcon
                          className={`${isDarkMode ? "text--dark-mode" : "text-[#8f8f8f]"} ml-2`}
                          icon={faCopy as IconProp}
                          size="sm"
                          title={strings.copy_evm_addr}
                        />
                      </div>
                    </CopyToClipboard>
                  ) : (
                    <div title={evmAddress || ""}>
                      <label>{strings.evm_addr}</label>
                      {evmAddress ? toAddressShortDisplay(evmAddress) : "loading..."}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex ">
        {!isSelected && <Uik.Button className="dark-theme mr-2" onClick={() => {
          if (!isSelected) {
            selectAccount(account.address)
            onClick && onClick(account)
          }
        }} text={strings.select} />}
        {showOptions && isEvmClaimed !== undefined && !isEvmClaimed && (
          <Uik.Button text={strings.bind} onClick={() => onAction(`/bind/${account.address}`)} fill />
        )}

      </div>
      {
        showOptions && (
          <div className="relative">
            <div className="ellipsis-wrapper">
              <FontAwesomeIcon
                className="hover:cursor-pointer p-2 text-xl"
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                icon={faEllipsisVertical as IconProp}
                title={strings.acc_options}
              />
            </div>

            <Uik.Dropdown
              isOpen={isOptionsOpen}
              position="bottomLeft"
              onClose={() => setIsOptionsOpen(false)}
              className="relative right-20 bottom-2"
            >
              <Uik.DropdownItem
                className="mb-1 hover:cursor-pointer hover:text-primary"
                text="Rename"
                onClick={() => {
                  setIsEditingName(true);
                  setIsOptionsOpen(false);
                }}
              />
              <Uik.DropdownItem
                text={strings.derive_new_acc}
                className="mb-1 hover:cursor-pointer hover:text-primary"
                onClick={() => {
                  onAction(`/account/derive/${account.address}/locked`);
                }}
              />
              <Uik.DropdownItem
                text={strings.export_acc}
                className="mb-1 hover:cursor-pointer hover:text-primary"
                onClick={() => {
                  onAction(`/account/export/${account.address}`);
                }}
              />
              <Uik.DropdownItem
                text={strings.forget_account}
                className="hover:cursor-pointer hover:text-primary"
                onClick={() => {
                  onAction(`/account/forget/${account.address}`);
                }}
              />

            </Uik.Dropdown>

          </div >
        )
      }
    </div >
  );
};

export default Account;
