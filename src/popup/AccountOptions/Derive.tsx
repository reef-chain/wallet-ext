import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { extension as extLib } from "@reef-chain/util-lib";

import { AccountsContext, ActionContext } from "../contexts";
import Account from "../Accounts/Account";
import {
  deriveAccount,
  validateAccount,
  validateDerivationPath,
} from "../messaging";
import AccountSelector from "../Accounts/AccountSelector";
import { SectionTitle } from "../components/SectionTitle";
import { ErrorMessage } from "../components/ErrorMessage";
import Uik from "@reef-chain/ui-kit";

interface Props {
  isLocked?: boolean;
}

const enum Step {
  FIRST,
  SECOND,
}

const enum Error {
  NONE,
  PARENT_PASSWORD_INCORRECT,
  DERIVATION_PATH_INVALID,
  NAME_TOO_SHORT,
  PASSWORD_TOO_SHORT,
  PASSWORDS_DO_NOT_MATCH,
}

export const Derive = ({ isLocked }: Props): JSX.Element => {
  const { address } = useParams();
  const { accounts } = useContext(AccountsContext);
  const onAction = useContext(ActionContext);

  const [step, setStep] = useState<Step>(Step.FIRST);
  const [error, setError] = useState<Error>(Error.NONE);
  const [parentAddress, setParentAddress] = useState<string>(address);
  const [parentAccount, setParentAccount] = useState<extLib.AccountJson>();
  const [availableAccounts, setAvailableAccounts] = useState<
    extLib.AccountJson[]
  >([]);
  const [account, setAccount] = useState<extLib.AccountJson>();
  const [parentPassword, setParentPassword] = useState<string>();
  const [derivationPath, setDerivationPath] = useState<string>();
  const [password, setPassword] = useState<string>("");
  const [passwordRepeat, setPasswordRepeat] = useState<string>("");
  const [nameTouched, setNameTouched] = useState<boolean>(false);
  const [passwordTouched, setPasswordTouched] = useState<boolean>(false);
  const [passwordRepeatTouched, setPasswordRepeatTouched] =
    useState<boolean>(false);

  useEffect(() => {
    if (accounts.length && parentAddress) {
      const parentAccount = accounts.find(
        (account) => account.address === parentAddress
      );
      if (parentAccount) {
        setParentAccount(parentAccount);
        const siblingsCount = accounts.filter(
          (account) => account.parentAddress === parentAddress
        ).length;
        setDerivationPath(`//${siblingsCount}`);
        const availableAccounts = accounts.filter(
          (account) => !account.isExternal
        );
        setAvailableAccounts(availableAccounts);
      }
    }
  }, [accounts, parentAddress]);

  const onParentPasswordChange = (password: string) => {
    setParentPassword(password);
    if (error === Error.PARENT_PASSWORD_INCORRECT) {
      setError(Error.NONE);
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

  const deriveCheck = async () => {
    const isUnlockable = await validateAccount(parentAddress, parentPassword);

    if (isUnlockable) {
      try {
        const account = await validateDerivationPath(
          parentAddress,
          derivationPath,
          parentPassword
        );

        setAccount({
          ...account,
          name: "<No Name>",
        });
        setStep(Step.SECOND);
      } catch (error) {
        setError(Error.DERIVATION_PATH_INVALID);
        console.error(error);
      }
    } else {
      setError(Error.PARENT_PASSWORD_INCORRECT);
    }
  };

  const create = async () => {
    try {
      await deriveAccount(
        parentAddress,
        account.suri,
        parentPassword,
        account.name,
        password
      );
      onAction("/");
    } catch (e) {
      console.error(e);
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

  return (
    <>
      <SectionTitle text="Create new account" />
      <div className="flex flex-col">
        {parentAccount && isLocked && <Account account={parentAccount} />}
        {parentAccount && !isLocked && (
          <AccountSelector
            accounts={availableAccounts}
            initialSelection={parentAccount}
            onAccountSelect={(account) => setParentAddress(account.address)}
          />
        )}
        {step === Step.FIRST && (
          <>
            <div className="flex flex-col items-start my-3">
              <Uik.Label text="Password for the account to derive from" />
              <Uik.Input
                className="text-primary rounded-md p-2 w-full"
                value={parentPassword}
                type="password"
                onChange={(e) => onParentPasswordChange(e.target.value)}
              />
              {error === Error.PARENT_PASSWORD_INCORRECT && (
                <ErrorMessage text="Wrong password" />
              )}
            </div>
            <div className="flex flex-col items-start my-3">
              <Uik.Label text="Derivation path" />
              <Uik.Input
                className="text-primary rounded-md p-2 w-full"
                value={derivationPath}
                onChange={(e) => setDerivationPath(e.target.value)}
              />
              {error === Error.DERIVATION_PATH_INVALID && (
                <ErrorMessage text="Invalid derivation path" />
              )}
            </div>
            <div>
              <Uik.Button onClick={() => deriveCheck()}
                disabled={
                  error !== Error.NONE || !parentPassword || !derivationPath
                } text={"Next Step"} icon={faArrowRight} />
            </div>
          </>
        )}
        {step === Step.SECOND && (
          <>
            <div className="flex flex-col items-start">
              <Uik.Label text="Name for the account" />
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
              <Uik.Label text="Password for the account" />
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
                <Uik.Label text="Repeat password" />
                <Uik.Input
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
              <Uik.Button
                className="flex justify-start items-center py-3 mr-3 hover:cursor-pointer"
                onClick={() => setStep(Step.FIRST)}
                icon={faArrowLeft}
                text="Previous step"
              />

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
