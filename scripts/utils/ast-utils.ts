import type { SgNode } from "@codemod.com/jssg-types/main";
import { findDefinition } from "./find-definition.ts";
import type TSX from "codemod:ast-grep/langs/tsx";
import type JS from "codemod:ast-grep/langs/javascript";

export function getDefaultExport<T extends TSX | JS>(
  program: SgNode<T, "program">
) {
  const arg = program
    .find({
      rule: {
        pattern: "export default $ARG",
      },
    })
    ?.getMatch("ARG");

  if (!arg) {
    return null;
  }

  if (arg.is("identifier")) {
    return findDefinition<T>(arg);
  }

  return arg;
}

export function isFunctionLike<T extends TSX | JS>(
  node: SgNode<T>
): node is SgNode<
  T,
  "function_declaration" | "function_expression" | "arrow_function"
> {
  return (
    node.is("function_declaration") ||
    node.is("arrow_function") ||
    node.is("function_expression")
  );
}
