// Adapted from @polkadot/extension-ui (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from "react";

import {
  getAuthList,
  removeAuthorization,
  toggleAuthorization,
} from "./messaging";
import { WebsiteEntry } from "./AuthManagement/WebsiteEntry";
import {
  AuthUrlInfo,
  AuthUrls,
} from "../extension-base/background/handlers/State";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { ActionContext } from "./contexts";

interface Props {
  text: string;
  className?: string;
}

export const SectionTitle = ({ text, className }: Props): JSX.Element => {
  const onAction = useContext(ActionContext);

  return (
    <div
      className={`mb-2 text-center text-lg font-bold relative
      ${className || ""}`}
    >
      <span>{text}</span>
      <FontAwesomeIcon
        icon={faCircleXmark as IconProp}
        onClick={() => onAction("/")}
        className="text-primary cursor-pointer hover:opacity-75 mt-1 text-xl absolute right-0"
      />
    </div>
  );
};
