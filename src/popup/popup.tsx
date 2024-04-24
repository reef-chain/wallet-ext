import React, { useMemo, useEffect, useState, useCallback } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Provider, Signer } from "@reef-chain/evm-provider";
import { extension as extLib } from "@reef-chain/util-lib";
import { WsProvider } from "@polkadot/api";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faArrowUpRightFromSquare,
  faExpand,
  faShuffle,
  faTasks,
  faGear,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";

import "./popup.css";
import {
  AuthorizeRequest,
  MetadataRequest,
  SigningRequest,
} from "../extension-base/background/types";
import SigningKey from "../extension-base/page/Signer";
import { PHISHING_PAGE_REDIRECT } from "../extension-base/defaults";
import { AvailableNetwork, ReefNetwork, reefNetworks } from "../config";
import {
  getDetachedWindowId,
  selectAccount,
  selectNetwork,
  sendMessage,
  setDetachedWindowId,
  subscribeAccounts,
  subscribeAuthorizeRequests,
  subscribeMetadataRequests,
  subscribeNetwork,
  subscribeSigningRequests,
} from "./messaging";
import {
  AccountsCtx,
  AccountsContext,
  ActionContext,
  ProviderContext,
} from "./contexts";
import { createPopupData } from "./util/util";
import { Signing } from "./Signing";
import { Metadata } from "./Metadata";
import { Authorize } from "./Authorize";
import { AuthManagement } from "./AuthManagement";
import { PhishingDetected } from "./PhishingDetected";
import { AccountMenu } from "./AccountOptions/AccountMenu";
import { CreateAccount } from "./AccountOptions/CreateAccount";
import Accounts from "./Accounts/Accounts";
import { ImportSeed } from "./AccountOptions/ImportSeed";
import { ExportAll } from "./AccountOptions/ExportAll";
import { RestoreJson } from "./AccountOptions/RestoreJson";
import { Bind } from "./AccountOptions/Bind";
import { AccountWithSigner } from "./types";
import { Export } from "./AccountOptions/Export";
import { Derive } from "./AccountOptions/Derive";
import { ImportLedger } from "./AccountOptions/ImportLedger";
import { Forget } from "./AccountOptions/Forget";
import Uik from "@reef-chain/ui-kit";

const accountToReefSigner = async (
  account: extLib.InjectedAccount,
  provider: Provider
): Promise<AccountWithSigner> => {
  const signer = new Signer(
    provider,
    account.address,
    new SigningKey(sendMessage)
  );
  const evmAddress = await signer.getAddress();
  const isEvmClaimed = await signer.isClaimed();
  const deriveBalances = await provider.api.derive.balances.all(
    account.address as any
  );

  return {
    signer,
    address: account.address,
    name: account.name || "",
    balance: BigInt(deriveBalances.freeBalance.toString()),
    evmAddress,
    isEvmClaimed,
  };
};

