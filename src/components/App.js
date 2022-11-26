import React, { useCallback, useEffect, useState } from "react";

import {
  ActionableNotification,
  Button,
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  InlineLoading,
  InlineNotification,
  Search,
  Stack,
  Tag,
  Tile,
} from "carbon-components-react";

import { Add, ErrorOutline, LogoGithub } from "@carbon/icons-react";

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
  /** @type {string} */
  const [search, setSearch] = useState("");

  /** Set inital search if in URL search params */
  useState(() => {
    const params = new URLSearchParams(location.search);

    const search = paramsToSearch(params);

    setSearch(search);
  }, []);

  const { data, error, fetching, query } = useFetchPackages(search);

  const onSearchChange = useCallback(
    ({ target }) => setSearch(target.value),
    [setSearch]
  );

  console.log("fetching", fetching);

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
          autoComplete="off"
          spellCheck={false}
          size="lg"
          value={search}
          labelText="Search"
          closeButtonLabelText="Clear search input"
          id="search-1"
          onChange={onSearchChange}
          onKeyDown={() => {}}
        />
      </Tile>
      <Examples
        query={query}
        onClick={(example) => setSearch(`${search.trim()} ${example}`)}
      />
      <Content
        data={data}
        error={error}
        fetching={fetching}
        setSearch={setSearch}
      />
    </>
  );
}

function Content(props) {
  const { data, error, fetching, setSearch } = props;

  if (error) {
    return (
      <div className="content">
        <ActionableNotification
          actionButtonLabel="Try example"
          onActionButtonClick={() => {
            setSearch(
              "ignore-dependencies:min-dash,min-dom ignore-dev-dependencies maintainers:bpmn-io-admin package:bpmn-js"
            );
          }}
          statusIconDescription="Could not fetch dependencies"
          subtitle={error}
          title="Could not fetch dependencies"
          hideCloseButton={true}
          kind="error"
        />
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="content">
        <InlineLoading
          className="content__loading"
          description="Fetching dependencies..."
        />
      </div>
    );
  }

  if (isNull(data)) {
    return (
      <div className="content">
        <ActionableNotification
          actionButtonLabel="Try example"
          onActionButtonClick={() => {
            setSearch(
              "ignore-dependencies:min-dash,min-dom ignore-dev-dependencies maintainers:bpmn-io-admin package:bpmn-js"
            );
          }}
          statusIconDescription="No dependencies to display"
          subtitle=""
          title="No dependencies to display"
          hideCloseButton={true}
          kind="info"
        />
      </div>
    );
  }

  return (
    <div className="content">
      <Tree data={data} />
    </div>
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

function useFetchPackages(search) {
  /** @type Object|null */
  const [data, setData] = useState(null);

  /** @type string|null */
  const [error, setError] = useState(null);

  /** @type boolean */
  const [fetching, setFetching] = useState(false);

  /** @type Object */
  const [query, setQuery] = useState(null);

  /** Create query from search and set search in URL search params if search changed */
  useEffect(() => {
    const query = searchToQuery(search);

    setQuery(query);

    const params = queryToParams(query);

    history.pushState(null, "", `${location.pathname}?${params.toString()}`);
  }, [search]);

  /** Fetch packages if query changed */
  useEffect(() => {
    if (!query || !query.length) {
      setData(null);

      setError(null);

      return;
    }

    (async () => {
      setFetching(true);

      setError(null);

      try {
        const pkgs = await fetchPackage(queryToOptions(query));

        setData(pkgs);

        setError(null);
      } catch (error) {
        console.log(error);

        if (error.message !== "The user aborted a request.")
          setError(error.message);
      }

      setFetching(false);
    })();
  }, [query]);

  return {
    data,
    error,
    fetching,
    query,
  };
}
