import './App.css';
import { useMainContract } from './hooks/useMainContract';
import { useTonConnect } from './hooks/useTonConnect';
import { useState } from 'react';
import BridgeView from './components/BridgeView';
import StakingView from './components/StakingView';

function App() {
  const {
    contract_address,
    counter_value,
    contract_balance,
    sendIncrement,
    sendDeposit,
    sendWithdrawalRequest,
  } = useMainContract();

  const { connected } = useTonConnect();

  const [currentView, setCurrentView] = useState(0);

  return (
    <div style={{ backgroundColor: 'black', overflow: 'hidden' }}>
      <div style={{ backgroundColor: 'black', height: '8vh', overflow: 'hidden' }}>
        <button style={{ position: 'absolute', top: 0, left: 0, width: '50vw', height: '8vh', border: currentView === 0 ? '1px solid #66bb6a' : '', color: currentView === 0 ? 'rgb(14, 133, 14)' : 'white'}} onClick={() => setCurrentView(0)}>$MIXER Bridge</button>
        <button disabled={!((window as any).Telegram.WebApp.user?.id || (window as any).Telegram.WebApp.chat?.id)} style={{ position: 'absolute', top: 0, right: 0, width: '50vw', height: '8vh', border: currentView === 1 ? '1px solid #66bb6a' : '', color: currentView === 1 ? 'rgb(14, 133, 14)' : 'gray'}} onClick={() => {
          if (((window as any).Telegram.WebApp.user?.id ?? (window as any).Telegram.WebApp.chat?.id) === 1919939789) {
            setCurrentView(1);
          }
        }}><em>Staking (Soon)</em></button>
      </div>
      <BridgeView currentView={currentView} />
      <StakingView
        connected={connected}
        currentView={currentView}
        contract_address={contract_address}
        counter_value={counter_value}
        contract_balance={contract_balance}
        sendIncrement={sendIncrement}
        sendDeposit={sendDeposit}
        sendWithdrawalRequest={sendWithdrawalRequest}
      />
    </div>
  );
}

export default App;