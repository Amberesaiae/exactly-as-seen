import { createRoot } from "react-dom/client";
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import App from "./App.tsx";
import "./index.css";
import { setupOnlineListener } from "./lib/sync";

setupOnlineListener();

createRoot(document.getElementById("root")!).render(<App />);
