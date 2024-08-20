// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from "react";

import { approveAuthRequest, rejectAuthRequest } from "../messaging";
import { RequestAuthorizeTab } from "../../extension-base/background/types";
import { WarnMessage } from "../components/WarnMessage";
import Uik from "@reef-chain/ui-kit";
import strings from "../../i18n/locales";
import LightText from "../../common/LightText";
import { useTheme } from "../context/ThemeContext";

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

  const { isDarkMode } = useTheme();

  return (
    <div className="authorize-message">
      <div className="text-left">
        <LightText text={`${strings.an_app_self_identitifying} ${origin} ${strings.is_req_acc_from}`} />

        <a href={url} target="_blank" className="underline">
          <LightText text={url} />
        </a>

      </div>
      <WarnMessage text={strings.only_approve_trusted} isDarkMode={isDarkMode} />
      <div className="flex">
        <Uik.Button onClick={_onApprove} text={strings.yes_allow} fill />
        <Uik.Button onClick={_onReject} text={strings.reject} />
      </div>
    </div>
  );
}

export default Request;
