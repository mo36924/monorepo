import { useReducer } from "react";

const reducer = (x: number) => x + 1;

export const useForceUpdate = (): (() => void) => useReducer(reducer, 0)[1];
