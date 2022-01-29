#!/usr/bin/env node
import index from "./index";

index().catch((e) => {
  console.error(e);
  process.exit(1);
});
