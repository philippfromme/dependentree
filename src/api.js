import { isArray, omit } from "lodash";

export function isMaintainedBy(pkgJson, maintainers) {
  return pkgJson.maintainers.find(({ name }) => maintainers.includes(name));
}

let controller = new AbortController();

export async function fetchPackage(options) {
  controller.abort();

  controller = new AbortController();

  console.log('fetching with options', options);

  return _fetchPackage(options);
}

async function _fetchPackage(options) {
  let {
    package: pkgName = null,
    maintainers = [],
    ignoreDependencies = false,
    ignoreDevDependencies = true,
    depth = 0,
    maxDepth = Infinity,
    version = "latest",
  } = options;

  if (!pkgName) {
    return null;
  }

  console.log(`fetching ${pkgName}@${version}`);

  const response = await fetch(
    `https://registry.npmjs.org/${pkgName}/${version}`,
    {
      signal: controller.signal,
    }
  );

  const pkgJson = await response.json();

  let dependencies = {};

  console.log('depth', depth);
  console.log('max depth', parseInt(maxDepth, 10));

  if (parseInt(maxDepth, 10) !== NaN && depth === parseInt(maxDepth, 10)) {
    return {
      name: pkgJson.name,
      pkgJson,
      dependencies,
    };
  }

  if (ignoreDependencies !== true) {
    for (let dependency in pkgJson.dependencies) {
      if (
        !isArray(ignoreDependencies) ||
        !ignoreDependencies.includes(dependency)
      ) {
        const dependencyNode = await _fetchPackage({
          ...omit(options, ["version"]),
          package: dependency,
          depth: depth + 1,
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
        const devDependencyNode = await _fetchPackage({
          ...omit(options, ["version"]),
          package: devDependency,
          ignoreDependencies: true,
          ignoreDevDependencies: true,
          depth: depth + 1,
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
