// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from "react";

import RequestIndex from "../RequestIndex";
import Request from "./Request";
import { AuthorizeRequest } from "../../extension-base/background/types";
import { Loading } from "../components/Loading";
import strings from "../../i18n/locales";
import LightText from "../../common/LightText";

interface Props {
  requests: AuthorizeRequest[];
}

export const Authorize = ({ requests }: Props): JSX.Element => {
  const [requestIndex, setRequestIndex] = useState(0);

  const _onNextClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex + 1),
    []
  );

  const _onPreviousClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex - 1),
    []
  );

  useEffect(() => {
    setRequestIndex((requestIndex) =>
      requestIndex < requests.length ? requestIndex : requests.length - 1
    );
  }, [requests]);

  return requests.length && requests[requestIndex] ? (
    <>
      <div className="mb-2 text-center text-lg font-bold">
        <LightText text={strings.authorize} />
        {requests.length > 1 && (
          <RequestIndex
            index={requestIndex}
            onNextClick={_onNextClick}
            onPreviousClick={_onPreviousClick}
            totalItems={requests.length}
          />
        )}
      </div>
      <Request
        authId={requests[requestIndex].id}
        request={requests[requestIndex].request}
        key={requests[requestIndex].id}
        url={requests[requestIndex].url}
      />
    </>
  ) : (
    <Loading text={strings.loading_auth_requests} />
  );
};
