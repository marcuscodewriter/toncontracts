import './App.css';
import { useTonConnect } from './hooks/useTonConnect';
import { useEffect, useState } from 'react';
import BridgeView from './components/BridgeView';
import StakingView from './components/StakingView';
import { useTonClient } from './hooks/useTonClient';
import { Address, OpenedContract } from 'ton-core';
import { JettonMaster, JettonWallet } from 'ton';
import { useTonConnectUI } from '@tonconnect/ui-react';

function App() {

  const client = useTonClient();

  const { connected, connectedAddress } = useTonConnect();

  const [tonConnectUI] = useTonConnectUI();

  const [loadingMixerBalance, setLoadingMixerBalance] = useState(false);

  tonConnectUI.onStatusChange(async (wallet) => {
    if (!client || !wallet) {
      setMixerBalance(0);
      return;
    }
    setLoadingMixerBalance(true);
    const contract = JettonMaster.create(
      Address.parse("EQAdFbynSUlzIlh_I4fXuYaer3rvY0TG0BK-NQZ-Y871pZoM")
    );
    const jettonContract = client.open(contract) as OpenedContract<JettonMaster>;
    if (!jettonContract || !wallet.account?.address) return 0;
    const jettonWalletAddress = await jettonContract.getWalletAddress(Address.parse(wallet.account!.address));
    const jettonWalletContract = client.open(JettonWallet.create(jettonWalletAddress)) as OpenedContract<JettonWallet>;
    
    if (!jettonWalletContract) return;
    jettonWalletContract.getBalance().then(_mixerBalance => {
      const formattedBalance = parseInt(_mixerBalance.toString()) / (10 ** 9);
      setMixerBalance(formattedBalance);
    }).catch(() => {
      setMixerBalance(0);
    }).finally(() => {
      setLoadingMixerBalance(false);
    })
  });

  useEffect(() => {
    async function go() {
      if (connectedAddress) {
        if (!client) {
          setMixerBalance(0);
          return;
        }
        const contract = JettonMaster.create(
          Address.parse("EQAdFbynSUlzIlh_I4fXuYaer3rvY0TG0BK-NQZ-Y871pZoM")
        );
        const jettonContract = client.open(contract) as OpenedContract<JettonMaster>;
        if (!jettonContract || !connectedAddress) return 0;
        const jettonWalletAddress = await jettonContract.getWalletAddress(connectedAddress);
        const jettonWalletContract = client.open(JettonWallet.create(jettonWalletAddress)) as OpenedContract<JettonWallet>;
        
        if (!jettonWalletContract) return;
        jettonWalletContract.getBalance().then(_mixerBalance => {
          const formattedBalance = parseInt(_mixerBalance.toString()) / (10 ** 9);
          setMixerBalance(formattedBalance);
        }).catch(() => {
          setMixerBalance(0);
        });
      }
    }
    go();
  },[connectedAddress]);

  const [currentView, setCurrentView] = useState(0);

  const [mixerBalance, setMixerBalance] = useState(0);

  return (
    <div style={{ backgroundColor: 'black', overflow: 'hidden' }}>
      <div style={{ backgroundColor: 'black', height: '8vh', overflow: 'hidden' }}>
        <button style={{ position: 'absolute', top: 0, left: 0, width: '50vw', height: '8vh', border: currentView === 0 ? '1px solid #66bb6a' : '', color: currentView === 0 ? 'rgb(14, 133, 14)' : 'white'}} onClick={() => setCurrentView(0)}>$MIXER Bridge</button>
        <button 
        disabled={!((window as any).Telegram.WebApp.initDataUnsafe.user?.id || (window as any).Telegram.WebApp.chat?.id)}
          style={{ position: 'absolute', top: 0, right: 0, width: '50vw', height: '8vh', border: currentView === 1 ? '1px solid #66bb6a' : '', color: currentView === 1 ? 'rgb(14, 133, 14)' : 'gray'}} onClick={() => {
          if (Number((window as any).Telegram.WebApp.initDataUnsafe.user?.id ?? (window as any).Telegram.WebApp.chat?.id) === 1919939789) {
            setCurrentView(1);
          }
        }}><em>Staking (Soon)</em></button>
      </div>
      <BridgeView currentView={currentView} />
      <StakingView
        connected={connected}
        currentView={currentView}
        mixer_balance={mixerBalance}
        loadingMixerBalance={loadingMixerBalance}
      />
    </div>
  );
}

export default App;