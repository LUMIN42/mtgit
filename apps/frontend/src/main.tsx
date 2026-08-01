import React, {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "./assets/index.module.css";

import App from "./App.tsx";

import {createTheme, MantineProvider} from "@mantine/core";
import {ScryfallCacheProvider} from "./context/CardCacheContext.tsx";

import {trpcHooks, trpcLinks} from "./trpcClient";
import {Notifications} from "@mantine/notifications";
import "@mantine/notifications/styles.css";

const queryClient = new QueryClient();

const trpcClient = trpcHooks.createClient({
  links: trpcLinks
});

const theme = createTheme({
  components: {
    Button: {
      defaultProps: {
        variant: "gradient"
      },
      styles: {
        root: {
          "&:disabled": {
            cursor: "wait"
          }
        }
      }
    },
    Loader: {
      defaultProps: {
        type: "dots"
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
      <trpcHooks.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={theme}>
            <ScryfallCacheProvider>
              <Notifications/>
              <App/>
            </ScryfallCacheProvider>
          </MantineProvider>
        </QueryClientProvider>
      </trpcHooks.Provider>
    </BrowserRouter>
  </StrictMode>
);