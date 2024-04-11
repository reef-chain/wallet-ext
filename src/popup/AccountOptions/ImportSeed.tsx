import React, { useContext, useState } from "react";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { extension as extLib } from "@reef-chain/util-lib";

import Account from "../Accounts/Account";
import { createAccountSuri, validateSeed } from "../messaging";
import { ActionContext } from "../contexts";
import { SectionTitle } from "../components/SectionTitle";
import { ErrorMessage } from "../components/ErrorMessage";

const enum Step {
  FIRST,
  SECOND,
}

const enum Error {
  NONE,
  NAME_TOO_SHORT,
  PASSWORD_TOO_SHORT,
  PASSWORDS_DO_NOT_MATCH,
  INVALID_SEED,
}

export const ImportSeed = (): JSX.Element => {
  const onAction = useContext(ActionContext);
  const [step, setStep] = useState<Step>(Step.FIRST);
  const [error, setError] = useState<Error>(Error.NONE);
  const [seed, setSeed] = useState<string>("");
  const [account, setAccount] = useState<null | extLib.AccountJson>(null);
  const [password, setPassword] = useState<string>("");
  const [passwordRepeat, setPasswordRepeat] = useState<string>("");
  const [nameTouched, setNameTouched] = useState<boolean>(false);
  const [passwordTouched, setPasswordTouched] = useState<boolean>(false);
  const [passwordRepeatTouched, setPasswordRepeatTouched] =
    useState<boolean>(false);

  const onSeedChange = async (seed: string) => {
    setSeed(seed);
    try {
      const validatedAccount = await validateSeed(seed);
      setAccount({
        address: validatedAccount.address,
        suri: seed,
        name: "<No Name>",
      });
      setError(Error.NONE);
    } catch (e) {
      setAccount(null);
      setError(Error.INVALID_SEED);
    }
  };

  const onNameChange = (name: string) => {
    setAccount({ ...account, name });
    if (nameTouched && name.length < 3) {
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

  const onNameBlur = () => {
    setNameTouched(true);
    if (account.name.length < 3) {
      setError(Error.NAME_TOO_SHORT);
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
      onAction("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <SectionTitle text="Import account" />
      <div className="flex flex-col">
        {account && <Account account={account} showCopyAddress={true} />}
        {step === Step.FIRST && (
          <>
            <div className="flex flex-col items-start my-3">
              <label className="text-base">
                Existing 12 or 24-word mnemonic seed
              </label>
              <textarea
                className="w-full p-3 rounded-lg bg-zinc-950 border-gray-600 text-primary"
                value={seed}
                onChange={(e) => onSeedChange(e.target.value)}
              />
              {error === Error.INVALID_SEED && (
                <ErrorMessage text="Invalid mnemonic seed" />
              )}
            </div>
            <div>
              <button
                className="flex justify-start items-center py-3 hover:cursor-pointer"
                onClick={() => setStep(Step.SECOND)}
                disabled={!seed.length || error !== Error.NONE}
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
                onBlur={() => {
                  onNameBlur();
                }}
              />
              {error === Error.NAME_TOO_SHORT && (
                <ErrorMessage text="Account name is too short" />
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
                <ErrorMessage text="Password is too short" />
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
                  <ErrorMessage text="Passwords do not match" />
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
  );
};
