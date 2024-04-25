import { Observable } from "rxjs";
import type {
  KeyringPair,
  KeyringPair$Json,
  KeyringPair$Meta,
} from "@polkadot/keyring/types";
import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";
import keyring from "@polkadot/ui-keyring";
import { SubjectInfo } from "@polkadot/ui-keyring/observable/types";
import { accounts as accountsObservable } from "@polkadot/ui-keyring/observable/accounts";
import { assert, isHex } from "@polkadot/util";
import { TypeRegistry } from "@polkadot/types";
import {
  keyExtractSuri,
  mnemonicGenerate,
  mnemonicValidate,
} from "@polkadot/util-crypto";
import { extension as extLib } from "@reef-chain/util-lib";

import {
  AuthorizeRequest,
  DetachedWindowRequest,
  MessageTypes,
  MetadataRequest,
  RequestAccountChangePassword,
  RequestAccountCreateHardware,
  RequestAccountCreateSuri,
  RequestAccountEdit,
  RequestAccountExport,
  RequestAccountForget,
  RequestAccountSelect,
  RequestAccountValidate,
  RequestAuthorizeApprove,
  RequestAuthorizeReject,
  RequestDeriveCreate,
  RequestDeriveValidate,
  RequestJsonRestore,
  RequestMetadataApprove,
  RequestMetadataReject,
  RequestNetworkSelect,
  RequestSigningApprove,
  RequestSigningCancel,
  RequestSigningIsLocked,
  RequestTypes,
  ResponseAccountsExport,
  ResponseAuthorizeList,
  ResponseDeriveValidate,
  ResponseSeedCreate,
  ResponseSigningIsLocked,
  ResponseType,
  SigningRequest,
} from "../types";
import { createSubscription, unsubscribe } from "./subscriptions";
import State from "./State";
import { AvailableNetwork, DEFAULT_REEF_NETWORK } from "../../../config";
import { PASSWORD_EXPIRY_MS } from "../../defaults";
import { KeyringPairs$Json } from "@polkadot/ui-keyring/types";

type CachedUnlocks = Record<string, number>;

export const REEF_NETWORK_KEY = "selected_reef_network";
const SEED_LENGTHS = [12, 24];

// a global registry to use internally
const registry = new TypeRegistry();

export function setSelectedAccount<
  T extends extLib.AccountJson | extLib.InjectedAccount
>(accountsJson: T[], index: number | undefined): T[] {
  if (accountsJson.length && index != null) {
    accountsJson.forEach((a, i) => {
      a.isSelected = i === index;
    });
  }

  return accountsJson;
}

export function transformAccounts(accounts: SubjectInfo): extLib.AccountJson[] {
  const singleAddresses = Object.values(accounts);
  const accountsJson = singleAddresses.map(
    ({ json: { address, meta }, type }): extLib.AccountJson => ({
      address,
      ...meta,
      type,
    })
  );
  const selIndex = getSelectedAccountIndex(
    singleAddresses.map((sa) => sa.json)
  );

  return setSelectedAccount(accountsJson, selIndex);
}

function isJsonPayload(
  value: SignerPayloadJSON | SignerPayloadRaw
): value is SignerPayloadJSON {
  return (value as SignerPayloadJSON).genesisHash !== undefined;
}

function createNetworkIdObservable(): Observable<any> {
  return new Observable<any>((subscriber) => {
    chrome.storage.local.get(
      { [REEF_NETWORK_KEY]: DEFAULT_REEF_NETWORK },
      (items) => {
        subscriber.next(items[REEF_NETWORK_KEY]);

        const listener = (
          changes: { [key: string]: chrome.storage.StorageChange },
          areaName: string
        ) => {
          if (areaName === "local" && REEF_NETWORK_KEY in changes) {
            subscriber.next(changes[REEF_NETWORK_KEY].newValue);
          }
        };
        chrome.storage.onChanged.addListener(listener);

        return () => {
          chrome.storage.onChanged.removeListener(listener);
        };
      }
    );
  });
}

export const networkIdObservable = createNetworkIdObservable();

export function getSelectedAccountIndex(
  accountsMeta: { meta: any }[]
): number | undefined {
  if (accountsMeta.length) {
    const accsSelectedTsArr = accountsMeta.map((a) => a.meta._isSelectedTs);
    const lastSelectedSort = accsSelectedTsArr.sort((a, b) => {
      const selectedAAt = a || 0;
      const selectedBAt = b || 0;

      return selectedBAt - selectedAAt;
    });
    const lastTs = lastSelectedSort[0];

    return accountsMeta.findIndex((am) => am.meta._isSelectedTs === lastTs);
  }

  return undefined;
}

