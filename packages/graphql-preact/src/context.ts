import { Context, createContext } from "preact";

export const context: Context<{ [url: string]: any }> = (createContext as any)();
