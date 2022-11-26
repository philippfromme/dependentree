import filterable from "filterable";

import camelCase from "camelcase";

const fields = [
  "ignore-dependencies",
  "ignore-dev-dependencies",
  "ignore-peer-dependencies",
  "maintainers",
  "max-depth",
  "package",
  "version",
];

export function paramsToSearch(params) {
  let search = [];

  for (const field of fields) {
    const value = params.get(field);

    if (value) {
      if (value === "true") {
        search = [...search, field];
      } else {
        search = [...search, `${field}:${value}`];
      }
    }
  }

  return search.join(" ");
}

export function queryToOptions(query) {
  let options = {};

  for (let field of query) {
    if (fields.includes(field.name)) {
      options = {
        ...options,
        [camelCase(field.name)]: field.value,
      };
    }
  }

  return options;
}

export function queryToParams(query) {
  const params = new URLSearchParams();

  for (let field of query) {
    if (fields.includes(field.name)) {
      params.set(field.name, field.value);
    }
  }

  return params;
}

export function searchToQuery(search) {
  return filterable
    .Query(search)
    .parse()
    .toJSON()
    .map((field) => {
      // boolean
      if (field.type === "in") {
        return {
          name: field.value,
          value: true,
        };
      }

      // string
      if (field.type === "=") {
        let value = field.value;

        if (value.length === 1) {
          value = value[0];
        }

        return {
          name: field.field,
          value,
        };
      }

      return null;
    });
}
