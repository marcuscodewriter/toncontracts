import ReactDOM from "react-dom/client";
import App from './App';
import './index.css';
import { TonConnectUIProvider } from "@tonconnect/ui-react";

const manifestUrl = "https://marcuscodewriter.github.io/toncontracts/tonconnect-manifest.json";

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <App />
  </TonConnectUIProvider>,
);