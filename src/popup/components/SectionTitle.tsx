import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { ActionContext } from "../contexts";
import Uik from "@reef-chain/ui-kit";

interface Props {
  text: string;
  className?: string;
}

export const SectionTitle = ({ text, className }: Props): JSX.Element => {
  const onAction = useContext(ActionContext);

  return (
    <div
      className={`mb-2 text-center text-lg font-bold relative flex
      ${className || ""}`}
      style={{
        alignItems: 'center'
      }}
    >
      <Uik.Text text={text} type="light" className="text-white" />
      <Uik.Button className="dark-btn" onClick={() => onAction("/")} icon={faCircleXmark} />
    </div>
  );
};
