import type ts from "typescript/lib/tsserverlibrary";

const init: ts.server.PluginModuleFactory = (mod) => {
  return {
    create(info) {
      let languageService = info.languageService;
      const proxy: ts.LanguageService = Object.create(null);

      for (const [key, value] of Object.entries(languageService)) {
        (proxy as any)[key] = value.bind(languageService);
      }

      proxy.getQuickInfoAtPosition = (...args) => languageService.getQuickInfoAtPosition(...args);
      proxy.getCompletionsAtPosition = (...args) => languageService.getCompletionsAtPosition(...args);
      proxy.getSemanticDiagnostics = (...args) => languageService.getSemanticDiagnostics(...args);

      import("./plugin").then(({ default: init }) => {
        languageService = init(mod).create(info);
      });

      return proxy;
    },
  };
};

if (typeof module !== "undefined" && typeof exports !== "undefined") {
  module.exports = Object.assign(init, exports);
}
