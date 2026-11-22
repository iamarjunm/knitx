import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          borderRadius: 34,
          position: "relative",
          color: "#F7F6F2",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 22,
            right: 22,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "#FF4500",
          }}
        />
        <div
          style={{
            fontSize: 82,
            fontWeight: 900,
            letterSpacing: "-0.06em",
            lineHeight: 1,
          }}
        >
          KX
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.34em",
            color: "#D8D5CC",
          }}
        >
          KNITX
        </div>
      </div>
    ),
    { ...size }
  );
}
