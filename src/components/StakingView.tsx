import { TonConnectButton } from '@tonconnect/ui-react';

function StakingView(params: {
  currentView: number | undefined,
  mixer_balance: number,
  connected: boolean,
  loadingMixerBalance: boolean,
}) {
  return (
    <div style={{ backgroundColor: 'black', display: params.currentView === 1 ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', gap: 12, border: "0", margin: 0, padding: '20px 0 0 0', width: "100vw", height: "92vh", position: "absolute", top: '8vh', left: 0  }}>
      <div style={{ backgroundColor: 'black', display: params.currentView === 1 ? 'flex' : 'none', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', maxHeight: 50, gap: 20, border: "0", margin: '15px 0 20px 0', padding: 0 }}>
        <div>
          <TonConnectButton />
        </div>
        <div>
          <b>{params.loadingMixerBalance ? 'Loading...' : (params.mixer_balance.toLocaleString())} </b><span style={{ marginLeft: 4, color: 'green' }}>$MIXER</span>
        </div>
      </div>
      <div style={{ marginBottom: 20}}>
        <div style={{ marginBottom: 8}}>
          <b>Amount Staked:</b>
        </div>
        <div>
          <button>Deposit</button>
          <span>{" "}</span>
          <button>Withdraw</button>
        </div>
      </div>
      <div>
        <div style={{ marginBottom: 8}}>
          <b>Rewards Earned:</b>
        </div>
        <div>
          <button>Claim</button>
        </div>
      </div>
    </div>
  );
}

export default StakingView;