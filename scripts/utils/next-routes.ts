import * as path from "node:path";
import * as fs from "node:fs/promises";

const nextProjectIndicators = [
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
];

async function getFilePathRelativeToProjectRoot(
  filePath: string
): Promise<string | null> {
  let currentDir = path.dirname(filePath);

  while (currentDir !== path.dirname(currentDir)) {
    const isNextProject = await Promise.allSettled(
      nextProjectIndicators.map((indicator) =>
        fs.stat(path.join(currentDir, indicator)).then((stat) => stat.isFile())
      )
    ).then((stats) =>
      stats.some((stat) => stat.status === "fulfilled" && stat.value)
    );

    if (isNextProject) {
      return path.relative(currentDir, filePath);
    }

    const packageJson = path.join(currentDir, "package.json");
    const isPackageJson = await fs
      .stat(packageJson)
      .then((stat) => stat.isFile())
      .catch(() => false);

    // check package.json for Next.js dependency as fallback
    if (isPackageJson) {
      try {
        const pkg = JSON.parse(await fs.readFile(packageJson, "utf8"));
        if (pkg.dependencies?.next) {
          return path.relative(currentDir, filePath);
        }
      } catch (e) {
        // continue searching if package.json is malformed
      }
    }

    currentDir = path.dirname(currentDir);
  }

  return null;
}

export async function getNextResolvedRoute(
  filePath: string
): Promise<string | null> {
  const filePathRelativeToProjectRoot = await getFilePathRelativeToProjectRoot(
    filePath
  );

  if (!filePathRelativeToProjectRoot) {
    return null;
  }

  const normalizedPath = filePathRelativeToProjectRoot.replace(/\\/g, "/");

  const segments = normalizedPath.split("/").filter(Boolean);

  const appIndex = segments.findIndex((segment) => segment === "app");

  if (appIndex === -1) {
    return null;
  }

  const routeSegments = segments.slice(appIndex + 1);

  // remove the filename (page.tsx, layout.tsx, etc.)
  const lastSegment = routeSegments[routeSegments.length - 1];
  if (
    lastSegment &&
    (lastSegment.includes(".") ||
      lastSegment === "page" ||
      lastSegment === "layout")
  ) {
    routeSegments.pop();
  }

  // remove group routes
  const filteredSegments = routeSegments.filter((segment) => {
    return !segment.startsWith("(") || !segment.endsWith(")");
  });

  const routePath =
    filteredSegments.length > 0 ? `/${filteredSegments.join("/")}` : "/";

  return routePath;
}
