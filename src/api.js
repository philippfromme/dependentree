import { isArray } from "lodash";

export function isMaintainedBy(pkgJson, maintainers) {
  return pkgJson.maintainers.find(({ name }) => maintainers.includes(name));
}

export async function fetchPackage(options) {
  let {
    package: pkgName = null,
    maintainers = [],
    ignoreDependencies = false,
    ignoreDevDependencies = true,
  } = options;

  if (!pkgName) {
    return null;
  }

  console.log("fetching", pkgName);

  const response = await fetch(`https://registry.npmjs.org/${pkgName}/latest`);

  const pkgJson = await response.json();

  let dependencies = {};

  if (ignoreDependencies !== true) {
    for (let dependency in pkgJson.dependencies) {
      if (
        !isArray(ignoreDependencies) ||
        !ignoreDependencies.includes(dependency)
      ) {
        const dependencyNode = await fetchPackage({
          ...options,
          package: dependency,
        });

        if (
          !maintainers.length ||
          isMaintainedBy(dependencyNode.pkgJson, maintainers)
        ) {
          dependencies = { ...dependencies, [dependency]: dependencyNode };
        }
      }
    }
  }

  if (ignoreDevDependencies !== true) {
    for (let devDependency in pkgJson.devDependencies) {
      if (
        !isArray(ignoreDevDependencies) ||
        !ignoreDevDependencies.includes(dependency)
      ) {
        const devDependencyNode = await fetchPackage({
          ...options,
          package: devDependency,
          ignoreDependencies: true,
          ignoreDevDependencies: true,
        });

        if (
          !maintainers.length ||
          isMaintainedBy(_dependency.pkgJson, maintainers)
        ) {
          dependencies = {
            ...dependencies,
            [devDependency]: {
              ...devDependencyNode,
              isDevDependency: true,
            },
          };
        }
      }
    }
  }

  return {
    name: pkgJson.name,
    pkgJson,
    dependencies,
  };
}
