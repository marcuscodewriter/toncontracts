import { TonConnectButton } from '@tonconnect/ui-react';

function StakingView(params: {
  currentView: number | undefined,
  mixer_balance: number | undefined,
  connected: boolean,
  loadingMixerBalance: boolean,
  stake: number | null,
  rewards: number | null,
  loadingStakeData: boolean
}) {
  return (
    <div style={{ backgroundColor: 'black', display: params.currentView === 1 ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', gap: 12, border: "0", margin: 0, padding: '20px 0 0 0', width: "100vw", height: "calc(92vh - 20px)", position: "absolute", top: '8vh', left: 0  }}>
      <div style={{ backgroundColor: 'black', display: params.currentView === 1 ? 'flex' : 'none', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', maxHeight: 50, gap: 20, border: "0", margin: '15px 0 20px 0', padding: 0 }}>
        <div style={{ display: params.mixer_balance ? 'block' : 'none'}}>
          <b>{params.loadingMixerBalance ? 'Loading...' : params.mixer_balance ? `${params.mixer_balance.toLocaleString()} $MIXER` : ''} </b>
        </div>
        <div>
          <TonConnectButton />
        </div>
      </div>
      <div style={{ marginBottom: 20}}>
        <div style={{ marginBottom: 8}}>
          <b>Amount Staked: <span style={{ marginLeft: 6, marginRight: 2 }}>{params.loadingStakeData ? 'Loading...' : params.stake}</span> $MIXER</b>
        </div>
        <div>
          <button>Deposit</button>
          <span>{" "}</span>
          <button>Withdraw</button>
        </div>
      </div>
      <div>
        <div style={{ marginBottom: 8}}>
          <b>Rewards Earned: <span style={{ marginLeft: 6, marginRight: 2 }}>{params.loadingStakeData ? 'Loading...' : params.rewards}</span> $TON</b>
        </div>
        <div>
          <button>Claim</button>
        </div>
      </div>
    </div>
  );
}

export default StakingView;