import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface Props {
  text: string;
  className?: string;
}

export const WarnMessage = ({ text, className }: Props): JSX.Element => {
  return (
    <div
      className={`flex my-3 border-l-primary border-l-4 pl-2
      ${className || ""}`}
    >
      <FontAwesomeIcon
        className="text-primary mr-2 pt-1"
        icon={faExclamationTriangle as IconProp}
      />
      <span className="text-left text-gray-300">{text}</span>
    </div>
  );
};
