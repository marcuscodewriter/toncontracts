import './App.css';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useMainContract } from './hooks/useMainContract';
import { useTonConnect } from './hooks/useTonConnect';
import { fromNano } from 'ton-core';
import { useState } from 'react';

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
    <div>
      <div>
        <button style={{ position: 'absolute', top: 0, left: 0, width: '50vw', height: '8vh', border: currentView === 0 ? '1px solid #66bb6a' : '', color: currentView === 0 ? 'green' : 'white'}} onClick={() => setCurrentView(0)}>$MIXER Bridge</button>
        <button disabled={true} style={{ position: 'absolute', top: 0, right: 0, width: '50vw', height: '8vh', border: currentView === 1 ? '1px solid #66bb6a' : '', color: currentView === 1 ? 'green' : 'white'}}>Staking (Soon)</button>
      </div>
      <iframe style={{ backgroundColor: 'black', display: currentView == 0 ? 'flex' : 'none', border: "0", margin: 0, padding: 0, width: "100vw", height: "92vh", position: "absolute", top: '8vh', left: 0 }} src='https://marcuscodewriter.github.io/fluttermix'></iframe>
      <div style={{ display: currentView == 1 ? 'block' : 'none' }}>
        <div>
          <TonConnectButton />
        </div>
        <div>
          <div className='Card'>
            <b>Our contract address</b>
            <div className='Hint'>{contract_address?.slice(0,30) + '...'}</div>
            <b>Our contract balance</b>
            {contract_balance && (<div className='Hint'>{fromNano(contract_balance)}</div>)}
          </div>

          <div className='Card'>
            <b>Counter value</b>
            <div>{String(counter_value) ?? "Loading..."}</div>
          </div>

          {connected && (
            <a onClick={() => {
              sendIncrement();
            }}>
              Increment by 5
            </a>
          )}

          <br/>

          {connected && (
            <a onClick={() => {
              sendDeposit();
            }}>
              Request deposit of 1 TON
            </a>
          )}

          <br/>

          {connected && (
            <a onClick={() => {
              sendWithdrawalRequest();
            }}>
              Request 0.7 TON withdrawal
            </a>
          )}
          </div>
      </div>
    </div>
  );
}

export default App;