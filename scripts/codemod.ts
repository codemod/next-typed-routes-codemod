import type { SgRoot, SgNode } from "@codemod.com/jssg-types/main";
import type TSX from "codemod:ast-grep/langs/tsx";
import { getDefaultExport, isFunctionLike } from "./utils/ast-utils.ts";
import { getNextResolvedRoute } from "./utils/next-routes.ts";

async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();

  const defaultExport = getDefaultExport(rootNode);

  if (!defaultExport || !isFunctionLike(defaultExport)) {
    return null;
  }

  const requiredParameter = defaultExport.field("parameters")?.child(1);

  if (!requiredParameter?.is("required_parameter")) {
    return null;
  }

  const typeAnnotation = requiredParameter.field("type")?.child(1);

  if (!typeAnnotation) {
    return null;
  }

  const filePath = root.filename();
  const resolvedRoute = await getNextResolvedRoute(filePath);

  if (!resolvedRoute) {
    return null;
  }

  const isLayout = filePath.endsWith("/layout.tsx");

  const typeName = isLayout ? "LayoutProps" : "PageProps";

  const edit = typeAnnotation.replace(`${typeName}<"${resolvedRoute}">`);
  const result = rootNode.commitEdits([edit]);

  return result;
}

export default transform;
