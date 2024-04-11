import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { ActionContext } from "../contexts";

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
