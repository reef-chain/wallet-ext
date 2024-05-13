import React, { useMemo, useEffect, useState, useCallback } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Provider, Signer } from "@reef-chain/evm-provider";
import { extension as extLib, reefState } from "@reef-chain/util-lib";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { hooks } from "@reef-chain/react-lib";
import {
  faCirclePlus,
  faArrowUpRightFromSquare,
  faExpand,
  faShuffle,
  faTasks,
  faGear,
  faPhotoFilm,
  faLanguage,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";

import "./popup.css";
import {
  AuthorizeRequest,
  MetadataRequest,
  SigningRequest,
} from "../extension-base/background/types";
import SigningKey from "../extension-base/page/Signer";
import { PHISHING_PAGE_REDIRECT } from "../extension-base/defaults";
import { AvailableNetwork, reefNetworks } from "../config";
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
import { network } from "@reef-chain/util-lib";
import { REEF_NETWORK_KEY } from "../extension-base/background/handlers/Extension";
import Uik from "@reef-chain/ui-kit";
import NFTs from "./NFTs/NFTs";
import ReefSigners from "./context/ReefSigners";
import strings from "../i18n/locales";
import { useTheme } from "./context/ThemeContext";
import { faThemeco } from "@fortawesome/free-brands-svg-icons";
import { useReefSigners } from "./hooks/useReefSigners";
import Tokens from "./Tokens/Tokens";
import VDA from "./VDA/VDA";

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
  const { isDarkMode, toggleTheme } = useTheme();
  const [accountCtx, setAccountCtx] = useState<AccountsCtx>({
    accounts: [],
    selectedAccount: null,
    accountsWithSigners: [],
  });
  const selectedAccount = hooks.useObservableState(reefState.selectedAccount$);
  const [authRequests, setAuthRequests] = useState<null | AuthorizeRequest[]>(
    null
  );
  const [metaRequests, setMetaRequests] = useState<null | MetadataRequest[]>(
    null
  );
  const [signRequests, setSignRequests] = useState<null | SigningRequest[]>(
    null
  );
  const selectedNetwork = hooks.useObservableState(reefState.selectedNetwork$);
  const provider: Provider | undefined = hooks.useObservableState(reefState.selectedProvider$);
  const [signOverlay, setSignOverlay] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLanguageChangeModalOpen, setIsLanguageChangeModalOpen] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  //handles body color change if dark mode toggled
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [isDarkMode]);

  useEffect(() => {
    const initReefState = async () => {
      // network fallback - check localstorage for last used network
      const storedNetwork = await chrome.storage.local.get(REEF_NETWORK_KEY);
      let _selectedNetwork = selectedNetwork;
      if (storedNetwork) {
        _selectedNetwork = network.AVAILABLE_NETWORKS[storedNetwork[REEF_NETWORK_KEY]]
      }

      // init reef state from util lib
      reefState.initReefState({
        jsonAccounts: {
          accounts: accountCtx.accounts,
          injectedSigner: extLib as any
        },
        network: _selectedNetwork
      })
    }
    if (accountCtx.accounts.length == 0 || !extLib) return;
    initReefState()
  }, [accountCtx])

  const [selectedSigner, setSelectedSigner] = useState(undefined);

  const selectedReefAccount = hooks.useObservableState(reefState.selectedAccount$);

  const accounts = hooks.useObservableState(reefState.accounts$);

  const signers = useReefSigners(accounts as extLib.AccountJson[], provider);

  useEffect(() => {
    signers?.forEach((sgnr) => {
      if (sgnr.address == selectedReefAccount.address) setSelectedSigner(sgnr)
    })
  }, [selectedReefAccount])

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
      reefState.setSelectedAddress(null);
      setAccountCtx({
        accounts: [],
        selectedAccount: null,
        accountsWithSigners: [],
      });
      return;
    }

    const selAcc = _accounts.find((acc) => !!acc.isSelected);
    if (selAcc) {
      reefState.setSelectedAddress(selAcc.address);
    } else {
      selectAccount(_accounts[0].address);
      reefState.setSelectedAddress(_accounts[0].address);
    }
    setAccountCtx({
      ...accountCtx,
      accounts: _accounts,
      selectedAccount: selAcc,
    });
  };


  const onNetworkChange = async (networkId: AvailableNetwork) => {
    // handle network change by toggling provider
    if (networkId !== selectedNetwork?.name && selectedNetwork) {
      reefState.setSelectedNetwork(network.AVAILABLE_NETWORKS[reefNetworks[networkId].id]);
      selectNetwork(networkId);
    }
  };

  //fetch stored language
  useEffect(() => {
    try {
      const storedLang = localStorage.getItem("REEF_LANGUAGE_IDENT");
      if (storedLang) {
        console.log(storedLang)
        setSelectedLanguage(JSON.parse(storedLang).lang);
        strings.setLanguage(JSON.parse(storedLang).lang)
      }
    } catch (error) {
      console.log("error in fetching stored language", error.message);
    }
  }, [])

  return (
    <div>
      {/* Header */}
      <div className={`flex justify-between mb-2 header-base header-bg${isDarkMode ? "--dark" : ""} `}>
        {selectedNetwork && (
          <div>
            <div className="flex hover:cursor-pointer logo-w">
              {selectedNetwork.name == "mainnet" ? <Uik.ReefLogo /> : <Uik.ReefTestnetLogo />}
            </div>
          </div>
        )}
        <div className="flex justify-end absolute right-2 top-1">
          <Uik.Button
            className={`${isDarkMode ? 'dark-btn' : ""} header-btn-base`}
            text={strings.open_app}
            icon={faArrowUpRightFromSquare}

            onClick={() => window.open("https://app.reef.io/", "_blank")}
          />
          {!location.pathname.startsWith("/account/") && (
            <Uik.Button
              className={`${isDarkMode ? 'dark-btn' : ""} header-btn-base filled-btn`}
              text={strings.add_acc}
              icon={faCirclePlus}
              onClick={() => _onAction("/account/menu")}
              fill
            />
          )}

          <Uik.Button
            className={`${isDarkMode ? 'dark-btn' : ""} header-btn-base`}
            text={strings.nfts}
            icon={faPhotoFilm}
            onClick={() => _onAction("/vda")}
          />

          <Uik.Button
            className={`${isDarkMode ? 'dark-btn' : ""} header-btn-base`}
            icon={faGear}
            onClick={() => setIsSettingsOpen(true)}
          />

        </div>
        <div className="relative top-8">
          <Uik.Dropdown
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            position="bottomLeft"
            className="dark-mode-modal positioned-right"
          >
            <Uik.DropdownItem
              icon={faLanguage as IconProp}
              text={strings.change_language}
              onClick={() =>
                setIsLanguageChangeModalOpen(true)
              }
            />
            {selectedNetwork &&
              <>
                <Uik.DropdownItem
                  icon={faShuffle as IconProp}
                  text={strings.toggle_network}
                  onClick={() =>
                    onNetworkChange(selectedNetwork.name === "mainnet" ? "testnet" : "mainnet")
                  }
                />
                <Uik.DropdownItem
                  icon={isDarkMode ? faSun : faMoon as IconProp}
                  text={strings.toggle_theme}
                  onClick={() =>
                    toggleTheme()
                  }
                />
                <Uik.Divider />
              </>
            }
            {!location.pathname.startsWith("/auth-list") && (
              <Uik.DropdownItem
                icon={faTasks as IconProp}
                text={strings.manage_website_access}
                onClick={() => _onAction("/auth-list")}
              />
            )}
            {isDetached && (
              <Uik.DropdownItem
                icon={faExpand as IconProp}
                text={strings.open_in_new_window}
                onClick={() => openFullPage()}
              />
            )}
          </Uik.Dropdown>
          <div className="modal-container">
            <Uik.Modal isOpen={isLanguageChangeModalOpen} onClose={() => setIsLanguageChangeModalOpen(false)} title="Select a language...">
              <div>
                <select value={selectedLanguage} onChange={(e) => {
                  setSelectedLanguage(e.target.value)
                  strings.setLanguage(e.target.value)
                  localStorage.setItem("REEF_LANGUAGE_IDENT", JSON.stringify({ lang: e.target.value }));
                }
                } className="select-language">
                  <option value="">Select a language...</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </Uik.Modal>
          </div>
        </div>

      </div>
      <div className="popup text-left">
        {process.env.NODE_ENV === "development" && (
          <div className="absolute left-5 top-3 text-gray-400">
            <span>{strings.dev}</span>
          </div>
        )}

        {/* Content */}
        <ActionContext.Provider value={_onAction}>
          <AccountsContext.Provider value={accountCtx}>
            <ProviderContext.Provider value={provider}>
              <ReefSigners.Provider value={{
                accounts: signers,
                selectedSigner: selectedSigner,
                network: selectedNetwork,
                reefState: reefState,
                provider,
              }} >
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
                      path="/vda"
                      element={<VDA />}
                    />
                    <Route
                      path={PHISHING_PAGE_REDIRECT}
                      element={<PhishingDetected />}
                    />
                  </Routes>
                </div>
              </ReefSigners.Provider>
            </ProviderContext.Provider>
          </AccountsContext.Provider>
        </ActionContext.Provider>
      </div>
    </div>
  );
};

export default Popup;
