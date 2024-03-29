// Adapted from @polkadot/bg (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import { BehaviorSubject } from "rxjs";
import type {
  JsonRpcResponse,
  ProviderInterface,
  ProviderInterfaceCallback,
} from "@polkadot/rpc-provider/types";
import { assert } from "@polkadot/util";
import { extension as extLib } from '@reef-chain/util-lib';

import type {
  AccountJson,
  AuthorizeRequest,
  MetadataRequest,
  RequestAuthorizeTab,
  RequestRpcSend,
  RequestRpcSubscribe,
  RequestRpcUnsubscribe,
  RequestSign,
  ResponseRpcListProviders,
  ResponseSigning,
  SigningRequest,
} from "../types";
import { PORT_EXTENSION } from "../../defaults";
import { addMetadata, knownMetadata } from "../../../chains";
import { MetadataStore } from "../../stores";
import { createPopupData } from "../../../popup/util";

interface Resolver<T> {
  reject: (error: Error) => void;
  resolve: (result: T) => void;
}

interface AuthRequest extends Resolver<boolean> {
  id: string;
  idStr: string;
  request: RequestAuthorizeTab;
  url: string;
}

export interface AuthUrlInfo {
  count: number;
  id: string;
  isAllowed: boolean;
  origin: string;
  url: string;
}

export type AuthUrls = Record<string, AuthUrlInfo>;

interface MetaRequest extends Resolver<boolean> {
  id: string;
  request: extLib.MetadataDef;
  url: string;
}

// List of providers passed into constructor. This is the list of providers exposed by the extension.
type Providers = Record<
  string,
  {
    meta: any; // ProviderMeta;
    // The provider is not running at init, calling this will instantiate the provider.
    start: () => ProviderInterface;
  }
>;

interface SignRequest extends Resolver<ResponseSigning> {
  account: AccountJson;
  id: string;
  request: RequestSign;
  url: string;
}

const AUTH_URLS_KEY = "auth_urls";
const ID_COUNTER_KEY = "id_counter";
const DETACHED_WINDOW_ID_KEY = "detached_window_id";

export default class State {
  public readonly authSubject: BehaviorSubject<AuthorizeRequest[]> =
    new BehaviorSubject<AuthorizeRequest[]>([]);
  public readonly metaSubject: BehaviorSubject<MetadataRequest[]> =
    new BehaviorSubject<MetadataRequest[]>([]);
  public readonly signSubject: BehaviorSubject<SigningRequest[]> =
    new BehaviorSubject<SigningRequest[]>([]);
  #authUrls: AuthUrls = {};
  readonly #authRequests: Record<string, AuthRequest> = {};
  readonly #metaStore = new MetadataStore();
  // Map of providers currently injected in tabs
  readonly #injectedProviders = new Map<
    chrome.runtime.Port,
    ProviderInterface
  >();
  readonly #metaRequests: Record<string, MetaRequest> = {};
  // Map of all providers exposed by the extension, they are retrievable by key
  readonly #providers: Providers = {};
  // Sign requests are not persisted, if service worker stops they are treated as cancelled by user
  readonly #signRequests: Record<string, SignRequest> = {};
  #detachedWindowId = 0;
  #idCounter = 0;

