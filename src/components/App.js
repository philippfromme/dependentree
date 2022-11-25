import React, { useCallback, useEffect, useState } from "react";

import {
  Button,
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  InlineLoading,
  Search,
  Stack,
  Tag,
  Tile,
} from "carbon-components-react";

import { Add, LogoGithub } from "@carbon/icons-react";

import { isNull, matchesProperty } from "lodash";

import Tree from "./Tree";

import { fetchPackage } from "../api";

import {
  paramsToSearch,
  queryToOptions,
  queryToParams,
  searchToQuery,
} from "../search";

export default function App() {
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [query, setQuery] = useState(null);
  const [search, setSearch] = useState("");

  useState(() => {
    const params = new URLSearchParams(location.search);

    const search = paramsToSearch(params);

    console.log(location.search, search);

    setSearch(search);
  }, []);

  useEffect(() => {
    const query = searchToQuery(search);

    setQuery(query);

    const params = queryToParams(query);

    history.pushState(null, "", location.pathname + "?" + params.toString());
  }, [search]);

  useEffect(() => {
    if (!query || !query.length) return;

    (async () => {
      setFetching(true);

      try {
        const pkgs = await fetchPackage(queryToOptions(query));

        setData(pkgs);
      } catch (error) {
        console.log("error fetching packages", error);
      }

      setFetching(false);
    })();
  }, [query]);

  const onSearchChange = useCallback(
    ({ target }) => setSearch(target.value),
    [setSearch]
  );

  return (
    <>
      <Header aria-label="Dependentree">
        <HeaderName href="#" prefix="">
          Dependentree
        </HeaderName>
        <HeaderGlobalBar>
          <HeaderGlobalAction
            aria-label="Login with GitHub"
            onClick={() => {}}
            tooltipAlignment="end"
          >
            <LogoGithub size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
      <Tile>
        <Search
          spellCheck={false}
          size="lg"
          value={search}
          labelText="Search"
          closeButtonLabelText="Clear search input"
          id="search-1"
          onChange={onSearchChange}
          onKeyDown={() => {}}
          autoComplete="hello"
        />
      </Tile>
      <Examples
        query={query}
        onClick={(example) => setSearch(`${search.trim()} ${example}`)}
      />
      <div className="tree">
        {fetching ? (
          <InlineLoading
            className="tree__loading"
            description="Fetching dependencies..."
          />
        ) : isNull(data) ? (
          <Tile className="tile-no-data">
            <Stack gap={6}>
              <h1>No data</h1>
              <Button
                onClick={() =>
                  setSearch(
                    "ignore-dependencies:min-dash,min-dom ignore-dev-dependencies maintainers:bpmn-io-admin package:bpmn-js"
                  )
                }
              >
                Try example
              </Button>
            </Stack>
          </Tile>
        ) : (
          <Tree data={data} />
        )}
      </div>
    </>
  );
}

function Examples(props) {
  const { query, onClick } = props;

  let tags = [];

  if (!query?.find(matchesProperty("name", "ignore-dependencies"))) {
    tags = [...tags, "ignore-dependencies:react"];
  }

  if (!query?.find(matchesProperty("name", "ignore-dev-dependencies"))) {
    tags = [...tags, "ignore-dev-dependencies:webpack"];
  }

  if (!query?.find(matchesProperty("name", "ignore-peer-dependencies"))) {
    tags = [...tags, "ignore-peer-dependencies:react"];
  }

  if (!query?.find(matchesProperty("name", "maintainers"))) {
    tags = [...tags, "maintainers:philippfromme"];
  }

  if (!query?.find(matchesProperty("name", "max-depth"))) {
    tags = [...tags, "max-depth:3"];
  }

  if (!query?.find(matchesProperty("name", "package"))) {
    tags = [...tags, "package:webpack"];
  }

  if (!query?.find(matchesProperty("name", "version"))) {
    tags = [...tags, "version:1.0.0"];
  }

  return (
    <Tile className="tile-examples">
      {tags.map((tag) => (
        <Tag
          style={{ border: "none", lineHeight: 1 }}
          key={tag}
          onClick={() => onClick(tag)}
          renderIcon={Add}
          size="md"
          type="gray"
        >
          {tag}
        </Tag>
      ))}
    </Tile>
  );
}
