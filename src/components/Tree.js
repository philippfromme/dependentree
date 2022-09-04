import React, { useCallback, useEffect, useRef, useState } from "react";

import * as d3 from "d3";

import { hierarchy, tree } from "d3-hierarchy";

export default function Tree(props) {
  let {
    data,
    padding = 2,
    fill = "#000",
    stroke = "#000",
    strokeLinecap,
    strokeLinejoin,
    strokeOpacity = 0.5,
    strokeWidth = 1,
    r = 2,
    halo = "#fff",
    haloWidth = 3,
  } = props;

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

    const root = hierarchy(data, ({ dependencies }) =>
      Object.values(dependencies)
    );

    // compute layout
    const dx = 25;
    const dy = width / (root.height + padding);

    tree().nodeSize([dx, dy])(root);

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

    svg.selectAll("*").remove();

    svg

      .attr("viewBox", [(-dy * padding) / 2, x0 - dx, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("font-family", "IBM Plex Sans")
      .attr("font-size", 16);

    // tree branches
    svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", stroke)
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
      .attr("xlink:href", (d) => d.data.pkgJson.homepage)
      .attr("target", "_blank")
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("fill", (d) => (d.children ? stroke : fill))
      .attr("r", r);

    node.append("title").text((d) => d.data.name);

    node
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => (d.children ? -6 : 6))
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .attr("paint-order", "stroke")
      .attr("fill", (d) => (d.data.isDevDependency ? "#bbb" : "#000"))
      .attr("stroke", halo)
      .attr("stroke-width", haloWidth)
      .text((d, i) => d.data.name);

    return () => ref.current?.removeEventListener("drag", onMove);
  }, [data, rect]);

  return (
    <div className="tree__svg" ref={measuredRef}>
      <svg ref={ref} />
    </div>
  );
}