export default class Extension {
  readonly #cachedUnlocks: CachedUnlocks;

  readonly #state: State;

  constructor(state: State) {
    this.#cachedUnlocks = {};
    this.#state = state;
  }

  public async handle<TMessageType extends MessageTypes>(
    id: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    port: chrome.runtime.Port
  ): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case "pri(detached.window.get)":
        return this.getDetachedWindowId();
      case "pri(detached.window.set)":
        return this.setDetachedWindowId(request as DetachedWindowRequest);

      case "pri(metadata.approve)":
        return this.metadataApprove(request as RequestMetadataApprove);
      case "pri(metadata.get)":
        return this.metadataGet(request as string);
      case "pri(metadata.list)":
        return this.metadataList();
      case "pri(metadata.reject)":
        return this.metadataReject(request as RequestMetadataReject);
      case "pri(metadata.requests)":
        return this.metadataSubscribe(id, port);

      case "pri(derivation.create)":
        return this.derivationCreate(request as RequestDeriveCreate);
      case "pri(derivation.validate)":
        return this.derivationValidate(request as RequestDeriveValidate);

      case "pri(authorize.approve)":
        return this.authorizeApprove(request as RequestAuthorizeApprove);
      case "pri(authorize.list)":
        return this.getAuthList();
      case "pri(authorize.reject)":
        return this.authorizeReject(request as RequestAuthorizeReject);
      case "pri(authorize.toggle)":
        return this.toggleAuthorization(request as string);
      case "pri(authorize.remove)":
        return this.removeAuthorization(request as string);
      case "pri(authorize.requests)":
        return this.authorizeSubscribe(id, port);

      case "pri(seed.create)":
        return this.seedCreate();
      case "pri(seed.validate)":
        return this.seedValidate(request as string);

      case "pri(accounts.create.hardware)":
        return this.accountsCreateHardware(
          request as RequestAccountCreateHardware
        );
      case "pri(accounts.create.suri)":
        return this.accountsCreateSuri(request as RequestAccountCreateSuri);
      case "pri(accounts.changePassword)":
        return this.accountsChangePassword(
          request as RequestAccountChangePassword
        );
      case "pri(accounts.edit)":
        return this.accountsEdit(request as RequestAccountEdit);
      case "pri(json.restore)":
        return this.jsonRestore(request as RequestJsonRestore);
      case "pri(json.batchRestore)":
        return this.batchRestore(request as RequestJsonRestore);
      case "pri(accounts.export)":
        return this.accountsExport(request as RequestAccountExport);
      case "pri(accounts.exportAll)":
        return this.accountsBatchExport(request as string);
      case "pri(accounts.forget)":
        return this.accountsForget(request as RequestAccountForget);
      case "pri(accounts.subscribe)":
        return this.accountsSubscribe(id, port);
      case "pri(accounts.select)":
        return this.accountsSelect(request as RequestAccountSelect);
      case "pri(accounts.validate)":
        return this.accountsValidate(request as RequestAccountValidate);

      case "pri(network.select)":
        return this.networkSelect(request as RequestNetworkSelect);
      case "pri(network.subscribe)":
        return this.networkSubscribe(id, port);

      case "pri(signing.approve)":
        return this.signingApprove(request as RequestSigningApprove);
      case "pri(signing.cancel)":
        return this.signingCancel(request as RequestSigningCancel);
      case "pri(signing.isLocked)":
        return this.signingIsLocked(request as RequestSigningIsLocked);
      case "pri(signing.requests)":
        return this.signingSubscribe(id, port);

