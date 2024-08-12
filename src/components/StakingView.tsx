import { TonConnectButton } from '@tonconnect/ui-react';

function StakingView(params: {
  currentView: number | undefined,
  mixer_balance: number,
  connected: boolean,
  loadingMixerBalance: boolean,
}) {
  return (
    <div style={{ backgroundColor: 'black', display: params.currentView === 1 ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', gap: 12, border: "0", margin: 0, padding: '20px 0 0 0', width: "100vw", height: "92vh", position: "absolute", top: '8vh', left: 0  }}>
      <div>
        <TonConnectButton />
      </div>
      <div>
        <div className='Card'>
          <b>Mixer balance</b>
          <div>{params.loadingMixerBalance ? 'Loading...' : (params.mixer_balance.toLocaleString('en-US', { maximumFractionDigits: 9 }))}</div>
        </div>
      </div>
    </div>
  );
}

export default StakingView;