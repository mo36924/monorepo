import devServer from "./index";

devServer({ server: { input: process.argv[2] } });
