import ContentLoader, { Rect, Circle } from "react-content-loader/native";
import React from "react";
import { height, width } from "../../constants/scale";

const Loader = ({ ...props }) => (
  <ContentLoader
    viewBox="0 0 500 475"
    style={{
      position: "absolute",
      top: -(height / 3),
      left: 0,
      right: 0,
      bottom: 0,
    }}
    width={width}
    {...props}
  >
    <Circle cx="70.2" cy="73.2" r="41.3" />
    <Rect x="129.9" y="45.5" width="296" height="17" />
    <Rect x="129.9" y="87.5" width="296" height="17" />

    <Circle cx="70.7" cy="243.5" r="41.3" />
    <Rect x="130.4" y="215.9" width="296" height="17" />
    <Rect x="130.4" y="257.8" width="296" height="17" />

    <Circle cx="70.7" cy="412.7" r="41.3" />
    <Rect x="130.4" y="385" width="296" height="17" />
    <Rect x="130.4" y="427" width="296" height="17" />

    <Circle cx="70.7" cy="581.7" r="41.3" />
    <Rect x="130.4" y="554" width="296" height="17" />
    <Rect x="130.4" y="596" width="296" height="17" />

    <Circle cx="70.7" cy="750.7" r="41.3" />
    <Rect x="130.4" y="723" width="296" height="17" />
    <Rect x="130.4" y="765" width="296" height="17" />
  </ContentLoader>
);

export default Loader;
