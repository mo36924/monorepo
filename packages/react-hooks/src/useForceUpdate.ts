import { useReducer } from "react";

const reducer = (x: number) => x + 1;

export default (): (() => void) => useReducer(reducer, 0)[1] as any;
