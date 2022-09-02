import React, { useEffect, useState } from "react";

import Tree from "./Tree";

function isMaintainedBy(pkgJson, maintainer) {
  return pkgJson.maintainers.find(({ name }) => name === maintainer);
}

async function fetchGitHubPkg(
  packageJsonPath = "camunda/camunda-modeler/develop/client/package.json"
) {
  const result = await fetch(
    `https://raw.githubusercontent.com/${packageJsonPath}`
  );

  const pkgJson = await result.json();

  return pkgJson;
}

fetchGitHubPkg();

async function fetchPgksMaintainedBy(maintainer = "bpmn-io-admin") {
  const result = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=maintainer:${maintainer}&size=250`
  );

  const pkgJson = await result.json();

  const packages = pkgJson.objects
    .map(({ package: pkg }) => pkg)
    .sort((a, b) => {
      const nameA = a.name.toUpperCase(); // ignore upper and lowercase
      const nameB = b.name.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      // names must be equal
      return 0;
    });

  return packages;
}

async function fetchPackage(
  name,
  fetchDependencies = true,
  fetchDevDependencies = false
) {
  console.log("fetch package", name);

  const isGithub = name.split(":")[0] === "github";

  let pkgJson;

  if (isGithub) {
    pkgJson = await fetchGitHubPkg(name.split(":")[1]);
  } else {
    const result = await fetch(`https://registry.npmjs.org/${name}/latest`);

    pkgJson = await result.json();
  }

  let dependencies = {};

  if (fetchDependencies) {
    for (let dependency in pkgJson.dependencies) {
      const _dependency = await fetchPackage(dependency);

      if (isMaintainedBy(_dependency.pkgJson, "bpmn-io-admin")) {
        dependencies = { ...dependencies, [dependency]: _dependency };
      }
    }
  }

  if (fetchDevDependencies) {
    for (let devDependency in pkgJson.devDependencies) {
      const _devDependency = await fetchPackage(devDependency, false, false);

      if (isMaintainedBy(_devDependency.pkgJson, "bpmn-io-admin")) {
        dependencies = {
          ...dependencies,
          [devDependency]: {
            ..._devDependency,
            isDevDependency: true,
          },
        };
      }
    }
  }

  return {
    name: pkgJson.name,
    pkgJson,
    dependencies,
  };
}

export default function App() {
  const [availablePkgs, setAvailablePkgs] = useState([]);
  const [pkgName, setPkgName] = useState("bpmn-js");
  const [data, setData] = useState({});
  const [fetching, setFetching] = useState({});
  const [fetchDevDependencies, setFetchDevDependencies] = useState(false);

  useEffect(() => {
    (async () => {
      setFetching(true);

      const _pkgs = await fetchPackage(pkgName, true, fetchDevDependencies);

      setData(_pkgs);

      console.log(_pkgs);

      const pkgsMaintainedBy = await fetchPgksMaintainedBy();

      setAvailablePkgs([
        ...pkgsMaintainedBy,
        {
          name: "github:camunda/camunda-modeler/develop/client/package.json",
          label: "Camunda Modeler",
        },
      ]);

      setFetching(false);
    })();
  }, [pkgName, fetchDevDependencies]);

  return (
    <div className="App">
      <h1>bpmn.io Package Explorer</h1>
      <div>
        <label htmlFor="select-package">Select Package</label>
        <br />
        <br />
        <select
          id="select-package"
          value={pkgName}
          onChange={(e) => setPkgName(e.target.value)}
        >
          {availablePkgs.map(({ label, name }) => {
            return (
              <option key={name} value={name}>
                {label || name}
              </option>
            );
          })}
        </select>
        <br />
        <br />
        <label htmlFor="inlcude-dev-dependencies">
          Include Development Dependencies
        </label>
        <br />
        <br />
        <input
          id="include-dev-dependencies"
          type="checkbox"
          value={fetchDevDependencies}
          onChange={() => setFetchDevDependencies(!fetchDevDependencies)}
        />
      </div>
      {fetching ? <h2>Fetching...</h2> : null}
      {fetching ? null : (
        <div>
          <h2>Tree</h2>
          <Tree data={data} />
        </div>
      )}
    </div>
  );
}
