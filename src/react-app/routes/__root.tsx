import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { ThemeProvider } from "../components/theme-provider"; // <--- Import this

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    // Wrap the app in the ThemeProvider
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <React.Fragment>
            <Outlet />
            {/* The Toaster shows the popups for invitations */}
            <Toaster richColors position="top-right" />
        </React.Fragment>
    </ThemeProvider>
  );
}