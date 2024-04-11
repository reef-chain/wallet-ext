import React, { ChangeEventHandler } from "react";

interface Props {
  checked: boolean;
  textUnchecked?: string;
  onChange: ChangeEventHandler | undefined;
  text?: string;
  className?: string;
}

export const Switch = ({
  checked,
  onChange,
  text,
  className,
}: Props): JSX.Element => {
  return (
    <label
      className={`relative inline-flex items-center cursor-pointer mr-2
      ${className || ""}`}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div
        className={`w-9 h-5 bg-gray-200 rounded-full peer dark:bg-gray-500 peer-checked:after:translate-x-full 
        rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] 
        after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border 
        after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-200 peer-checked:bg-primary`}
      ></div>
      {text && (
        <span className="ms-2 text-gray-300 w-16 text-left">{text}</span>
      )}
    </label>
  );
};
