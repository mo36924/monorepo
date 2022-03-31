#!/usr/bin/env node
import esbuildNode from "./index";

esbuildNode(process.argv[2], process.argv.slice(3));
