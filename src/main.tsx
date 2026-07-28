
  import "./styles/brand.css";
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  // Re-imported after index.css/theme.css so brand.css's :root token
  // redirections win the cascade (theme.css defines the same custom
  // properties with its old blue palette).
  import "./styles/brand.css";
  import "./app/styles/tool.css";

  createRoot(document.getElementById("root")!).render(<App />);
