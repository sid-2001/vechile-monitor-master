import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { RecoilRoot } from "recoil";

const BlockMobile = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      textAlign: "center",
      padding: "20px",
      fontSize: "24px",
      fontFamily: "sans-serif",
    }}
  >
    🚫 This application is not available on mobile devices.
    <br />
    Please use a desktop or laptop.
  </div>
);

// Wrapper component to block mobile without reload
const RootWrapper = () => {
  const [blocked, setBlocked] = useState(false);

  // const checkDevice = () => {
  //   const isMobile =
  //     window.innerWidth < 190 ||
  //     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  //       navigator.userAgent
  //     );
  //   setBlocked(isMobile);
  // };

  useEffect(() => {
    // checkDevice();
    // window.addEventListener("resize", checkDevice); // detects without reload
    // return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return blocked ? <BlockMobile /> : <App />;
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RecoilRoot>
    <RootWrapper />
  </RecoilRoot>
);
