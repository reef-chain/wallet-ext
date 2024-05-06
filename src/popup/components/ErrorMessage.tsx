import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useTheme } from "../context/ThemeContext";

interface Props {
  text: string;
  className?: string;
}

export const ErrorMessage = ({ text, className }: Props): JSX.Element => {
  const { isDarkMode } = useTheme();
  return (
    <div
      className={`text-red-500 mt-1
      ${className || ""}`}
    >
      <FontAwesomeIcon
        className={`${isDarkMode ? "text--dark-mode" : "text-black"} mr-2`}
        icon={faExclamationTriangle as IconProp}
      />
      <span>{text}</span>
    </div>
  );
};
