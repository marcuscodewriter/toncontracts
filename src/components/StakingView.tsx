import { TonConnectButton } from '@tonconnect/ui-react';
import { fromNano } from 'ton-core';

function StakingView(params: {
  currentView: number | undefined,
  contract_address: string | undefined,
  counter_value: Number | undefined,
  contract_balance: number | null,
  sendIncrement: () => void,
  sendDeposit: () => void,
  sendWithdrawalRequest: () => void,
  connected: boolean,
}) {
  return (
    <div style={{ backgroundColor: 'black', display: params.currentView === 1 ? 'block' : 'none', border: "0", margin: 0, padding: 0, width: "100vw", height: "92vh", position: "absolute", top: '8vh', left: 0  }}>
      <div>
        <TonConnectButton />
      </div>
      <div>
        <div className='Card'>
          <b>Our contract address</b>
          <div className='Hint'>{params.contract_address?.slice(0,30) + '...'}</div>
          <b>Our contract balance</b>
          {params.contract_balance && (<div className='Hint'>{fromNano(params.contract_balance)}</div>)}
        </div>

        <div className='Card'>
          <b>Counter value</b>
          <div>{String(params.counter_value) ?? "Loading..."}</div>
        </div>

        {params.connected && (
          <a onClick={() => {
            params.sendIncrement();
          }}>
            Increment by 5
          </a>
        )}

        <br/>

        {params.connected && (
          <a onClick={() => {
            params.sendDeposit();
          }}>
            Request deposit of 1 TON
          </a>
        )}

        <br/>

        {params.connected && (
          <a onClick={() => {
            params.sendWithdrawalRequest();
          }}>
            Request 0.7 TON withdrawal
          </a>
        )}
        </div>
    </div>
  );
}

export default StakingView;