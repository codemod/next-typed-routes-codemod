import type { SgNode } from "codemod:ast-grep";
import type JS from "codemod:ast-grep/langs/javascript";
import type TSX from "codemod:ast-grep/langs/tsx";

export function findDefinition<T extends JS | TSX>(
  identifier: SgNode<T, "identifier">,
  name = identifier.text()
): SgNode<T> | null {
  let currentNode = identifier.parent();

  while (currentNode) {
    const definition = findDefinitionInScope<T>(currentNode, name);
    if (definition) {
      return definition;
    }

    currentNode = currentNode.parent();
  }

  return null;
}

function findDefinitionInScope<T extends JS | TSX>(
  scope: SgNode<T>,
  name: string
): SgNode<T> | null {
  // 1. Check for import statements
  const imports = scope.findAll({
    rule: {
      any: [
        { pattern: `import { $$$IMPORTS } from $SOURCE` },
        { pattern: `import $NAME from $SOURCE` },
        { pattern: `import * as $NAME from $SOURCE` },
      ],
    },
  });

  for (const importNode of imports) {
    // Check default or namespace imports
    const defaultImport = importNode.getMatch("NAME");
    if (defaultImport && defaultImport.text() === name) {
      return importNode;
    }

    // Check named imports
    const namedImports = importNode.getMatch("IMPORTS");
    if (namedImports) {
      // Look for the specific named import
      const namedImport = namedImports.find({
        rule: {
          any: [
            { pattern: name }, // Simple named import
            { pattern: `$OLD as ${name}` }, // Aliased import
          ],
        },
      });
      if (namedImport) {
        return namedImport;
      }
    }
  }

  // 2. Check for variable declarations (var, let, const)
  const varDeclarations = scope.findAll({
    rule: {
      any: [
        { pattern: `var $NAME = $VALUE` },
        { pattern: `let $NAME = $VALUE` },
        { pattern: `const $NAME = $VALUE` },
        { pattern: `var $NAME` },
        { pattern: `let $NAME` },
        { pattern: `const $NAME` },
      ],
    },
  });

  for (const varDecl of varDeclarations) {
    const varName = varDecl.getMatch("NAME");
    if (varName && varName.text() === name) {
      return varDecl;
    }
  }

  // 3. Check for function declarations
  const funcDeclarations = scope.findAll({
    rule: {
      any: [{ pattern: `function $NAME($$$PARAMS) { $$$BODY }` }],
    },
  });

  for (const funcDecl of funcDeclarations) {
    const funcName = funcDecl.getMatch("NAME");
    if (funcName && funcName.text() === name) {
      return funcDecl;
    }
  }

  // 4. Check for function parameters
  const functions = scope.findAll({
    rule: {
      any: [
        { pattern: `function $FNAME($$$PARAMS) { $$$BODY }` },
        { pattern: `($$$PARAMS) => $BODY` },
        { pattern: `function($$$PARAMS) { $$$BODY }` },
      ],
    },
  });

  for (const func of functions) {
    const params = func.getMatch("PARAMS");
    if (params) {
      // Check if our name is one of the parameters
      const paramNodes = params.findAll({
        rule: { pattern: name },
      });
      if (paramNodes.length > 0) {
        return paramNodes[0] as SgNode<T>;
      }
    }
  }

  // 5. Check for class declarations
  const classDeclarations = scope.findAll({
    rule: {
      pattern: `class $NAME { $$$BODY }`,
    },
  });

  for (const classDecl of classDeclarations) {
    const className = classDecl.getMatch("NAME");
    if (className && className.text() === name) {
      return classDecl;
    }
  }

  // 6. Check for arrow function assignments
  const arrowFunctions = scope.findAll({
    rule: {
      any: [
        { pattern: `const $NAME = ($$$PARAMS) => $BODY` },
        { pattern: `let $NAME = ($$$PARAMS) => $BODY` },
        { pattern: `var $NAME = ($$$PARAMS) => $BODY` },
        { pattern: `const $NAME = $PARAMS => $BODY` },
        { pattern: `let $NAME = $PARAMS => $BODY` },
        { pattern: `var $NAME = $PARAMS => $BODY` },
      ],
    },
  });

  for (const arrowFunc of arrowFunctions) {
    const funcName = arrowFunc.getMatch("NAME");
    if (funcName && funcName.text() === name) {
      return arrowFunc;
    }
  }

  // 7. Check for object method shorthand
  const objectMethods = scope.findAll({
    rule: {
      pattern: `{ $NAME($$$PARAMS) { $$$BODY } }`,
    },
  });

  for (const objMethod of objectMethods) {
    const methodName = objMethod.getMatch("NAME");
    if (methodName && methodName.text() === name) {
      return objMethod;
    }
  }

  // 8. Check for destructuring assignments
  const destructuring = scope.findAll({
    rule: {
      any: [
        { pattern: `const { $$$PROPS } = $VALUE` },
        { pattern: `let { $$$PROPS } = $VALUE` },
        { pattern: `var { $$$PROPS } = $VALUE` },
        { pattern: `const [$$$ITEMS] = $VALUE` },
        { pattern: `let [$$$ITEMS] = $VALUE` },
        { pattern: `var [$$$ITEMS] = $VALUE` },
      ],
    },
  });

  for (const destructure of destructuring) {
    const props =
      destructure.getMatch("PROPS") || destructure.getMatch("ITEMS");
    if (props) {
      const propNodes = props.findAll({
        rule: {
          any: [{ pattern: name }, { pattern: `$OLD: ${name}` }],
        },
      });
      if (propNodes.length > 0) {
        return propNodes[0] as SgNode<T>;
      }
    }
  }

  return null;
}
