import type { LanguageService } from "typescript/lib/tsserverlibrary";

export const sourceFile = (languageService: LanguageService, fileName: string) =>
  languageService.getProgram()?.getSourceFile(fileName);
