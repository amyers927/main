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
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}