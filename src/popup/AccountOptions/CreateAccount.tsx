import React, { useContext, useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";

import {
  faArrowLeft,
  faArrowRight,
  faCopy,
  faExclamationTriangle,
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

const enum Error {
  NONE,
  NAME_TOO_SHORT,
  PASSWORD_TOO_SHORT,
  PASSWORDS_DO_NOT_MATCH,
}

export const CreateAccount = (): JSX.Element => {
  const onAction = useContext(ActionContext);
  const [step, setStep] = useState<Step>(Step.FIRST);
  const [error, setError] = useState<Error>(Error.NONE);
  const [account, setAccount] = useState<null | AccountJson>(null);
  const [password, setPassword] = useState<string>("");
  const [passwordRepeat, setPasswordRepeat] = useState<string>("");
  const [passwordTouched, setPasswordTouched] = useState<boolean>(false);
  const [passwordRepeatTouched, setPasswordRepeatTouched] =
    useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);

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

  const onNameChange = (name: string) => {
    setAccount({ ...account, name });
    if (name.length < 3) {
      setError(Error.NAME_TOO_SHORT);
    } else {
      setError(Error.NONE);
    }
  };

  const onPasswordChange = (password: string) => {
    setPassword(password);
    if (passwordTouched && password.length < 6) {
      setError(Error.PASSWORD_TOO_SHORT);
    } else {
      setError(Error.NONE);
    }
  };

  const onPasswordBlur = () => {
    setPasswordTouched(true);
    if (password.length < 6) {
      setError(Error.PASSWORD_TOO_SHORT);
    } else {
      setError(Error.NONE);
    }
  };

  const onPasswordRepeatChange = (passwordRepeat: string) => {
    setPasswordRepeat(passwordRepeat);
    if (passwordRepeatTouched && password !== passwordRepeat) {
      setError(Error.PASSWORDS_DO_NOT_MATCH);
    } else {
      setError(Error.NONE);
    }
  };

  const onPasswordRepeatBlur = () => {
    setPasswordRepeatTouched(true);
    if (password !== passwordRepeat) {
      setError(Error.PASSWORDS_DO_NOT_MATCH);
    } else {
      setError(Error.NONE);
    }
  };

  const create = async () => {
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
      <div className="flex flex-col">
        <Account account={account} className="w-full" />
        {step === Step.FIRST && (
          <>
            <div className="flex flex-col items-start">
              <label className="text-base">
                Generated 12-word mnemonic seed
              </label>
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
                  <label className="hover:cursor-pointer">
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
              <span className="text-justify">
                Please write down your wallet's mnemonic seed and keep it in a
                safe place. The mnemonic can be used to restore your wallet.
                Keep it carefully to not lose your assets.
              </span>
            </div>
            <div>
              <input
                type="checkbox"
                id="topping"
                name="topping"
                className="mr-2"
                checked={confirmed}
                onChange={() => setConfirmed(!confirmed)}
              />
              <span>I have saved my mnemonic seed safely.</span>
            </div>
            <div>
              <button
                className="flex justify-start items-center py-3 hover:cursor-pointer"
                onClick={() => setStep(Step.SECOND)}
                disabled={!confirmed}
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
              <label className="text-base">Name for the account</label>
              <input
                className="text-primary rounded-md p-2 w-full"
                value={account.name}
                onChange={(e) => onNameChange(e.target.value)}
              />
              {error === Error.NAME_TOO_SHORT && (
                <div className="text-red-500 mt-1">
                  <FontAwesomeIcon
                    className="mr-2"
                    icon={faExclamationTriangle as IconProp}
                  />
                  <span>Account name is too short</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-start my-3">
              <label className="text-base">Password for the account</label>
              <input
                className="text-primary rounded-md p-2 w-full"
                value={password}
                type="password"
                onChange={(e) => onPasswordChange(e.target.value)}
                onBlur={() => {
                  onPasswordBlur();
                }}
              />
              {error === Error.PASSWORD_TOO_SHORT && (
                <div className="text-red-500 mt-1">
                  <FontAwesomeIcon
                    className="mr-2"
                    icon={faExclamationTriangle as IconProp}
                  />
                  <span>Password is too short</span>
                </div>
              )}
            </div>
            {password.length >= 6 && (
              <div className="flex flex-col items-start">
                <label className="text-base">Repeat password</label>
                <input
                  className="text-primary rounded-md p-2 w-full"
                  value={passwordRepeat}
                  type="password"
                  onChange={(e) => onPasswordRepeatChange(e.target.value)}
                  onBlur={() => {
                    onPasswordRepeatBlur();
                  }}
                />
                {error === Error.PASSWORDS_DO_NOT_MATCH && (
                  <div className="text-red-500 mt-1">
                    <FontAwesomeIcon
                      className="mr-2"
                      icon={faExclamationTriangle as IconProp}
                    />
                    <span>Passwords do not match</span>
                  </div>
                )}
              </div>
            )}
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
                onClick={() => create()}
                disabled={
                  password === passwordRepeat &&
                  passwordRepeat.length > 5 &&
                  error === Error.NONE
                    ? false
                    : true
                }
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
