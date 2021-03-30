import { Context, createContext } from "react";

export const context: Context<{ [url: string]: any }> = (createContext as any)();
