import { createContext } from "react";

const noop = (): void => undefined;

const ActionContext = createContext<(to?: string) => void>(noop);

export { ActionContext };
