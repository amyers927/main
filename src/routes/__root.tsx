import * as React from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { HeadContent, Scripts } from "@tanstack/react-router";
import "../styles.css";

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: () => <p>Not Found</p>,
});

function Root() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/logo192.png?v=2" />
        <link rel="manifest" href="/manifest.json?v=2" />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
