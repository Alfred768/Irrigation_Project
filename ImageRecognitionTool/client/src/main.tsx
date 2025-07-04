import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set document title
document.title = "Smart Irrigation Forecasting System";

createRoot(document.getElementById("root")!).render(<App />);
