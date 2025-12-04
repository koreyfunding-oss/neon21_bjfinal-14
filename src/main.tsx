import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { protectConsole } from "./lib/security";

// Initialize production security measures
protectConsole();

createRoot(document.getElementById("root")!).render(<App />);
