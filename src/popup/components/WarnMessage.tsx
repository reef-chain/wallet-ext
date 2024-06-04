import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import Uik from "@reef-chain/ui-kit";

interface Props {
  text: string;
  className?: string;
  isDarkMode?: boolean;
}

export const WarnMessage = ({ text, className, isDarkMode }: Props): JSX.Element => {
  return (
    <div
      className={`flex my-3 border-l-primary border-l-4 pl-2
      ${className || ""}`}
    >
      <FontAwesomeIcon
        className="text-primary mr-2 pt-1"
        icon={faExclamationTriangle as IconProp}
      />
      <Uik.Text text={text} type="mini" className={`${isDarkMode ? "text--dark-mode" : ""} text-left`} />
    </div>
  );
};
