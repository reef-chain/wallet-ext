import React, { useContext } from "react";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

import { ActionContext } from "../contexts";
import Uik from "@reef-chain/ui-kit";
import { useTheme } from "../context/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface Props {
  text: string;
  className?: string;
}

export const SectionTitle = ({ text, className }: Props): JSX.Element => {
  const onAction = useContext(ActionContext);
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`mb-2 text-center text-lg font-bold relative flex 
      ${className || ""}`}
      style={{
        alignItems: 'center'
      }}
    >
      <Uik.Text text={text} type="title" className={`text-white ${isDarkMode ? "text--dark-mode" : ""}`} />

      <FontAwesomeIcon
        className=" text-gray-500 absolute right-0 hover:text-gray-300 cursor-pointer"
        onClick={() => onAction("/")}
        icon={faCircleXmark as IconProp}
        size="lg"
      />
    </div>
  );
};