const Popup = () => {
  const [accountCtx, setAccountCtx] = useState<AccountsCtx>({
    accounts: [],
    selectedAccount: null,
    accountsWithSigners: [],
  });
  const [selectedAccount, setSelectedAccount] =
    useState<null | extLib.AccountJson>(null);
  const [authRequests, setAuthRequests] = useState<null | AuthorizeRequest[]>(
    null
  );
  const [metaRequests, setMetaRequests] = useState<null | MetadataRequest[]>(
    null
  );
  const [signRequests, setSignRequests] = useState<null | SigningRequest[]>(
    null
  );
  const [selectedNetwork, setSelectedNetwork] = useState<ReefNetwork>();
  const [provider, setProvider] = useState<Provider>();
  const [signOverlay, setSignOverlay] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const isDetached = queryParams.get("detached");

  const openFullPage = () => {
    const url = chrome.runtime.getURL(`index.html#${location.pathname}`);
    void chrome.tabs.create({ url });
    window.close();
  };

  if (isDetached && location.pathname.startsWith("/account/import-ledger")) {
    openFullPage();
  }

  const _onAction = useCallback((to?: string): void => {
    if (to) {
      window.location.hash = to;
    }
  }, []);

  useEffect(() => {
    if (!isDefaultPopup || isDetached) {
      Promise.all([
        subscribeAccounts(onAccountsChange),
        subscribeAuthorizeRequests(setAuthRequests),
        subscribeMetadataRequests(setMetaRequests),
        subscribeSigningRequests(setSignRequests),
        subscribeNetwork(onNetworkChange),
      ]).catch(console.error);
    } else {
      focusOrCreateDetached();
    }
  }, []);

  useEffect(() => {
    if (accountCtx.accounts.length && provider) {
      Promise.all(
        accountCtx.accounts.map((acc) =>
          accountToReefSigner(acc, provider as Provider)
        )
      ).then((accounts) =>
        setAccountCtx({
          ...accountCtx,
          accountsWithSigners: accounts,
        })
      );
    }
  }, [accountCtx.accounts, provider]);

  useEffect(() => {
    if (authRequests?.length) {
      _onAction("/requests/auth");
    } else if (metaRequests?.length) {
      _onAction("/requests/metadata");
    } else if (signRequests?.length) {
      setSignOverlay(true);
    } else {
      setSignOverlay(false);
    }
  }, [authRequests, metaRequests, signRequests, selectedAccount]);

  const isDefaultPopup = useMemo(() => {
    return window.innerWidth <= 400;
  }, []);

  const focusOrCreateDetached = async () => {
    const detachedWindowId = await getDetachedWindowId();
    if (detachedWindowId) {
      chrome.windows.update(detachedWindowId, { focused: true }, (win) => {
        if (chrome.runtime.lastError || !win) {
          createDetached();
        } else {
          window.close();
        }
      });
    } else {
      createDetached();
    }
  };

  const createDetached = async () => {
    chrome.windows.getCurrent((win) => {
      chrome.windows.create(createPopupData(win), (detachedWindow) => {
        setDetachedWindowId(detachedWindow.id);
        window.close();
      });
    });
  };

  const onAccountsChange = async (_accounts: extLib.AccountJson[]) => {
    if (!_accounts?.length) {
      setSelectedAccount(null);
      setAccountCtx({
        accounts: [],
        selectedAccount: null,
        accountsWithSigners: [],
      });
      return;
    }

    const selAcc = _accounts.find((acc) => !!acc.isSelected);
    if (selAcc) {
      setSelectedAccount(selAcc);
    } else {
      selectAccount(_accounts[0].address);
      setSelectedAccount(_accounts[0]);
    }
    setAccountCtx({
      ...accountCtx,
      accounts: _accounts,
      selectedAccount: selAcc,
    });
  };

  const onNetworkChange = async (networkId: AvailableNetwork) => {
    if (networkId !== selectedNetwork?.id) {
      setSelectedNetwork(reefNetworks[networkId]);

      const newProvider = new Provider({
        provider: new WsProvider(reefNetworks[networkId].rpcUrl),
      });
      try {
        await newProvider.api.isReadyOrError;
        setProvider(newProvider);
      } catch (e) {
        console.log("Provider isReadyOrError ERROR=", e);
        throw e;
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between mb-2 header-bg">
        {selectedNetwork && (
          <div>
            <div className="flex hover:cursor-pointer logo-w">
              {selectedNetwork.name == "Reef Mainnet" ? <Uik.ReefLogo /> : <Uik.ReefTestnetLogo />}
            </div>
          </div>
        )}
        <div className="flex justify-end absolute right-2 top-1">
          <Uik.Button
            className="dark-btn"
            text="Open App"
            icon={faArrowUpRightFromSquare}
            onClick={() => window.open("https://app.reef.io/", "_blank")}
          />
          {!location.pathname.startsWith("/account/") && (
            <Uik.Button
              className="dark-btn"
              text="Add Account"
              icon={faCirclePlus}
              onClick={() => _onAction("/account/menu")}
            />
          )}
          <Uik.Button
            className="dark-btn"
            icon={faGear}
            onClick={() => setIsSettingsOpen(true)}
          />

        </div>
        <div className="relative top-8 right-4">
          <Uik.Dropdown
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            position="bottomLeft"
          >
            {selectedNetwork &&
              <>
                <Uik.DropdownItem
                  icon={faShuffle as IconProp}
                  text='Toggle Network'
                  onClick={() =>
                    selectNetwork(
                      selectedNetwork.id === "mainnet" ? "testnet" : "mainnet"
                    )
                  }
                />
                <Uik.Divider />
              </>
            }
            {!location.pathname.startsWith("/auth-list") && (
              <Uik.DropdownItem
                icon={faTasks as IconProp}
                text='Manage Website Access'
                onClick={() => _onAction("/auth-list")}
              />
            )}
            {isDetached && (
              <Uik.DropdownItem
                icon={faExpand as IconProp}
                text='Open extension in new window'
                onClick={() => openFullPage()}
              />
            )}
          </Uik.Dropdown>
        </div>

      </div>
      <div className="popup text-left">
        {process.env.NODE_ENV === "development" && (
          <div className="absolute left-5 top-3 text-gray-400">
            <span>DEV</span>
          </div>
        )}



        {/* Content */}
        <ActionContext.Provider value={_onAction}>
          <AccountsContext.Provider value={accountCtx}>
            <ProviderContext.Provider value={provider}>
              {signOverlay && <Signing requests={signRequests} />}
              <div className={signOverlay ? "hidden" : ""}>
                <Routes>
                  <Route path="/" element={<Accounts />} />
                  <Route path="/auth-list" element={<AuthManagement />} />
                  <Route path="/account/menu" element={<AccountMenu />} />
                  <Route path="/account/create" element={<CreateAccount />} />
                  <Route
                    path="/account/derive/:address/locked"
                    element={<Derive isLocked />}
                  />
                  <Route path="/account/derive/:address" element={<Derive />} />
                  <Route path="/account/export/:address" element={<Export />} />
                  <Route path="/account/export-all" element={<ExportAll />} />
                  <Route path="/account/import-seed" element={<ImportSeed />} />
                  <Route
                    path="/account/import-ledger"
                    element={<ImportLedger />}
                  />
                  <Route path="/account/restore-json" element={<RestoreJson />} />
                  <Route path="/account/forget/:address" element={<Forget />} />
                  <Route
                    path="/bind/:address"
                    element={<Bind provider={provider} />}
                  />
                  <Route
                    path="/requests/auth"
                    element={<Authorize requests={authRequests} />}
                  />
                  <Route
                    path="/requests/sign"
                    element={<Signing requests={signRequests} />}
                  />
                  <Route
                    path="/requests/metadata"
                    element={<Metadata requests={metaRequests} />}
                  />
                  <Route
                    path={PHISHING_PAGE_REDIRECT}
                    element={<PhishingDetected />}
                  />
                </Routes>
              </div>
            </ProviderContext.Provider>
          </AccountsContext.Provider>
        </ActionContext.Provider>
      </div>
    </div>
  );
};

export default Popup;
