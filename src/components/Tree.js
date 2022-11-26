import React, { useCallback, useEffect, useRef, useState } from "react";

import * as d3 from "d3";

export default function Tree(props) {
  let {
    data,
    padding = 2,
    fill = "var(--black)",
    stroke = "var(--black)",
    strokeLinecap,
    strokeLinejoin,
    strokeOpacity = 0.5,
    strokeWidth = 1,
    r = 2,
    halo = "transparent",
    haloWidth = 3,
    defaultBackgroundColor = "var(--green)",
    dependencyBackgroundColor = "var(--blue)",
    devDependencyBackgroundColor = "var(--white)",
    peerDependencyBackgroundColor = "var(--yellow)",
    errorBackgroundColor = "var(--red)",
    defaultTextColor = "var(--white)",
    dependencyTextColor = "var(--white)",
    devDependencyTextColor = "var(--black)",
    peerDependencyTextColor = "var(--black)",
    errorTextColor = "var(--white)",
    fontSize = "1em",
  } = props;

  function getBackgroundColor(d) {
    if (d.data.error) return errorBackgroundColor;
    if (d.data.isDevDependency) return devDependencyBackgroundColor;
    if (d.data.isPeerDependency) return peerDependencyBackgroundColor;
    if (d.data.isDependency) return dependencyBackgroundColor;
    return defaultBackgroundColor;
  }

  function getTextColor(d) {
    if (d.data.error) return errorTextColor;
    if (d.data.isDevDependency) return devDependencyTextColor;
    if (d.data.isPeerDependency) return peerDependencyTextColor;
    if (d.data.isDependency) return dependencyTextColor;
    return defaultTextColor;
  }

  const [rect, setRect] = useState(null);

  const ref = useRef();

  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setRect(node.getBoundingClientRect());
    }
  }, []);

  const onMove = (event) => {
    console.log(event);
  };

  useEffect(() => {
    if (!ref.current || !rect || !rect.width || !data) {
      return;
    }

    ref.current.addEventListener("drag", onMove);

    let { width, height } = rect;

    const root = d3.hierarchy(data, ({ dependencies }) =>
      Object.values(dependencies)
    );

    // compute layout
    const dx = 50;
    const dy = width / (root.height + padding);

    d3.tree().nodeSize([dx, dy])(root);

    // center tree
    let x0 = Infinity;
    let x1 = -x0;
    root.each((d) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    console.log(root);

    // compute default height
    height = height || x1 - x0 + dx * 2;

    const svg = d3.select(ref.current);

    function zoomed({ transform }) {
      svg.selectAll("g").attr("transform", transform);
    }

    svg.call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [width, height],
        ])
        .scaleExtent([0.25, 8])
        .on("zoom", zoomed)
    );

    svg.selectAll("*").remove();

    svg
      .attr("viewBox", [(-dy * padding) / 2, x0 - dx, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("font-family", "IBM Plex Sans")
      .attr("font-size", fontSize);

    // tree branches
    svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", stroke)
      // .attr("stroke", 'red') // debug
      .attr("stroke-opacity", strokeOpacity)
      .attr("stroke-linecap", strokeLinecap)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-width", strokeWidth)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d) => d.y)
          .y((d) => d.x)
      );

    const node = svg
      .append("g")
      .selectAll("a")
      .data(root.descendants())
      .join("a")
      .attr("xlink:href", (d) =>
        d.data.pkgJson
          ? d.data.pkgJson.homepage
          : `https://www.npmjs.com/search?q=${d.data.name}`
      )
      .attr("target", "_blank")
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("fill", (d) => {
        const { data } = d;

        const { error } = data;

        if (error) return "red";

        return d.children ? stroke : fill;
      })
      // .attr("fill", 'blue') // debug
      .attr("r", r);

    node.append("title").text(getLabel);

    node
      .append("rect")
      .attr("y", "-0.5em")
      .attr("rx", "0.5em")
      .attr("height", "1em")
      .attr("width", "1em")
      .attr("stroke", getBackgroundColor)
      .attr("stroke-width", "0.65em")
      .attr("fill", getBackgroundColor);

    node
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => (d.children ? -6 : 6))
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .attr("paint-order", "stroke")
      .attr("fill", getTextColor)
      .attr("stroke", halo)
      .attr("stroke-width", haloWidth)
      .text(getLabel)
      .each(function (d) {
        d.width = this.getComputedTextLength();
      });

    node
      .select("rect")
      .attr("x", (d) => (d.children ? -6 - d.width : 6))
      .attr("width", (d) => d.width);

    return () => ref.current?.removeEventListener("drag", onMove);
  }, [data, rect]);

  return (
    <div className="content__svg" ref={measuredRef}>
      <svg ref={ref} />
    </div>
  );
}

function getLabel(d) {
  const { data } = d;

  const { error, pkgJson } = data;

  if (error) {
    return `${d.data.name}@${error.version}`;
  }

  if (pkgJson) {
    return `${d.data.name}@${d.data.pkgJson.version}`;
  }

  return d.data.name;
}
