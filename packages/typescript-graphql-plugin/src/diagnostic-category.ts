import type typescript from "typescript/lib/tsserverlibrary";
import { DiagnosticSeverity } from "vscode-languageserver-types";

export const diagnosticCategory = (ts: typeof typescript, severity?: number) => {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return ts.DiagnosticCategory.Error;
    case DiagnosticSeverity.Warning:
      return ts.DiagnosticCategory.Warning;
    case DiagnosticSeverity.Information:
      return ts.DiagnosticCategory.Message;
    case DiagnosticSeverity.Hint:
      return ts.DiagnosticCategory.Suggestion;
    default:
      return ts.DiagnosticCategory.Error;
  }
};
