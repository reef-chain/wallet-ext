import { extension as extLib } from '@reef-chain/util-lib';
import { Provider, Signer as ReefVMSigner } from "@reef-chain/evm-provider";

import { ReefProvider } from "./ReefProvider";
import Accounts from "./Accounts";
import SigningKey from "../page/Signer";

export class ReefSigner implements extLib.ReefInjectedSigner {
  private accounts: Accounts;
  private readonly extSigningKey: SigningKey;
  private injectedProvider: ReefProvider;
  private selectedProvider: Provider | undefined;
  private selectedSignerAccount: extLib.InjectedAccount | undefined;
  private selectedSignerStatus: extLib.ReefSignerResponse | null = null;
  private isGetSignerMethodSubscribed = false;
  private resolvesList: any[] = [];
  private isSelectedAccountReceived = false;

  constructor(
    accounts: Accounts,
    extSigner: SigningKey,
    injectedProvider: ReefProvider
  ) {
    this.accounts = accounts;
    this.extSigningKey = extSigner;
    this.injectedProvider = injectedProvider;
  }

  public subscribeSelectedAccount(
    cb: (accounts: extLib.InjectedAccount | undefined) => unknown
  ): extLib.Unsubcall {
    return this.accounts.subscribe((accounts) => {
      cb(accounts.find((a) => a.isSelected));
    });
  }

  public async getSelectedAccount(): Promise<extLib.InjectedAccount | undefined> {
    const accounts = await this.accounts.get();

    return accounts.find((a) => a.isSelected);
  }

  public subscribeSelectedSigner(
    cb: (reefSigner: extLib.ReefSignerResponse) => unknown,
    connectedVM: extLib.ReefVM = extLib.ReefVM.EVM
  ): extLib.Unsubcall {
    const unsubProvFn = this.injectedProvider.subscribeSelectedNetworkProvider(
      (provider) => {
        this.selectedProvider = provider;
        this.onSelectedSignerParamUpdate(cb, connectedVM).then(
          () => {
            // do nothing
          },
          () => {
            console.log("Error in onSelectedSignerParamUpdate");
          }
        );
      }
    );
    const unsubAccFn = this.subscribeSelectedAccount((account) => {
      this.isSelectedAccountReceived = true;

      if (
        !account ||
        account?.address !== this.selectedSignerAccount?.address
      ) {
        this.selectedSignerAccount = account;
        this.onSelectedSignerParamUpdate(cb, connectedVM).then(
          () => {
            // do nothing
          },
          () => {
            console.log("Error in onSelectedSignerParamUpdate");
          }
        );
      }
    });

    return (): void => {
      unsubProvFn();
      unsubAccFn();
    };
  }

  public async getSelectedSigner(
    connectedVM: extLib.ReefVM = extLib.ReefVM.EVM
  ): Promise<extLib.ReefSignerResponse> {
    if (this.selectedSignerStatus) {
      return Promise.resolve({ ...this.selectedSignerStatus });
    }

    // when multiple initial calls are made save them to list and respond when ready
    const retPromise = new Promise<extLib.ReefSignerResponse>((resolve) => {
      this.resolvesList.push(resolve);
    });

    if (!this.isGetSignerMethodSubscribed) {
      this.isGetSignerMethodSubscribed = true;
      this.subscribeSelectedSigner((sig) => {
        if (!this.resolvesList.length) {
          return;
        }

        if (sig.status !== extLib.ReefSignerStatus.CONNECTING) {
          this.selectedSignerStatus = sig;
          this.resolvesList.forEach((resolve) => resolve({ ...sig }));
          this.resolvesList = [];
        }
      }, connectedVM);
    }

    return retPromise;
  }

  private async onSelectedSignerParamUpdate(
    cb: (reefSigner: extLib.ReefSignerResponse) => unknown,
    connectedVM: extLib.ReefVM
  ): Promise<void> {
    const selectedSigner = ReefSigner.createReefSigner(
      this.selectedSignerAccount,
      this.selectedProvider,
      this.extSigningKey
    );
    const hasVM = await ReefSigner.hasConnectedVM(connectedVM, selectedSigner);
    const responseStatus = this.getResponseStatus(
      selectedSigner,
      hasVM,
      connectedVM
    );

    if (responseStatus.status !== extLib.ReefSignerStatus.CONNECTING) {
      cb(responseStatus);
    }
  }

  private getResponseStatus(
    selectedSigner?: ReefVMSigner | undefined,
    hasVM?: boolean,
    requestedVM: extLib.ReefVM = extLib.ReefVM.NATIVE
  ): extLib.ReefSignerResponse {
    if (selectedSigner) {
      if (hasVM) {
        return {
          data: selectedSigner,
          status: extLib.ReefSignerStatus.OK,
          requestedVM,
        };
      } else {
        return {
          data: undefined,
          status: extLib.ReefSignerStatus.SELECTED_NO_VM_CONNECTION,
          requestedVM,
        };
      }
    } else if (this.selectedProvider && this.extSigningKey) {
      if (this.isSelectedAccountReceived && !this.selectedSignerAccount) {
        return {
          data: undefined,
          status: extLib.ReefSignerStatus.NO_ACCOUNT_SELECTED,
          requestedVM,
        };
      }
    }

    return {
      data: undefined,
      status: extLib.ReefSignerStatus.CONNECTING,
      requestedVM,
    };
  }

  private static createReefSigner(
    selectedSignerAccount?: extLib.InjectedAccount,
    selectedProvider?: Provider,
    extSigner?: SigningKey
  ): ReefVMSigner | undefined {
    return selectedSignerAccount && selectedProvider && extSigner
      ? new ReefVMSigner(
          selectedProvider,
          selectedSignerAccount.address,
          extSigner
        )
      : undefined;
  }

  private static async hasConnectedVM(
    connectedVM: extLib.ReefVM,
    signer?: ReefVMSigner
  ): Promise<boolean> {
    if (!signer) {
      return false;
    }

    return (
      !connectedVM ||
      (connectedVM === extLib.ReefVM.EVM && (await signer?.isClaimed()))
    );
  }
}
