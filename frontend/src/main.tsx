import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

if (typeof document !== "undefined" && document.documentElement) {
  document.documentElement.classList.add("js");
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