      default:
        throw new Error(
          `Extension.ts Unable to handle message of type ${type}`
        );
    }
  }

  private setDetachedWindowId({ id }: DetachedWindowRequest): boolean {
    this.#state.detachedWindowId = id;
    return true;
  }

  private getDetachedWindowId(): number {
    return this.#state.detachedWindowId;
  }

  private seedCreate(): ResponseSeedCreate {
    const seed = mnemonicGenerate(12);
    return {
      address: keyring.createFromUri(seed, {}, "sr25519").address,
      seed,
    };
  }

  private seedValidate(suri: string): ResponseSeedCreate {
    const { phrase } = keyExtractSuri(suri);

    if (isHex(phrase)) {
      assert(isHex(phrase, 256), "Hex seed needs to be 256-bits");
    } else {
      // sadly isHex detects as string, so we need a cast here
      assert(
        SEED_LENGTHS.includes(phrase.split(" ").length),
        `Mnemonic needs to contain ${SEED_LENGTHS.join(", ")} words`
      );
      assert(mnemonicValidate(phrase), "Not a valid mnemonic seed");
    }

    return {
      address: keyring.createFromUri(suri, {}, "sr25519").address,
      seed: suri,
    };
  }

  private accountsCreateHardware({
    accountIndex,
    address,
    addressOffset,
    hardwareType,
    name,
  }: RequestAccountCreateHardware): boolean {
    keyring.addHardware(address, hardwareType, {
      accountIndex,
      addressOffset,
      name,
    });

    return true;
  }

  private accountsCreateSuri({
    name,
    password,
    suri,
  }: RequestAccountCreateSuri): boolean {
    keyring.addUri(suri, password, { name });
    return true;
  }

  private accountsChangePassword({
    address,
    newPass,
    oldPass,
  }: RequestAccountChangePassword): boolean {
    const pair = keyring.getPair(address);

    assert(pair, "Unable to find pair");

    try {
      if (!pair.isLocked) {
        pair.lock();
      }

      pair.decodePkcs8(oldPass);
    } catch (error) {
      throw new Error("oldPass is invalid");
    }

    keyring.encryptAccount(pair, newPass);

    return true;
  }

  private accountsEdit({ address, name }: RequestAccountEdit): boolean {
    const pair = keyring.getPair(address);
    assert(pair, "Unable to find pair");

    keyring.saveAccountMeta(pair, { ...pair.meta, name });
    return true;
  }

  private jsonRestore({ file, password }: RequestJsonRestore): void {
    try {
      keyring.restoreAccount(file, password);
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  private batchRestore({ file, password }: RequestJsonRestore): void {
    try {
      keyring.restoreAccounts(file, password);
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  private authorizeApprove({ id }: RequestAuthorizeApprove): boolean {
    const queued = this.#state.getAuthRequest(id);

    assert(queued, "Unable to find request");

    const { resolve } = queued;

    resolve(true);

    return true;
  }

  private getAuthList(): ResponseAuthorizeList {
    return { list: this.#state.authUrls };
  }

  private authorizeReject({ id }: RequestAuthorizeReject): boolean {
    const queued = this.#state.getAuthRequest(id);

    assert(queued, "Unable to find request");

    const { reject } = queued;

    reject(new Error("Rejected"));

    return true;
  }

  private toggleAuthorization(url: string): ResponseAuthorizeList {
    return { list: this.#state.toggleAuthorization(url) };
  }

  private authorizeSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pri(authorize.requests)">(id, port);
    const subscription = this.#state.authSubject.subscribe(
      (requests: AuthorizeRequest[]): void => cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private removeAuthorization(url: string): ResponseAuthorizeList {
    return { list: this.#state.removeAuthorization(url) };
  }

  private metadataApprove({ id }: RequestMetadataApprove): boolean {
    const queued = this.#state.getMetaRequest(id);

    assert(queued, "Unable to find request");

    const { request, resolve } = queued;

    this.#state.saveMetadata(request);

    resolve(true);

    return true;
  }

  private metadataGet(genesisHash: string | null): extLib.MetadataDef | null {
    return (
      this.#state.knownMetadata.find(
        (result) => result.genesisHash === genesisHash
      ) || null
    );
  }

  private metadataList(): extLib.MetadataDef[] {
    return this.#state.knownMetadata;
  }

  private metadataReject({ id }: RequestMetadataReject): boolean {
    const queued = this.#state.getMetaRequest(id);

    assert(queued, "Unable to find request");

    const { reject } = queued;

    reject(new Error("Rejected"));

    return true;
  }

  private metadataSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pri(metadata.requests)">(id, port);
    const subscription = this.#state.metaSubject.subscribe(
      (requests: MetadataRequest[]): void => cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private derive(
    parentAddress: string,
    suri: string,
    password: string,
    metadata: KeyringPair$Meta
  ): KeyringPair {
    const parentPair = keyring.getPair(parentAddress);

    try {
      parentPair.decodePkcs8(password);
    } catch (e) {
      throw new Error("invalid password");
    }

    try {
      return parentPair.derive(suri, metadata);
    } catch (err) {
      throw new Error(`"${suri}" is not a valid derivation path`);
    }
  }

  private derivationValidate({
    parentAddress,
    parentPassword,
    suri,
  }: RequestDeriveValidate): ResponseDeriveValidate {
    const childPair = this.derive(parentAddress, suri, parentPassword, {});

    return {
      address: childPair.address,
      suri,
    };
  }

  private derivationCreate({
    name,
    parentAddress,
    parentPassword,
    password,
    suri,
  }: RequestDeriveCreate): boolean {
    const childPair = this.derive(parentAddress, suri, parentPassword, {
      name,
      parentAddress,
      suri,
    });

    keyring.addPair(childPair, password);

    return true;
  }

  private accountsExport({
    address,
    password,
  }: RequestAccountExport): KeyringPair$Json {
    return keyring.backupAccount(keyring.getPair(address), password);
  }

  private async accountsBatchExport(
    password: string
  ): Promise<ResponseAccountsExport> {
    const addresses = keyring.getAddresses().map((address) => address.address);
    return {
      exportedJson: await keyring.backupAccounts(addresses, password),
    };
  }

  protected accountsForget({ address }: RequestAccountForget): boolean {
    keyring.forgetAccount(address);

    return true;
  }

  private refreshAccountPasswordCache(pair: KeyringPair): number {
    const { address } = pair;

    const savedExpiry = this.#cachedUnlocks[address] || 0;
    const remainingTime = savedExpiry - Date.now();

    if (remainingTime < 0) {
      this.#cachedUnlocks[address] = 0;
      pair.lock();

      return 0;
    }

    return remainingTime;
  }

  protected accountsSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pri(accounts.subscribe)">(id, port);
    const subscription = accountsObservable.subject.subscribe(
      (accounts: SubjectInfo): void => cb(transformAccounts(accounts))
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private accountsSelect({ address }: RequestAccountSelect): boolean {
    const newSelectPair = keyring.getPair(address);

    assert(newSelectPair, "Unable to find pair");
    // using timestamp since subject emits on every meta change - so can't unselect old without event
    keyring.saveAccountMeta(newSelectPair, {
      ...newSelectPair.meta,
      _isSelectedTs: new Date().getTime(),
    });

    return true;
  }

  private accountsValidate({
    address,
    password,
  }: RequestAccountValidate): boolean {
    try {
      keyring.backupAccount(keyring.getPair(address), password);

      return true;
    } catch (e) {
      return false;
    }
  }

  private networkSelect({ networkId }: RequestNetworkSelect) {
    chrome.storage.local.set({ [REEF_NETWORK_KEY]: networkId });
    return true;
  }

  private networkSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pri(network.subscribe)">(id, port);
    const subscription = networkIdObservable.subscribe(
      (network: AvailableNetwork): void => cb(network)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private signingApprove({
    id,
    password,
    savePass,
  }: RequestSigningApprove): boolean {
    const queued = this.#state.getSignRequest(id);

    assert(queued, "Unable to find request");

    const { reject, request, resolve } = queued;
    const pair = keyring.getPair(queued.account.address);

    if (!pair) {
      reject(new Error("Unable to find pair"));

      return false;
    }

    this.refreshAccountPasswordCache(pair);

    // if the keyring pair is locked, the password is needed
    if (pair.isLocked && !password) {
      reject(new Error("Password needed to unlock the account"));
    }

    if (pair.isLocked) {
      pair.decodePkcs8(password);
    }

    const { payload } = request;

    if (isJsonPayload(payload)) {
      // Get the metadata for the genesisHash
      const currentMetadata = this.#state.knownMetadata.find(
        (meta: extLib.MetadataDef) => meta.genesisHash === payload.genesisHash
      );

      // set the registry before calling the sign function
      registry.setSignedExtensions(
        payload.signedExtensions,
        currentMetadata?.userExtensions
      );

      if (currentMetadata) {
        registry.register(currentMetadata?.types);
      }
    }

    const result = request.sign(registry, pair);

    if (savePass) {
      this.#cachedUnlocks[pair.address] = Date.now() + PASSWORD_EXPIRY_MS;
    } else {
      pair.lock();
    }

    resolve({
      id,
      ...result,
    });

    return true;
  }

  private signingCancel({ id }: RequestSigningCancel): boolean {
    const queued = this.#state.getSignRequest(id);

    assert(queued, "Unable to find request");

    const { reject } = queued;

    reject(new Error("Cancelled"));

    return true;
  }

  private signingIsLocked({
    id,
  }: RequestSigningIsLocked): ResponseSigningIsLocked {
    const queued = this.#state.getSignRequest(id);

    assert(queued, "Unable to find request");

    const address = queued.request.payload.address;
    const pair = keyring.getPair(address);

    assert(pair, "Unable to find pair");

    const remainingTime = this.refreshAccountPasswordCache(pair);

    return {
      isLocked: pair.isLocked,
      remainingTime,
    };
  }

  private signingSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pri(signing.requests)">(id, port);
    const subscription = this.#state.signSubject.subscribe(
      (requests: SigningRequest[]): void => cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }
}
