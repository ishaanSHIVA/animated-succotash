// import Main from "../components/Main.jsx";
const Sidebar = require("../components/Sidebar.jsx");
import React from "react";
import { withRouter } from "react-router-dom";

const styles = {
  container: "h-full w-full flex bg-[#fff]",
};
export default function Home() {
  return (
    <div className={styles.container}>
      {/* hello */}
      {/* <Sidebar /> */}
      <h1>hi</h1>
      {/* <Main /> */}
    </div>
  );
}
