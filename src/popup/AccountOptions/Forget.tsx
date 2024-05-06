import React, { useContext } from "react";
import { useParams } from "react-router";

import Account from "../Accounts/Account";
import { forgetAccount } from "../messaging";
import { AccountsContext, ActionContext } from "../contexts";
import { SectionTitle } from "../components/SectionTitle";
import { WarnMessage } from "../components/WarnMessage";
import strings from "../../i18n/locales";

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
      <SectionTitle text={strings.forget_account} />
      <div className="flex flex-col">
        <Account account={{ address, name }} showCopyAddress={true} />
        <WarnMessage
          text={strings.remove_the_account}
        />
        <button onClick={() => forget()}>{strings.forget_account}</button>
      </div>
    </>
  );
};
