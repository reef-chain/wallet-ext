// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React from "react";

import { MetadataRequest } from "../../extension-base/background/types";
import Request from "./Request";
import { SectionTitle } from "../components/SectionTitle";
import { Loading } from "../components/Loading";

interface Props {
  requests: MetadataRequest[];
}

export const Metadata = ({ requests }: Props): JSX.Element => {
  return requests?.length ? (
    <>
      <SectionTitle text="Metadata" />
      <Request
        key={requests[0].id}
        metaId={requests[0].id}
        request={requests[0].request}
        url={requests[0].url}
      />
    </>
  ) : (
    <Loading text="Loading metadata requests..." />
  );
};
