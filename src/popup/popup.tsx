import React, { useMemo, useEffect, useState } from "react";
import { Provider } from "@reef-chain/evm-provider";
import { Keyring, WsProvider } from "@polkadot/api";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faCircleXmark,
  faExpand,
  faShuffle,
  faTasks,
} from "@fortawesome/free-solid-svg-icons";

import { AvailableNetwork, ReefNetwork, reefNetworks } from "../config";
import {
  createAccountSuri,
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
import {
  AccountJson,
  AuthorizeRequest,
  MetadataRequest,
  SigningRequest,
} from "../extension-base/background/types";
import Account from "./Accounts/Account";
import { Signing } from "./Signing";
import { Metadata } from "./Metadata";
import { Authorize } from "./Authorize";
import { AuthManagement } from "./AuthManagement";
import { createPopupData } from "./util";
import "./popup.css";
import { PHISHING_PAGE_REDIRECT } from "../extension-base/defaults";
import { PhishingDetected } from "./PhishingDetected";

const enum State {
  ACCOUNTS,
  ADD_ACCOUNT,
  AUTH_REQUESTS,
  META_REQUESTS,
  SIGN_REQUESTS,
  AUTH_MANAGEMENT,
  PHISHING_DETECTED,
}

const Popup = () => {
  const [state, setState] = useState<State>(State.ACCOUNTS);
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
  const phishingWebsite = queryParams.get(PHISHING_PAGE_REDIRECT);

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
    if (phishingWebsite) {
      setState(State.PHISHING_DETECTED);
    } else if (!selectedAccount) {
      setState(State.ACCOUNTS);
    } else if (authRequests?.length) {
      setState(State.AUTH_REQUESTS);
    } else if (metaRequests?.length) {
      setState(State.META_REQUESTS);
    } else if (signRequests?.length) {
      setState(State.SIGN_REQUESTS);
    } else {
      setState(State.ACCOUNTS);
    }
  }, [
    authRequests,
    metaRequests,
    signRequests,
    selectedAccount,
    phishingWebsite,
  ]);

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
    setAccounts(_accounts);
    setState(State.ACCOUNTS);

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
            <span className="text-lg">{selectedNetwork.name}</span>
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
          {isDetached && (
            <button className="md" onClick={() => openFullPage()}>
              <FontAwesomeIcon icon={faExpand as IconProp} />
            </button>
          )}
          {state === State.ACCOUNTS && (
            <>
              <button
                className="md"
                onClick={() => setState(State.AUTH_MANAGEMENT)}
              >
                <FontAwesomeIcon icon={faTasks as IconProp} />
              </button>
            </>
          )}
          {(state === State.AUTH_MANAGEMENT ||
            state === State.PHISHING_DETECTED) && (
            <button className="md" onClick={() => setState(State.ACCOUNTS)}>
              <FontAwesomeIcon icon={faCircleXmark as IconProp} />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {state === State.ACCOUNTS &&
        (!accounts || (accounts.length > 0 && !provider)) && (
          <div className="text-lg mt-12">Loading...</div>
        )}

      {/* No accounts */}
      {state === State.ACCOUNTS && accounts?.length === 0 && (
        <>
          <div className="text-lg mt-12">No accounts available.</div>
          <button onClick={() => setState(State.ADD_ACCOUNT)}>
            Add account
          </button>
        </>
      )}

      {/* Selected account */}
      {(state === State.ACCOUNTS || state === State.SIGN_REQUESTS) &&
        selectedAccount &&
        provider && (
          <Account
            account={selectedAccount}
            provider={provider}
            isSelected={true}
          />
        )}

      {/* Other accounts */}
      {state === State.ACCOUNTS &&
        accounts?.length > 1 &&
        provider &&
        accounts
          .filter((account) => account.address !== selectedAccount.address)
          .map((account) => (
            <Account
              key={account.address}
              account={account}
              provider={provider}
            />
          ))}

      {/* Pending authorization requests */}
      {state === State.AUTH_REQUESTS && <Authorize requests={authRequests} />}

      {/* Pending metadata requests */}
      {state === State.META_REQUESTS && <Metadata requests={metaRequests} />}

      {/* Pending signing requests */}
      {state === State.SIGN_REQUESTS && <Signing requests={signRequests} />}

      {/* Auth management */}
      {state === State.AUTH_MANAGEMENT && <AuthManagement />}

      {/* Add account */}
      {state === State.ADD_ACCOUNT && (
        <div>
          <div className="text-lg mt-8">Add account</div>
        </div>
      )}

      {/* Phishing detected */}
      {state === State.PHISHING_DETECTED && (
        <PhishingDetected website={phishingWebsite} />
      )}
    </div>
  );
};

export default Popup;
