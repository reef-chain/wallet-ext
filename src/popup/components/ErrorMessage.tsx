import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface Props {
  text: string;
  className?: string;
}

export const ErrorMessage = ({ text, className }: Props): JSX.Element => {
  return (
    <div
      className={`text-red-500 mt-1
      ${className || ""}`}
    >
      <FontAwesomeIcon
        className="mr-2"
        icon={faExclamationTriangle as IconProp}
      />
      <span>{text}</span>
    </div>
  );
};
