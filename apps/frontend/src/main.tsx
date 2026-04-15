import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import './assets/index.module.css'
import App from './App.tsx'

import {createTheme, MantineProvider} from '@mantine/core';

const queryClient = new QueryClient();

const theme = createTheme({
  components: {
    Button: {
      defaultProps: {
        variant: 'gradient',
      },
    },
  },
  defaultGradient: {
    from: 'red',
    to: 'yellow',
    deg: 45,
  },
  primaryColor: "orange",
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <App/>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)
