import React, {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "./assets/index.module.css";

import App from "./App.tsx";

import {createTheme, MantineProvider} from "@mantine/core";
import {ScryfallCacheProvider} from "./context/ScryfallCacheContext.tsx";

import {trpc, trpcLinks} from "./trpcClient";

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: trpcLinks
});

const theme = createTheme({
  components: {
    Button: {
      defaultProps: {
        variant: "gradient"
      }
    }
  },
  defaultGradient: {
    from: "red",
    to: "yellow",
    deg: 45
  },
  primaryColor: "orange",
  cursorType: "pointer"
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={theme}>
            <ScryfallCacheProvider>
              <App/>
            </ScryfallCacheProvider>
          </MantineProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </BrowserRouter>
  </StrictMode>
);