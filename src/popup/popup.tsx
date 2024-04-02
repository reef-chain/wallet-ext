import React, { useMemo, useEffect, useState, useCallback } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Provider } from "@reef-chain/evm-provider";
import { WsProvider } from "@polkadot/api";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faArrowUpRightFromSquare,
  faCircleXmark,
  faExpand,
  faShuffle,
  faTasks,
} from "@fortawesome/free-solid-svg-icons";

import {
  AccountJson,
  AuthorizeRequest,
  MetadataRequest,
  SigningRequest,
} from "../extension-base/background/types";
import { PHISHING_PAGE_REDIRECT } from "../extension-base/defaults";
import { AvailableNetwork, ReefNetwork, reefNetworks } from "../config";
import {
  getDetachedWindowId,
  selectAccount,
  selectNetwork,
  setDetachedWindowId,
  subscribeAccounts,
  subscribeAuthorizeRequests,
  subscribeMetadataRequests,
  subscribeNetwork,
  subscribeSigningRequests,
} from "./messaging";
import { ActionContext } from "./contexts";
import { createPopupData } from "./util";
import { Signing } from "./Signing";
import { Metadata } from "./Metadata";
import { Authorize } from "./Authorize";
import { AuthManagement } from "./AuthManagement";
import { PhishingDetected } from "./PhishingDetected";
import { AccountMenu } from "./AccountOptions/AccountMenu";
import { CreateAccount } from "./AccountOptions/CreateAccount";
import Accounts from "./Accounts/Accounts";
import "./popup.css";
import { ImportSeed } from "./AccountOptions/ImportSeed";

const Popup = () => {
  const [accounts, setAccounts] = useState<null | AccountJson[]>(null);
  const [selectedAccount, setSelectedAccount] = useState<null | AccountJson>(
    null
  );
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

  const queryParams = new URLSearchParams(window.location.search);
  const isDetached = queryParams.get("detached");

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
    if (selectedNetwork) {
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (!selectedAccount) {
      _onAction("/");
    } else if (authRequests?.length) {
      _onAction("/requests/auth");
    } else if (metaRequests?.length) {
      _onAction("/requests/metadata");
    } else if (signRequests?.length) {
      _onAction("/requests/sign");
    } else {
      _onAction("/");
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

  const onAccountsChange = (_accounts: AccountJson[]) => {
    console.log("onAccountsChange", _accounts);

    setAccounts(_accounts);
    _onAction("/");

    if (!_accounts?.length) {
      setSelectedAccount(null);
      return;
    }

    const selAcc = _accounts.find((acc) => !!acc.isSelected);
    if (selAcc) {
      setSelectedAccount(selAcc);
    } else {
      selectAccount(_accounts[0].address);
      setSelectedAccount(_accounts[0]);
    }
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

  const openFullPage = () => {
    const url = `${chrome.runtime.getURL("index.html")}`;
    void chrome.tabs.create({ url });
    window.close();
  };

  return (
    <div className="popup">
      {process.env.NODE_ENV === "development" && (
        <div className="absolute left-5 top-3 text-gray-400">
          <span>DEV</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between">
        {selectedNetwork && (
          <div>
            <span className="text-lg">
              {selectedNetwork.id.charAt(0).toUpperCase() +
                selectedNetwork.id.slice(1)}
            </span>
            <button
              className="md"
              onClick={() =>
                selectNetwork(
                  selectedNetwork.id === "mainnet" ? "testnet" : "mainnet"
                )
              }
            >
              <FontAwesomeIcon icon={faShuffle as IconProp} />
            </button>
          </div>
        )}
        <div>
          <button
            className="md"
            onClick={() => window.open("https://app.reef.io/", "_blank")}
          >
            <FontAwesomeIcon icon={faArrowUpRightFromSquare as IconProp} />
          </button>
          {isDetached && (
            <button className="md" onClick={() => openFullPage()}>
              <FontAwesomeIcon icon={faExpand as IconProp} />
            </button>
          )}
          <button className="md" onClick={() => _onAction("/account/menu")}>
            <FontAwesomeIcon icon={faCirclePlus as IconProp} />
          </button>
          <button className="md" onClick={() => _onAction("/auth-list")}>
            <FontAwesomeIcon icon={faTasks as IconProp} />
          </button>
          <button className="md" onClick={() => _onAction("/")}>
            <FontAwesomeIcon icon={faCircleXmark as IconProp} />
          </button>
        </div>
      </div>

      {/* Content */}
      <ActionContext.Provider value={_onAction}>
        <Routes>
          <Route
            path="/"
            element={
              <Accounts
                accounts={accounts}
                provider={provider}
                selectedAccount={selectedAccount}
              />
            }
          />
          <Route path="/auth-list" element={<AuthManagement />} />
          <Route path="/account/menu" element={<AccountMenu />} />
          <Route path="/account/create" element={<CreateAccount />} />
          {/* <Route path="/account/derive" element={<Derive />} /> */}
          {/* <Route path="/account/export-all" element={<ExportAll />} /> */}
          <Route path="/account/import-seed" element={<ImportSeed />} />
          {/* <Route path="/account/restore-json" element={<RestoreJson />} /> */}
          {/* <Route path="/bind" element={<Bind />} /> */}
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
          <Route path={PHISHING_PAGE_REDIRECT} element={<PhishingDetected />} />
        </Routes>
      </ActionContext.Provider>
    </div>
  );
};

export default Popup;
