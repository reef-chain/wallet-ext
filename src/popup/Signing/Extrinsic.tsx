// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  Call,
  ExtrinsicEra,
  ExtrinsicPayload,
} from "@polkadot/types/interfaces";
import type { AnyJson, SignerPayloadJSON } from "@polkadot/types/types";
import { bnToBn, formatNumber } from "@polkadot/util";
import BN from "bn.js";

import { Chain } from "../../chains/types";
import useMetadata from "../hooks/useMetadata";
import { PORT_EXTENSION } from "../../extension-base/defaults";
import { useTheme } from "../context/ThemeContext";
import { transactionUtils } from "@reef-chain/util-lib";
import { ProviderContext } from "../contexts";

interface Decoded {
  args: AnyJson | null;
  method: Call | null;
}

interface Props {
  payload: ExtrinsicPayload;
  request: SignerPayloadJSON;
  url: string;
}

function displayDecodeVersion(
  message: string,
  chain: Chain,
  specVersion: BN
): string {
  return `${message}: chain=${chain.name
    }, specVersion=${chain.specVersion.toString()} (request specVersion=${specVersion.toString()})`;
}

function decodeMethod(data: string, chain: Chain, specVersion: BN): Decoded {
  let args: AnyJson | null = null;
  let method: Call | null = null;

  try {
    if (specVersion.eqn(chain.specVersion)) {
      method = chain.registry.createType("Call", data);
      args = (method.toHuman() as { args: AnyJson }).args;
    } else {
      console.log(
        displayDecodeVersion("Outdated metadata to decode", chain, specVersion)
      );
    }
  } catch (error) {
    console.error(
      `${displayDecodeVersion("Error decoding method", chain, specVersion)}:: ${(error as Error).message
      }`
    );

    args = null;
    method = null;
  }

  return { args, method };
}

function renderMethod(
  data: string,
  { args, method }: Decoded
): React.ReactNode {
  if (!args || !method) {
    return (
      <table className="flex">
        <tbody>
          <tr>
            <td className="extrinsic-table-label">Method data</td>
            <td className="pl-4">{data}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="flex">
      <tbody>
        <tr>
          <td className="extrinsic-table-label">Method</td>
          <td className="pl-4">
            <details>
              <summary>
                {method.section}.{method.method}
                {method.meta
                  ? `(${method.meta.args.map(({ name }) => name).join(", ")})`
                  : ""}
              </summary>
              <pre>{JSON.stringify(args, null, 2)}</pre>
            </details>
          </td>
        </tr>
        {method.meta && (
          <tr>
            <td className="extrinsic-table-label">Info</td>
            <td className="pl-4">
              <details>
                <summary>
                  {method.meta.docs.map((d) => d.toString().trim()).join(" ")}
                </summary>
              </details>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function mortalityAsString(era: ExtrinsicEra, hexBlockNumber: string): string {
  if (era.isImmortalEra) {
    return "immortal";
  }

  const blockNumber = bnToBn(hexBlockNumber);
  const mortal = era.asMortalEra;

  return `mortal, valid from ${formatNumber(
    mortal.birth(blockNumber)
  )} to ${formatNumber(mortal.death(blockNumber))}`;
}

function Extrinsic({
  payload: { era, nonce, tip },
  request: { blockNumber, genesisHash, method, specVersion: hexSpec },
  url,
}: Props): React.ReactElement<Props> {
  const chain = useMetadata(genesisHash);
  const [signatureResponse, setSignatureResponse] = useState<any>();
  const specVersion = useRef(bnToBn(hexSpec)).current;
  const provider = useContext(ProviderContext);
  const decoded = useMemo(
    () => {
      let res = chain && chain.hasMetadata
        ? decodeMethod(method, chain, specVersion)
        : { args: null, method: null };

      return res;
    },
    [method, chain, specVersion]
  );


  useEffect(() => {
    const decodeMethod = async () => {
      if (provider) {
        const res = await transactionUtils.decodePayloadMethod(provider, method);
        setSignatureResponse(res);
      }
    }
    decodeMethod();
  }, [provider])

  const { isDarkMode } = useTheme();
  return (
    <table className={`flex overflow-x-scroll ${isDarkMode ? "" : "text-black"} extrinsic-data-table`}>
      <tbody>
        {url !== PORT_EXTENSION && (
          <tr>
            <td className="extrinsic-table-label">From</td>
            <td className="pl-4">{url}</td>
          </tr>
        )}
        <tr>
          <td className="extrinsic-table-label">{chain ? "Chain" : "Genesis"}</td>
          <td className="pl-4">{chain ? chain.name : genesisHash}</td>
        </tr>
        <tr>
          <td className="extrinsic-table-label">Version</td>
          <td className="pl-4">{specVersion.toNumber()}</td>
        </tr>
        <tr>
          <td className="extrinsic-table-label">Nonce</td>
          <td className="pl-4">{formatNumber(nonce)}</td>
        </tr>
        {signatureResponse?.info && <tr>
          <td className="extrinsic-table-label">Info</td>
          <td className="pl-4">{signatureResponse.info}</td>
        </tr>}
        {signatureResponse?.methodName && <tr>
          <td className="extrinsic-table-label">Method Name</td>
          <td className="pl-4">{signatureResponse.methodName.split("(")[0]}</td>
        </tr>}
        {signatureResponse?.args &&
          Object.entries(signatureResponse?.args).map(([key, value]) => (
            <tr key={key}>
              <td className="extrinsic-table-label">{key}</td>
              <td className="pl-4">{typeof value == "object" ?
                Object.entries(value).map(([k, val]) => (
                  <tr key={k}>
                    <td className="extrinsic-table-label">{k}</td>
                    <td className="pl-4">{val.toString()}</td>
                  </tr>
                ))
                : value.toString()
              }</td>
            </tr>
          ))

        }
        {!tip.isEmpty && (
          <tr>
            <td className="extrinsic-table-label">Tip</td>
            <td className="pl-4">{formatNumber(tip)}</td>
          </tr>
        )}
        {renderMethod(method, decoded)}
        <tr>
          <td className="extrinsic-table-label">Lifetime</td>
          <td className="pl-4">{mortalityAsString(era, blockNumber)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default React.memo(Extrinsic);
