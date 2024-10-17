import React from "react";
import LightText from "../../common/LightText";
import Uik from "@reef-chain/ui-kit";

interface Props {
  text?: string;
  className?: string;
}

export const Loading = ({ text, className }: Props): JSX.Element => {
  return (
    <div className={`flex justify-center align-middle ${className}`}>
      <Uik.Loading />
      <div className="ml-4">
        {text && <LightText text={text} />}
      </div>
    </div>
  );
};
