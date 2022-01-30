#!/usr/bin/env node
import { argv, exit } from "process";
import index from "./index";

index(argv[2]).catch((e) => {
  console.error(e);
  exit(1);
});
