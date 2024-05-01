import React, { useContext, useState } from "react";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { extension as extLib } from "@reef-chain/util-lib";

import Account from "../Accounts/Account";
import { createAccountSuri, validateSeed } from "../messaging";
import { ActionContext } from "../contexts";
import { SectionTitle } from "../components/SectionTitle";
import { ErrorMessage } from "../components/ErrorMessage";
import Uik from "@reef-chain/ui-kit";

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
        name: "",
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

              <Uik.Label text="Existing 12 or 24-word mnemonic seed" className="mb-3" />
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
              <Uik.Button onClick={() => setStep(Step.SECOND)}
                disabled={!seed.length || error !== Error.NONE} text={"Next Step"} icon={faArrowRight} />
            </div>
          </>
        )}
        {step === Step.SECOND && (
          <>
            <div className="flex flex-col items-start">
              <label>Name for the account</label>
              <Uik.Input
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
              <label>Password for the account</label>
              <Uik.Input
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
                <label>Repeat password</label>
                <Uik.Input
                  className="text-primary rounded-md p-2 w-full text-white"
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
              <Uik.Button className="flex justify-start items-center py-3 mr-3 hover:cursor-pointer"
                onClick={() => setStep(Step.FIRST)} icon={faArrowLeft} text="Previous step" />
              <Uik.Button
                className="flex justify-start items-center py-3 hover:cursor-pointer"
                onClick={create}
                disabled={
                  password !== passwordRepeat ||
                  passwordRepeat.length <= 5 ||
                  error !== Error.NONE
                }
                icon={faArrowRight}
                text="Add account"
                fill
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};
