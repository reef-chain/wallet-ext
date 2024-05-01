// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AuthUrlInfo } from "../../extension-base/background/handlers/State";
import { Switch } from "../components/Switch";
import { useTheme } from "../context/ThemeContext";

interface Props {
  info: AuthUrlInfo;
  toggleAuth: (url: string) => void;
  removeAuth: (url: string) => void;
  url: string;
}

export const WebsiteEntry = ({
  info,
  removeAuth,
  toggleAuth,
  url,
}: Props): React.ReactElement<Props> => {
  const switchAccess = useCallback(() => {
    toggleAuth(url);
  }, [toggleAuth, url]);

  const removeAccess = useCallback(() => {
    removeAuth(url);
  }, [removeAuth, url]);

  const { isDarkMode } = useTheme();
  return (
    <div className="flex mb-3">
      <div className="flex-auto text-left">{url}</div>
      <Switch
        checked={info.isAllowed}
        onChange={switchAccess}
        text={info.isAllowed ? "Allowed" : "Blocked"}
      />
      <div>
        <FontAwesomeIcon
          onClick={removeAccess}
          className={`${isDarkMode ? "text--dark-mode" : "text-black"}
          hover:cursor-pointer`}
          icon={faTrash as IconProp}
        />
      </div>
    </div>
  );
};
