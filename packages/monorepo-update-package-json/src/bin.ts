#!/usr/bin/env node
import { exit } from "process";
import index from "./index";

index().catch((e) => {
  console.error(e);
  exit(1);
});
