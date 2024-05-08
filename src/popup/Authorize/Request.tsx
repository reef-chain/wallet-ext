// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from "react";

import { approveAuthRequest, rejectAuthRequest } from "../messaging";
import { RequestAuthorizeTab } from "../../extension-base/background/types";
import { WarnMessage } from "../components/WarnMessage";
import Uik from "@reef-chain/ui-kit";
import strings from "../../i18n/locales";

interface Props {
  authId: string;
  request: RequestAuthorizeTab;
  url: string;
}

function Request({
  authId,
  request: { origin },
  url,
}: Props): React.ReactElement<Props> {
  const _onApprove = useCallback(
    () =>
      approveAuthRequest(authId).catch((error: Error) => console.error(error)),
    [authId]
  );

  const _onReject = useCallback(
    () =>
      rejectAuthRequest(authId).catch((error: Error) => console.error(error)),
    [authId]
  );

  return (
    <>
      <div className="text-left">
        {strings.an_app_self_identitifying}<span className="">{origin}</span>{" "}
        {strings.is_req_acc_from}{" "}
        <a href={url} target="_blank" className="underline">
          <span className="">{url}</span>
        </a>
        .
      </div>
      <WarnMessage text={strings.only_approve_trusted} />
      <div className="flex">
        <Uik.Button onClick={_onApprove} text={strings.yes_allow} fill />
        <Uik.Button onClick={_onReject} text={strings.reject} />
      </div>
    </>
  );
}

export default Request;