  constructor() {
    this.updateIcon();

    this.#metaStore.all((_key: string, def: extLib.MetadataDef): void => {
      addMetadata(def);
    });

    chrome.storage.local.get([AUTH_URLS_KEY]).then((item) => {
      this.#authUrls = item[AUTH_URLS_KEY] || {};
    });

    chrome.storage.local.get([ID_COUNTER_KEY]).then((item) => {
      this.#idCounter = item[ID_COUNTER_KEY] || 0;
    });

    chrome.storage.local.get([DETACHED_WINDOW_ID_KEY]).then((item) => {
      this.#detachedWindowId = item[DETACHED_WINDOW_ID_KEY] || 0;
    });

    chrome.windows.onRemoved.addListener((id) => {
      if (id == this.#detachedWindowId) {
        this.#detachedWindowId = 0;
      }
    });
  }

  private getId(): string {
    this.#idCounter++;
    chrome.storage.local.set({ [ID_COUNTER_KEY]: this.#idCounter });
    return `${Date.now()}.${this.#idCounter}`;
  }

  public get detachedWindowId(): number {
    return this.#detachedWindowId;
  }

  public set detachedWindowId(id: number) {
    chrome.storage.local.set({ [DETACHED_WINDOW_ID_KEY]: id });
    this.#detachedWindowId = id;
  }

  public get knownMetadata(): extLib.MetadataDef[] {
    return knownMetadata();
  }

  public get numAuthRequests(): number {
    return Object.keys(this.#authRequests).length;
  }

  public get numMetaRequests(): number {
    return Object.keys(this.#metaRequests).length;
  }

  public get numSignRequests(): number {
    return Object.keys(this.#signRequests).length;
  }

  public get allAuthRequests(): AuthorizeRequest[] {
    return Object.values(this.#authRequests).map(
      ({ id, request, url }): AuthorizeRequest => ({ id, request, url })
    );
  }

  public get allMetaRequests(): MetadataRequest[] {
    return Object.values(this.#metaRequests).map(
      ({ id, request, url }): MetadataRequest => ({ id, request, url })
    );
  }

  public get allSignRequests(): SigningRequest[] {
    return Object.values(this.#signRequests).map(
      ({ account, id, request, url }): SigningRequest => ({
        account,
        id,
        request,
        url,
      })
    );
  }

  public get authUrls(): AuthUrls {
    return this.#authUrls;
  }

  public toggleAuthorization(url: string): AuthUrls {
    const entry = this.#authUrls[url];

    assert(entry, `The source ${url} is not known`);

    this.#authUrls[url].isAllowed = !entry.isAllowed;
    this.saveCurrentAuthList();

    return this.#authUrls;
  }

  public async authorizeUrl(
    url: string,
    request: RequestAuthorizeTab
  ): Promise<boolean> {
    const idStr = this.stripUrl(url);

    // Do not enqueue duplicate authorization requests.
    const isDuplicate = Object.values(this.#authRequests).some(
      (request) => request.idStr === idStr
    );

    assert(
      !isDuplicate,
      `The source ${url} has a pending authorization request`
    );

    if (this.#authUrls[idStr]) {
      // this url was seen in the past
      assert(
        this.#authUrls[idStr].isAllowed,
        `The source ${url} is not allowed to interact with this extension`
      );

      return false;
    }

    return new Promise((resolve, reject): void => {
      const id = this.getId();

      this.#authRequests[id] = {
        ...this.authComplete(id, resolve, reject),
        id,
        idStr,
        request,
        url,
      };

      this.updateIconAuth();
      this.popupOpen();
    });
  }

  public ensureUrlAuthorized(url: string): boolean {
    if (url === PORT_EXTENSION) {
      return true;
    }

    const entry = this.#authUrls[this.stripUrl(url)];

    assert(entry, `The source ${url} has not been enabled yet`);
    assert(
      entry.isAllowed,
      `The source ${url} is not allowed to interact with this extension`
    );

    return true;
  }

  public injectMetadata(url: string, request: extLib.MetadataDef): Promise<boolean> {
    return new Promise((resolve, reject): void => {
      const id = this.getId();

      this.#metaRequests[id] = {
        ...this.metaComplete(id, resolve, reject),
        id,
        request,
        url,
      };

      this.updateIconMeta();
      this.popupOpen();
    });
  }

  public getAuthRequest(id: string): AuthRequest {
    return this.#authRequests[id];
  }

  public getMetaRequest(id: string): MetaRequest {
    return this.#metaRequests[id];
  }

  public getSignRequest(id: string): SignRequest {
    return this.#signRequests[id];
  }

  // List all providers the extension is exposing
  public rpcListProviders(): Promise<ResponseRpcListProviders> {
    return Promise.resolve(
      Object.keys(this.#providers).reduce((acc, key) => {
        acc[key] = this.#providers[key].meta;

        return acc;
      }, {} as ResponseRpcListProviders)
    );
  }

  public rpcSend(
    request: RequestRpcSend,
    port: chrome.runtime.Port
  ): Promise<JsonRpcResponse<any>> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, "Cannot call pub(rpc.subscribe) before provider is set");

    return provider.send(request.method, request.params);
  }

  // Start a provider, return its meta
  public rpcStartProvider(
    key: string,
    port: chrome.runtime.Port
  ): Promise<extLib.ProviderMeta> {
    assert(
      Object.keys(this.#providers).includes(key),
      `Provider ${key} is not exposed by extension`
    );

    if (this.#injectedProviders.get(port)) {
      return Promise.resolve(this.#providers[key].meta);
    }

    // Instantiate the provider
    this.#injectedProviders.set(port, this.#providers[key].start());

    // Close provider connection when page is closed
    port.onDisconnect.addListener((): void => {
      const provider = this.#injectedProviders.get(port);

      if (provider) {
        provider.disconnect().catch(console.error);
      }

      this.#injectedProviders.delete(port);
    });

    return Promise.resolve(this.#providers[key].meta);
  }

  public rpcSubscribe(
    { method, params, type }: RequestRpcSubscribe,
    cb: ProviderInterfaceCallback,
    port: chrome.runtime.Port
  ): Promise<number | string> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, "Cannot call pub(rpc.subscribe) before provider is set");

    return provider.subscribe(type, method, params, cb);
  }

  public rpcSubscribeConnected(
    _request: null,
    cb: ProviderInterfaceCallback,
    port: chrome.runtime.Port
  ): void {
    const provider = this.#injectedProviders.get(port);

    assert(
      provider,
      "Cannot call pub(rpc.subscribeConnected) before provider is set"
    );

    cb(null, provider.isConnected); // Immediately send back current isConnected
    provider.on("connected", () => cb(null, true));
    provider.on("disconnected", () => cb(null, false));
  }

  public rpcUnsubscribe(
    request: RequestRpcUnsubscribe,
    port: chrome.runtime.Port
  ): Promise<boolean> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, "Cannot call pub(rpc.unsubscribe) before provider is set");

    return provider.unsubscribe(
      request.type,
      request.method,
      request.subscriptionId
    );
  }

  public saveMetadata(meta: extLib.MetadataDef): void {
    this.#metaStore.set(meta.genesisHash, meta);

    addMetadata(meta);
  }

  public sign(
    url: string,
    request: RequestSign,
    account: AccountJson
  ): Promise<ResponseSigning> {
    const id = this.getId();

    return new Promise((resolve, reject): void => {
      this.#signRequests[id] = {
        ...this.signComplete(id, resolve, reject),
        account,
        id,
        request,
        url,
      };

      this.updateIconSign();

      if (url !== PORT_EXTENSION) {
        this.popupOpen();
      }
    });
  }

  public removeAuthorization(url: string): AuthUrls {
    const entry = this.#authUrls[url];

    assert(entry, `The source ${url} is not known`);

    delete this.#authUrls[url];
    this.saveCurrentAuthList();

    return this.#authUrls;
  }

  private popupClose(): void {
    if (this.#detachedWindowId) {
      chrome.windows.remove(this.#detachedWindowId).catch(console.error);
    }
  }

  private popupOpen(): void {
    if (this.detachedWindowId) {
      chrome.windows.update(this.detachedWindowId, { focused: true }, (win) => {
        if (chrome.runtime.lastError || !win) {
          this.createDetached();
        }
      });
    } else {
      this.createDetached();
    }
  }

  private createDetached = async () => {
    chrome.windows.getCurrent((win) => {
      chrome.windows.create(createPopupData(win), (newWindow) => {
        this.detachedWindowId = newWindow.id;
      });
    });
  };

  private authComplete = (
    id: string,
    resolve: (result: boolean) => void,
    reject: (error: Error) => void
  ): Resolver<boolean> => {
    const complete = (result: boolean | Error) => {
      const isAllowed = result === true;
      const {
        idStr,
        request: { origin },
        url,
      } = this.#authRequests[id];

      this.#authUrls[this.stripUrl(url)] = {
        count: 0,
        id: idStr,
        isAllowed,
        origin,
        url,
      };

      this.saveCurrentAuthList();
      delete this.#authRequests[id];
      this.updateIconAuth(true);
    };

    return {
      reject: (error: Error): void => {
        complete(error);
        reject(error);
      },
      resolve: (result: boolean): void => {
        complete(result);
        resolve(result);
      },
    };
  };

  private saveCurrentAuthList() {
    chrome.storage.local.set({ [AUTH_URLS_KEY]: this.#authUrls });
  }

  private metaComplete = (
    id: string,
    resolve: (result: boolean) => void,
    reject: (error: Error) => void
  ): Resolver<boolean> => {
    const complete = (): void => {
      delete this.#metaRequests[id];
      this.updateIconMeta(true);
    };

    return {
      reject: (error: Error): void => {
        complete();
        reject(error);
      },
      resolve: (result: boolean): void => {
        complete();
        resolve(result);
      },
    };
  };

  private signComplete = (
    id: string,
    resolve: (result: ResponseSigning) => void,
    reject: (error: Error) => void
  ): Resolver<ResponseSigning> => {
    const complete = (): void => {
      delete this.#signRequests[id];
      this.updateIconSign(true);
    };

    return {
      reject: (error: Error): void => {
        complete();
        reject(error);
      },
      resolve: (result: ResponseSigning): void => {
        complete();
        resolve(result);
      },
    };
  };

  private stripUrl(url: string): string {
    assert(
      url &&
        (url.startsWith("http:") ||
          url.startsWith("https:") ||
          url.startsWith("ipfs:") ||
          url.startsWith("ipns:")),
      `Invalid url ${url}, expected to start with http: or https: or ipfs: or ipns:`
    );

    const parts = url.split("/");

    return parts[2];
  }

  private updateIcon(shouldClose?: boolean): void {
    const authCount = this.numAuthRequests;
    const metaCount = this.numMetaRequests;
    const signCount = this.numSignRequests;
    const text = authCount
      ? "Auth"
      : metaCount
      ? "Meta"
      : signCount
      ? `${signCount}`
      : "";

    chrome.action.setBadgeBackgroundColor({ color: "#A408EB" });
    chrome.action.setBadgeTextColor({ color: "#ffffff" });
    chrome.action.setBadgeText({ text });

    if (shouldClose && text === "") {
      this.popupClose();
    }
  }

  private updateIconAuth(shouldClose?: boolean): void {
    this.authSubject.next(this.allAuthRequests);
    this.updateIcon(shouldClose);
  }

  private updateIconMeta(shouldClose?: boolean): void {
    this.metaSubject.next(this.allMetaRequests);
    this.updateIcon(shouldClose);
  }

  private updateIconSign(shouldClose?: boolean): void {
    this.signSubject.next(this.allSignRequests);
    this.updateIcon(shouldClose);
  }
}
