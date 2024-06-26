// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo } from "react";
import { isAscii, u8aToString, u8aUnwrapBytes } from "@polkadot/util";
import { useTheme } from "../context/ThemeContext";

interface Props {
  bytes: string;
  url: string;
}

function Bytes({ bytes, url }: Props): React.ReactElement<Props> {
  const text = useMemo(
    () => (isAscii(bytes) ? u8aToString(u8aUnwrapBytes(bytes)) : bytes),
    [bytes]
  );

  const { isDarkMode } = useTheme();

  return (
    <table className={isDarkMode ? "flex" : "text-black flex"}>
      <tbody>
        <tr>
          <td className="label">From</td>
          <td className="pl-4">{url}</td>
        </tr>
        <tr>
          <td className="label">Bytes</td>
          <td className="pl-4">{text}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default React.memo(Bytes);
