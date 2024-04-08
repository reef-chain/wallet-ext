import React, { useContext } from "react";
import { useParams } from "react-router";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import Account from "../Accounts/Account";
import { forgetAccount } from "../messaging";
import { AccountsContext, ActionContext } from "../contexts";

export const Forget = (): JSX.Element => {
  const { address } = useParams();
  const { accounts } = useContext(AccountsContext);
  const onAction = useContext(ActionContext);

  const name =
    accounts.find((account) => account.address === address)?.name || "";

  const forget = async () => {
    try {
      await forgetAccount(address);
      onAction("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="text-center text-lg font-bold">Forget account</div>
      <div className="flex flex-col">
        <Account account={{ address, name }} />
        <div className="flex mb-4 border-l-primary border-l-4 pl-2">
          <FontAwesomeIcon
            className="text-primary mr-2 pt-1"
            icon={faExclamationTriangle as IconProp}
          />
          <span className="text-left text-gray-300">
            You are about to remove the account. This means that you will not be
            able to access it via this extension anymore. If you wish to recover
            it, you would need to use the seed.
          </span>
        </div>
        <button onClick={() => forget()}>Forget account</button>
      </div>
    </>
  );
};
