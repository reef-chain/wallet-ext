// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React from "react";

import { MetadataRequest } from "../../extension-base/background/types";
import Request from "./Request";

interface Props {
  requests: MetadataRequest[];
}

export const Metadata = ({ requests }: Props): JSX.Element => {
  return requests?.length ? (
    <>
      <div className="my-4">
        <span className="text-lg font-bold">Metadata</span>
      </div>
      <Request
        key={requests[0].id}
        metaId={requests[0].id}
        request={requests[0].request}
        url={requests[0].url}
      />
    </>
  ) : (
    <span>Loading...</span>
  );
};
