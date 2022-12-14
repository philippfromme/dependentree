import { isArray, isNull, isObject } from "lodash";

import npa from "npm-package-arg";

import hostedGitInfo from "hosted-git-info";
import isGitHubShorthand from "hosted-git-info/lib/is-github-shorthand";

import semver from "semver";

export function isMaintainedBy(pkgJson, maintainers) {
  return pkgJson.maintainers.find(({ name }) => maintainers.includes(name));
}

let controller = new AbortController();

export async function fetchPackage(options) {
  controller.abort();

  controller = new AbortController();

  console.log("fetching with options", options);

  return _fetchPackage(options);
}

async function _fetchPackage(options) {
  let {
    package: pkgName = null,
    maintainers = [],
    ignoreDependencies = false,
    ignoreDevDependencies = true,
    ignorePeerDependencies = true,
    depth = 0,
    maxDepth = Infinity,
    version,
  } = options;

  if (!pkgName) {
    return null;
  }

  const parsed = npa(pkgName);

  const { name } = parsed;

  pkgName = name;

  if (!version) {
    const { type } = parsed;

    if (["range", "tag", "version"].includes(type)) {
      const { fetchSpec } = parsed;

      version = fetchSpec === "*" ? "latest" : fetchSpec;
    }
  }

  console.log(`fetching "${pkgName}": "${version}"`);

  if (!canFetchPackage(version)) {
    throw new Error("Failed to fetch");
  }

  const pkgJson = await _fetchPackageJson(pkgName, version);

  if (isNull(pkgJson)) {
    if (depth === 0) {
      throw new Error("Failed to fetch");
    }

    return {
      name: pkgName,
      pkgJson: null,
      dependencies: {},
      error: {
        version,
      },
    };
  }

  let dependencies = {};

  console.log("depth", depth);
  console.log("max depth", parseInt(maxDepth, 10));

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
        let dependencyNode;

        if (semver.validRange(pkgJson.dependencies[dependency])) {
          const { version } = semver.minVersion(
            pkgJson.dependencies[dependency]
          );

          dependencyNode = await _fetchPackage({
            ...options,
            version,
            package: dependency,
            depth: depth + 1,
          });
        } else {
          dependencyNode = {
            name: dependency,
            pkgJson: null,
            dependencies: {},
            error: {
              version: pkgJson.dependencies[dependency],
            },
          };
        }

        if (
          !maintainers.length ||
          isMaintainedBy(dependencyNode.pkgJson, maintainers)
        ) {
          dependencies = {
            ...dependencies,
            [dependency]: {
              ...dependencyNode,
              isDependency: true,
            },
          };
        }
      }
    }
  }

  if (ignoreDevDependencies !== true) {
    for (let devDependency in pkgJson.devDependencies) {
      if (
        !isArray(ignoreDevDependencies) ||
        !ignoreDevDependencies.includes(devDependency)
      ) {
        let devDependencyNode;

        if (semver.validRange(pkgJson.devDependencies[devDependency])) {
          const { version } = semver.minVersion(
            pkgJson.devDependencies[devDependency]
          );

          devDependencyNode = await _fetchPackage({
            ...options,
            version,
            package: devDependency,
            ignoreDependencies: true,
            ignoreDevDependencies: true,
            ignorePeerDependencies: true,
            depth: depth + 1,
          });
        } else {
          devDependencyNode = {
            name: devDependency,
            pkgJson: null,
            dependencies: {},
            error: {
              version: pkgJson.devDependencies[devDependency],
            },
          };
        }

        if (
          !maintainers.length ||
          isMaintainedBy(devDependencyNode.pkgJson, maintainers)
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

  if (ignorePeerDependencies !== true) {
    for (let peerDependency in pkgJson.peerDependencies) {
      if (
        !isArray(ignorePeerDependencies) ||
        !ignorePeerDependencies.includes(peerDependency)
      ) {
        let peerDependencyNode;

        if (semver.validRange(pkgJson.peerDependencies[peerDependency])) {
          const { version } = semver.minVersion(
            pkgJson.peerDependencies[peerDependency]
          );

          peerDependencyNode = await _fetchPackage({
            ...options,
            version,
            package: peerDependency,
            ignoreDependencies: true,
            ignoreDevDependencies: true,
            ignorePeerDependencies: true,
            depth: depth + 1,
          });
        } else {
          peerDependencyNode = {
            name: peerDependency,
            pkgJson: null,
            dependencies: {},
            error: {
              version: pkgJson.peerDependencies[peerDependency],
            },
          };
        }

        if (
          !maintainers.length ||
          isMaintainedBy(peerDependencyNode.pkgJson, maintainers)
        ) {
          dependencies = {
            ...dependencies,
            [peerDependency]: {
              ...peerDependencyNode,
              isPeerDependency: true,
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

const fetchTypes = ["git", "range", "remote"];

/**
 * @see https://docs.npmjs.com/cli/v9/configuring-npm/package-json#dependencies
 *
 * @param {string} pkgName
 * @param {string} version
 *
 * @returns {Object|null}
 */
async function _fetchPackageJson(pkgName, version) {
  let parsed;

  try {
    parsed = npa(version);
  } catch (error) {
    return null;
  }

  const { type } = parsed;

  if (type === "git") {
    console.log("not fetching git");

    return null;
  } else if (type === "remote") {
    console.log("not fetching URL");

    return null;
  } else if (type === "range") {
    const response = await fetch(
      `https://registry.npmjs.org/${pkgName}/${version}`,
      {
        signal: controller.signal,
      }
    );

    const pkgJson = await response.json();

    if (!isObject(pkgJson)) {
      return null;
    }

    return pkgJson;
  }

  return null;
}

function canFetchPackage(version) {
  let parsed;

  try {
    parsed = npa(version);

    const { type } = parsed;

    return fetchTypes.includes(type);
  } catch (error) {
    return null;
  }
}
