import "./lib/vite-hmr-fix"; // Must be first to prevent RefreshRuntime errors
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/react-guardian"; // Import guardian to prevent React errors

// Wrap in try-catch to prevent startup errors
try {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  // Fallback rendering without StrictMode
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
}
