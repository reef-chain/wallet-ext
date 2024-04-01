import React, { useCallback, useContext, useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";

import {
  faArrowAltCircleLeft,
  faArrowAltCircleRight,
  faArrowLeft,
  faArrowRight,
  faCirclePlus,
  faCodeBranch,
  faCopy,
  faExclamationTriangle,
  faFileArrowUp,
  faFileExport,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import Account from "../Accounts/Account";
import { AccountJson } from "../../extension-base/background/types";
import { createAccountSuri, createSeed } from "../messaging";
import { ActionContext } from "../contexts";

const enum Step {
  FIRST,
  SECOND,
}

// TODO: Show errors
// - Account name is too short
// - Password is too short
// - Passwords do not match

export const CreateAccount = (): JSX.Element => {
  const onAction = useContext(ActionContext);
  const [step, setStep] = useState<Step>(Step.FIRST);
  const [account, setAccount] = useState<null | AccountJson>(null);
  const [password, setPassword] = useState<string>("");
  const [passwordRepeat, setPasswordRepeat] = useState<string>("");

  useEffect(() => {
    createSeed()
      .then(({ address, seed }): void => {
        setAccount({
          address,
          suri: seed,
          name: "<No Name>",
        });
      })
      .catch(console.error);
  }, []);

  const create = async () => {
    if (!account || !password) return;
    try {
      await createAccountSuri(account.name, password, account.suri);
      onAction(`/bind?bindAddress=${account.address}`);
    } catch (e) {
      console.error(e);
    }
  };

  return account ? (
    <>
      <div className="mt-4">
        <span className="text-lg font-bold">Create an account</span>
      </div>
      <div className="flex flex-col text-base">
        <Account account={account} />
        {step === Step.FIRST && (
          <>
            <div className="flex flex-col items-start">
              <label>GENERATED 12-WORD MNEMONIC SEED</label>
              <textarea className="w-full p-3 rounded-lg bg-zinc-950 border-gray-600 text-primary">
                {account.suri}
              </textarea>
              <CopyToClipboard
                text={account.suri}
                className="hover:cursor-pointer ml-1"
              >
                <div title={account.suri}>
                  <FontAwesomeIcon
                    className="mr-2"
                    icon={faCopy as IconProp}
                    size="sm"
                  />
                  <label className="text-sm hover:cursor-pointer">
                    Copy to clipboard
                  </label>
                </div>
              </CopyToClipboard>
            </div>
            <div className="flex my-3">
              <FontAwesomeIcon
                className="text-primary mr-2 pt-1"
                icon={faExclamationTriangle as IconProp}
              />
              <span className="text-sm text-justify">
                Please write down your wallet's mnemonic seed and keep it in a
                safe place. The mnemonic can be used to restore your wallet.
                Keep it carefully to not lose your assets.
              </span>
            </div>
            <div className="flex flex-col my-3 items-start text-sm">
              <span>I have saved my mnemonic seed safely.</span>
            </div>
            <div>
              <button
                className="flex justify-start items-center py-3 hover:cursor-pointer"
                onClick={() => setStep(Step.SECOND)}
              >
                <span className="mr-3">Next step</span>
                <FontAwesomeIcon icon={faArrowRight as IconProp} />
              </button>
            </div>
          </>
        )}
        {step === Step.SECOND && (
          <>
            <div className="flex flex-col items-start">
              <label>NAME FOR THE ACCOUNT</label>
              <input
                className="text-sm text-primary rounded-md p-2 w-full"
                value={account.name}
                onChange={(e) =>
                  setAccount({ ...account, name: e.target.value })
                }
                // onBlur={() => {
                //   editAccount(account.address, name);
                //   setIsEditingName(false);
                // }}
              />
            </div>
            <div className="flex flex-col items-start my-3">
              <label>PASSWORD FOR THE ACCOUNT</label>
              <input
                className="text-sm text-primary rounded-md p-2 w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col items-start">
              <label>REPEAT PASSWORD</label>
              <input
                className="text-sm text-primary rounded-md p-2 w-full"
                value={passwordRepeat}
                onChange={(e) => setPasswordRepeat(e.target.value)}
              />
            </div>
            <div className="flex mt-3">
              <button
                className="flex justify-start items-center py-3 mr-3 hover:cursor-pointer"
                onClick={() => setStep(Step.FIRST)}
              >
                <FontAwesomeIcon icon={faArrowLeft as IconProp} />
                <span className="ml-3">Previous step</span>
              </button>
              <button
                className="flex justify-start items-center py-3 hover:cursor-pointer"
                onClick={() => create}
              >
                <span className="mr-3">Add account</span>
                <FontAwesomeIcon icon={faArrowRight as IconProp} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  ) : (
    <span>Generating new account...</span>
  );
};
