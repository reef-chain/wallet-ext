import React, { useContext, useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import {
  faArrowLeft,
  faArrowRight,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { extension as extLib } from "@reef-chain/util-lib";

import Account from "../Accounts/Account";
import { createAccountSuri, createSeed } from "../messaging";
import { ActionContext } from "../contexts";
import { SectionTitle } from "../components/SectionTitle";
import { WarnMessage } from "../components/WarnMessage";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loading } from "../components/Loading";
import Uik from "@reef-chain/ui-kit";
import strings from "../../i18n/locales";
import { useTheme } from "../context/ThemeContext";
import Checkbox from "../../common/Checkbox";
import LightText from "../../common/LightText";

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
  const [account, setAccount] = useState<extLib.AccountJson>();
  const [password, setPassword] = useState<string>("");
  const [passwordRepeat, setPasswordRepeat] = useState<string>("");
  const [nameTouched, setNameTouched] = useState<boolean>(false);
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
          name: "",
        });
      })
      .catch(console.error);
  }, []);

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
      onAction(`/bind/${account.address}`);
    } catch (e) {
      console.error(e);
    }
  };

  const { isDarkMode } = useTheme();
  return account ? (
    <>
      <SectionTitle text="Create an account" />
      <div className="flex flex-col">
        <Account account={account} showCopyAddress={true} className="account-box-padding" />
        {step === Step.FIRST && (
          <>
            <div className="flex flex-col items-start py-2">
              <Uik.Text type="light" className={`${isDarkMode ? "text--dark-mode" : ""} mb-4`} text={strings.generated_12_words} />
              <textarea
                className={`w-full p-5 rounded-lg ${isDarkMode ? 'bg-zinc-950' : 'bg-white'} border-gray-600 text-primary`}
                readOnly
              >
                {account.suri}
              </textarea>
              <CopyToClipboard
                text={account.suri}
                className="hover:cursor-pointer ml-1 py-2 flex"
              >
                <div title={account.suri} >
                  <FontAwesomeIcon
                    className={`${isDarkMode ? "text--dark-mode" : "text-[#8f8f8f]"} mr-2`}
                    icon={faCopy as IconProp}
                    size="sm"
                  />
                  <Uik.Text text={strings.copy_to_clipboard} type="mini" className={`${isDarkMode ? "text--dark-mode" : ""}  hover:cursor-pointer`} />
                </div>
              </CopyToClipboard>
            </div>
            <WarnMessage className="py-1" isDarkMode={isDarkMode}
              text={strings.please_write_down}
            />
            <div className="flex align-middle items-center">
              <Checkbox
                value={confirmed}
                onChange={() => setConfirmed(!confirmed)}
                isDarkMode={isDarkMode}
              />
              <Uik.Text text={strings.i_have_saved_mnemonic} type="mini" className={`${isDarkMode ? "text--dark-mode" : ""}`} />

            </div>
            <div>
              <Uik.Button onClick={() => setStep(Step.SECOND)} text={strings.next_step} icon={faArrowRight} fill />
            </div>
          </>
        )}
        {step === Step.SECOND && (
          <>
            <div className="flex flex-col items-start">
              <LightText className={`ml-5`} text={strings.name_for_the_acc} />
              <Uik.Input
                className="text-primary rounded-md p-2 w-full"
                value={account.name}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={() => {
                  onNameBlur();
                }}
              />
              {error === Error.NAME_TOO_SHORT && (
                <ErrorMessage text={strings.acc_name_too_short} />
              )}
            </div>
            <div className="flex flex-col items-start my-3">
              <LightText className={`ml-5`} text={strings.pass_for_acc} />
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
                <ErrorMessage text={strings.pass_too_short} />
              )}
            </div>
            {password.length >= 6 && (
              <div className="flex flex-col items-start">
                <Uik.Text type="light" className={`ml-5 ${isDarkMode ? "text--dark-mode" : ""}`} text={strings.repeat_password} />
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
                  <ErrorMessage text={strings.pass_dont_match} />
                )}
              </div>
            )}
            <div className="flex mt-3">
              <Uik.Button
                className="flex justify-start items-center py-3 mr-3 hover:cursor-pointer"
                onClick={() => setStep(Step.FIRST)}
                icon={faArrowLeft}
                text={strings.prev_step}
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
                text={strings.add_acc}
                fill
              />

            </div>
          </>
        )}
      </div>
    </>
  ) : (
    <Loading text={strings.generating_new_acc} />
  );
};
