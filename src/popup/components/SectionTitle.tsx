import React, { useContext } from "react";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

import { ActionContext } from "../contexts";
import Uik from "@reef-chain/ui-kit";
import { useTheme } from "../context/ThemeContext";

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
      <Uik.Button className={`${isDarkMode ? 'dark-btn' : ""} absolute right-10 `} onClick={() => onAction("/")} icon={faCircleXmark} />
    </div>
  );
};
