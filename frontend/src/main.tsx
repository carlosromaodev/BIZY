import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "@fontsource-variable/geist";
import "./estilos.css";
import { aplicarIdentidadeBizy } from "./marca/bizy";

aplicarIdentidadeBizy();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
