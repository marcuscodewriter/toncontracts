import React, { useState, useEffect } from 'react';
import './BridgeView.css';
import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, addDoc, setDoc, getDoc, Timestamp, collection, increment, updateDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const networks = new Map([
  ['TON', 'ton'],
  ['BTC', 'btc'],
  ['ETH', 'eth'],
  ['SOL', 'sol'],
  ['BASE', 'base'],
  ['BSC', 'bsc'],
  ['DOT', 'dot'],
  ['XMR', 'xmr'],
  ['XRP', 'xrp'],
  ['ADA', 'ada'],
  ['ALGO', 'algo'],
  ['APT', 'apt'],
  ['ARB', 'arbitrum'],
  ['ATOM', 'atom'],
  ['AVAX', 'cchain'],
  ['BCH', 'bch'],
  ['BSV', 'bsv'],
  ['CELO', 'celo'],
  ['ETC', 'etc'],
  ['ETHW', 'ethw'],
  ['FTM', 'ftm'],
  ['KAVA', 'kava'],
  ['LTC', 'ltc'],
  ['MATIC', 'matic'],
  ['NEAR', 'near'],
  ['OP', 'op'],
  ['PLS', 'pulse'],
  ['SEI', 'sei'],
  ['TIA', 'tia'],
  ['TRX', 'trx'],
  ['XEC', 'xec'],
  ['XLM', 'xlm'],
  ['XTZ', 'xtz'],
  ['ZEC', 'zec'],
  ['ZIL', 'zil'],
  ['ZKSYNC', 'zksync']
]);

interface BridgeViewProps {
  currentView?: number;
}

interface Currency {
  ticker: string;
  network: string;
  isFiat: boolean;
}

interface ExchangeEstimate {
  toAmount: number;
  transactionSpeedForecast: string;
  warningMessage: string;
  depositFee: number;
}

interface Order {
  credit: number;
  chatId: number | null;
  amount: number | null;
  fromCurrency: string | null;
  toCurrency: string | null;
  toNetwork: string | null;
  fromNetwork: string | null;
  estimatedFee: number;
  estimatedFeeUsd: string;
  recipientAddress: string;
  userRecipientAddress: string;
  messageId: string;
  depositAddress: string;
  status: string;
  step: number;
  toAmount: number | null;
  exchangeId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  estimatedTime: string;
  warningMessage: string;
}

const BridgeView: React.FC<BridgeViewProps> = ({
  currentView
}) => {
  const bridgeApiKey: string = import.meta.env.VITE_BRIDGE_API_KEY;
  const balanceApiKey: string = import.meta.env.VITE_BALANCE_API_KEY;
  const tgBotToken: string = import.meta.env.VITE_TG_BOT_TOKEN;
  const tmaId: number | null = (window as any).Telegram.WebApp.initDataUnsafe.user?.id ?? (window as any).Telegram.WebApp.chat?.id;
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currencies, setCurrencies] = useState<Map<string, Currency[]>>(new Map());
  const [fromCurrency, setFromCurrency] = useState<string | null>(null);
  const [fromNetwork, setFromNetwork] = useState<string | null>(null);
  const [toCurrency, setToCurrency] = useState<string | null>(null);
  const [toNetwork, setToNetwork] = useState<string | null>(null);
  const [fromAmount, setFromAmount] = useState<number | null>(null);
  const [toAmount, setToAmount] = useState<number | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [fetchingOutput, setFetchingOutput] = useState<boolean>(false);
  const [creatingExchange, setCreatingExchange] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_CURRENCIES_API_URL);
      if (response.ok) {
        const data = await response.json();
        const groupedCurrencies = getNetworkGroupedCurrencies(data);
        setCurrencies(groupedCurrencies);
      } else {
        console.error('Failed to load currencies');
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const getNetworkGroupedCurrencies = (currs: Currency[]): Map<string, Currency[]> => {
    const netCurrMap: Map<string, Currency[]> = new Map();
    currs.forEach(cObj => {
      if (cObj.isFiat) return;
      const network = cObj.network.toLowerCase();
      if (!Array.from(networks.keys()).includes(network.toUpperCase()) || !Array.from(networks.values()).includes(network.toLowerCase())) return;
      const currency = cObj.ticker;
      if (!netCurrMap.has(network)) {
        netCurrMap.set(network, []);
      }
      if (!netCurrMap.get(network)?.find(c => c.ticker === currency)) {
        netCurrMap.get(network)!.push(cObj);
      }
    });
    return netCurrMap;
  };

  const estimateOutput = async () => {
    if (fetchingOutput || toAmount !== 0) return;
    setFetchingOutput(true);
    try {
      const response = await fetch(import.meta.env.VITE_ESTIMATE_ENDPOINT + `fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&fromAmount=${fromAmount}&fromNetwork=${fromNetwork}&toNetwork=${toNetwork}`, {
        headers: {
          'Content-Type': 'application/json',
          [import.meta.env.VITE_BRIDGE_HEADER]: bridgeApiKey,
        },
      });
      if (response.ok) {
        const eData: ExchangeEstimate = await response.json();
        setToAmount(Number(eData.toAmount.toFixed(4)));
        setEstimatedFee(Number(eData.depositFee ?? 0));
        setEstimatedTime(eData.transactionSpeedForecast ?? '');
        setWarningMessage(eData.warningMessage ?? '');
        setFetchingOutput(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error fetching output');
        setFetchingOutput(false);
      }
    } catch (error) {
      setError((error as any).toString());
      setFetchingOutput(false);
    }
  };

  // Equivalent function from Flutter: createExchange
  const createExchange = async () => {
    if (creatingExchange || !tmaId) return;
    setCreatingExchange(true);

    try {
      const userDoc = await getDoc(doc(db, `users/${tmaId}`));
      let userCredits = userDoc.data()?.credits ?? 0;
      if (!userDoc.exists()) {
        await setDoc(doc(db, `users/${tmaId}`), {
          credits: 0,
          address: null,
        });
        userCredits = 5;
      }

      let balance = -1;

      if (userDoc.data()?.address != null && userDoc.data()?.address != '') {
        const response = await verifyAddress(userDoc.data()!.address);
        balance = response;
      }

      if (balance < 150000 && userCredits <= 0) {
        setError('Insufficient credits please purchase more by returning to the bridge chat typing /buy');
        setCreatingExchange(false);
        return;
      }

      const networkFeeResponse = await fetch(import.meta.env.VITE_FEE_ENDPOINT + `?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&fromNetwork=${fromNetwork}&toNetwork=${toNetwork}&fromAmount=${fromAmount}&convertedCurrency=${fromCurrency}&convertedNetwork=${fromNetwork}`, {
        headers: {
          'Content-Type': 'application/json',
          [import.meta.env.VITE_BRIDGE_HEADER]: bridgeApiKey,
        },
      });

      const responseData = await networkFeeResponse.json();
      const estimatedFeeUsd = parseFloat(responseData.estimatedFee.converted.total).toFixed(2);

      // Simulate an API call to create exchange
      const response = await fetch(import.meta.env.VITE_BRIDGE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [import.meta.env.VITE_BRIDGE_HEADER]: bridgeApiKey,
        },
        body: JSON.stringify({
          fromCurrency: fromCurrency,
          fromNetwork: fromNetwork,
          toCurrency: toCurrency,
          toNetwork: toNetwork,
          fromAmount: fromAmount,
          address: recipientAddress,
          flow: 'standard',
          type: 'direct',
        }),
      });

      if (response.ok) {
        // Handle successful exchange creation
        const eData = await response.json();
        if (eData.error) {
          setError(eData.error);
          setCreatingExchange(false);
          return;
        }
        const depositAddress = eData.payinAddress;
        const nowTime = Timestamp.now();

        const credit = balance < 150000 ? 1 : 0;
        const chatId = tmaId;

        const order: Order = {
          credit,
          chatId,
          amount: fromAmount,
          fromCurrency: fromCurrency,
          toCurrency: toCurrency,
          toNetwork: toNetwork,
          fromNetwork: fromNetwork,
          estimatedFee,
          estimatedFeeUsd,
          recipientAddress: recipientAddress,
          userRecipientAddress: recipientAddress,
          messageId: '',
          depositAddress,
          status: 'pending',
          step: 0,
          toAmount: toAmount,
          exchangeId: eData.id,
          createdAt: nowTime,
          updatedAt: nowTime,
          estimatedTime,
          warningMessage,
        };

        const ref = await addDoc(collection(db, 'orders'), order);
        await updateDoc(doc(db, `users/${tmaId}`), {
          credits: increment(-credit),
        });
        const qrUrl = import.meta.env.VITE_QR_ENDPOINT + `&data=${fromCurrency == 'ton' ? `ton://transfer/${depositAddress}?amount=${((fromAmount ?? 0) * Math.pow(10, 9)).toFixed(0)}` : depositAddress}`;
        const msg = escapeMarkdown(
          `*Bridge Order:* \`${ref.id}\`\n\n*${fromAmount} \$${fromCurrency!.toUpperCase()} (${fromNetwork!.toUpperCase()})  🔀  ${toAmount} \$${toCurrency!.toUpperCase()} (${toNetwork!.toUpperCase()})*\nNetwork Fee: *\$${estimatedFeeUsd} USD*\nDuration: *${estimatedTime} minutes*${warningMessage !== '' ? `\nWarning: *${warningMessage}*` : ''}\nRecipient: *\`${recipientAddress}\`*\n\nSend *${fromAmount} \$${fromCurrency!.toUpperCase()} (${fromNetwork!.toUpperCase()})* to the bridge address 👇\n\n\`${depositAddress}\`${fromCurrency === 'xrp' ? `\n\nDestination Tag: \`${eData['payinExtraId']}\`` : (fromCurrency === 'atom' || fromCurrency === 'xlm' ? `\n\nMemo: \`${eData['payinExtraId']}\`` : '')}\n(Click to copy)\n\n*Status:* Pending... ⏳\n\n`) +
      `_Please allow a few minutes for confirmation after sending_`;
      
        const messageResponse = await fetch(import.meta.env.VITE_TG_BOT_ENDPOINT + `${tgBotToken}/sendPhoto`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            photo: qrUrl,
            caption: msg,
            parse_mode: 'MarkdownV2',
            reply_markup: {
              inline_keyboard: fromCurrency === 'ton'
              ? [
                  [
                    {
                      text: '✈️  BRIDGE ${fromAmount} \$TON  ✈️',
                      url:
                          `ton://transfer/${depositAddress}?amount=${fromAmount! * Math.pow(10, 9)}`
                    }
                  ],
                  [
                    {'text': 'Cancel ❌', 'callback_data': 'dismiss'}
                  ]
                ]
              : [
                  [
                    {'text': 'Cancel ❌', 'callback_data': 'dismiss'}
                  ]
                ],
            },
          }),
        });

        const messageData = await messageResponse.json();
        const messageId = messageData.result.message_id;
        await updateDoc(ref, {
          messageId,
        });
        setCreatingExchange(false);
        (window as any).Telegram.WebApp.openTelegramLink('https://t.me/ton_mix_bot');
        (window as any).Telegram.WebApp.close();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error creating exchange');
      }
    } catch (e) {
      setError((e as any).toString());
    } finally {
      setCreatingExchange(false);
    }
  };

  // Equivalent function from Flutter: verifyAddress
  const verifyAddress = async (address: string) => {
    try {
      const balanceResponse = await fetch(
        import.meta.env.VITE_BALANCE_ENDPOINT + `${address}/jettons/EQAdFbynSUlzIlh_I4fXuYaer3rvY0TG0BK-NQZ-Y871pZoM`,
        {
          headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${balanceApiKey}`,
        },
      });

      const stringBalance = (await balanceResponse.json()).balance;
      const balanceLarge = parseInt(stringBalance);
      const divisor = Math.pow(10, 9);
      const balance = balanceLarge / divisor;

      return balance;
    } catch (error) {
      console.log(error);
      setError((error as any).toString());
      return 0;
    }
  };

  // // Equivalent function from Flutter: escapeMarkdown
  const escapeMarkdown = (text: string) => {
    // Escape markdown logic here
    return text.replace(/([_{}[\]|()#+-.!])/g, '\\$1');
  };

  const goToPreviousStep = () => {
    console.log(fromAmount, fromCurrency, fromNetwork, toCurrency, toNetwork, recipientAddress);
    if (currentStep > 0) {
      setError('');
      const _cs = currentStep;
      setCurrentStep(currentStep - 1);
      if (_cs === 1 && fromAmount && fromNetwork && fromCurrency) {
        setQuery(`\$${fromCurrency.toUpperCase()} (${fromNetwork.toUpperCase()})`);
      } else if (_cs === 2 && toCurrency && toNetwork) {
        setQuery(`\$${toCurrency.toUpperCase()} (${toNetwork.toUpperCase()})`);
      } else if (_cs === 3) {
        estimateOutput();
      } else {
        setQuery('');
      }
    }
  };

  const goToNextStep = () => {
    if (currentStep < 3) {
      setError('');
      const _cs = currentStep;
      setCurrentStep(currentStep + 1);
      if (_cs === 0 && toNetwork && toCurrency) {
        setQuery(`\$${toCurrency.toUpperCase()} (${toNetwork.toUpperCase()})`);
      } else if (_cs === 1) {
        estimateOutput();
      } else {
        setQuery('');
      }
    }
  };

  return (
    <div className="bridge-view" style={{ display: currentView === 0 ? 'block' : 'none'}}>
      {currencies.size === 0
      ? (<div>
          <div className="loading" style={{ fontSize: 18, opacity: 0.9 }}>Loading currencies...</div>
          <img src="infinite_white.gif"></img>
        </div>)
      : (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <br/>
        <div className="stepper-indicator">
          {['Origin', 'Destination', 'Recipient', 'Summary'].map((label, index) => (
            <StepWidget key={index} step={index} currentStep={currentStep} label={label} />
          ))}
        </div>
        <div style={{  borderRadius: 14, backgroundColor: !(fromAmount || fromCurrency) ? 'transparent' : 'rgb(21,21,21)', display: !(fromAmount || fromCurrency) ? 'none' : 'flex', alignItems: 'center', textAlign: 'center', height: 32, margin: '8px 0 12px', padding: '4px 14px', width: 'fit-content', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          {`${fromAmount ? fromAmount : ''} ${(fromCurrency ? `$${fromCurrency}` : '').toUpperCase()} ${(fromNetwork ? `(${fromNetwork})` : '').toUpperCase()} ${!toCurrency ? '' : `${' '}🔀${' '}`} ${toAmount ? toAmount : ''} ${(toCurrency ? `$${toCurrency}` : '').toUpperCase()} ${(toNetwork ? `(${toNetwork})` : '').toUpperCase()}`}
        </div>
        <div className="scroll-view">
          <div className="content">
            {currentStep === 0 && (
              <div>
                <UnifiedSearch
                  query={query}
                  currentStep={currentStep}
                  options={Array.from(currencies.entries()).flatMap(([network, currs]) =>
                    currs.map(curr => `$${curr.ticker} (${network})`)
                  ).filter(option => option.toLowerCase().includes(query.toLowerCase()) || query === '')}
                  onSelected={(selection) => {
                    const [currency, network] = selection.split(' ');
                    setFromCurrency(currency.slice(1).toLowerCase());
                    setFromNetwork(network.slice(1, -1).toLowerCase());
                  }}
                  onSearch={setQuery}
                  selectedOption={fromCurrency && fromNetwork ? `$${fromCurrency.toUpperCase()} (${fromNetwork.toUpperCase()})` : undefined}
                />
                <AmountField
                  value={fromAmount ?? 0}
                  onChange={(value) => {
                    setFromAmount(value);
                    setToAmount(0);
                    setEstimatedFee(0);
                    setEstimatedTime('');
                    setWarningMessage('');
                  }}
                />
              </div>
            )}
            {currentStep === 1 && (
              <UnifiedSearch
                query={query}
                currentStep={currentStep}
                options={Array.from(currencies.entries()).flatMap(([network, currs]) =>
                  currs.map(curr => `$${curr.ticker} (${network})`)
                ).filter(option => option.toLowerCase().includes(query.toLowerCase()) || query === '')}
                onSelected={(selection) => {
                  const [currency, network] = selection.split(' ');
                  setToCurrency(currency.slice(1).toLowerCase());
                  setToNetwork(network.slice(1, -1).toLowerCase());
                }}
                onSearch={setQuery}
                selectedOption={toCurrency && toNetwork ? `$${toCurrency.toUpperCase()} (${toNetwork.toUpperCase()})` : undefined}
              />
            )}
            {currentStep === 2 && (
              <div>
                {fetchingOutput ? (
                  <div className="loading">Calculating output...</div>
                ) : (
                  <></>
                )}
                <div className='unified-search'>
                  {/* <div>{`${fromAmount} ${fromCurrency?.toUpperCase()} (${fromNetwork?.toUpperCase()}) 🔀 ${toAmount} ${toCurrency?.toUpperCase()} (${toNetwork?.toUpperCase()})`}</div> */}
                  <input
                    autoComplete='off'
                    autoCorrect='off'
                    autoCapitalize='off'
                    type="text"
                    placeholder="Recipient Address"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                  />
                  <button onClick={async () => {
                    setRecipientAddress(await navigator.clipboard.readText());
                  }} style={{ cursor: 'pointer', fontSize: 15 }}>Paste</button>
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div style={{ textAlign: 'center', maxWidth: '77%', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                {/* <div>{`${fromAmount} ${fromCurrency?.toUpperCase()} (${fromNetwork?.toUpperCase()}) 🔀 ${toAmount} ${toCurrency?.toUpperCase()} (${toNetwork?.toUpperCase()})`}</div> */}
                <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center', fontSize: '17px', width: '100%', fontWeight: 'bold', backgroundColor: 'rgb(21,21,21)', borderRadius: 12, padding: '8px 12px', margin: '8px auto 8px auto' }}>
                  Recipient:
                  <span onClick={() => {
                    navigator.clipboard.writeText(recipientAddress);
                  }} style={{ cursor: 'pointer', fontSize: 15 }}><em>{recipientAddress.slice(0,4)}...{recipientAddress.slice(-4)}</em></span>
                </div>
              </div>
            )}
          </div>
          <div className="navigation">
            {currentStep > 0 && (
              <button
                onClick={goToPreviousStep}
                disabled={creatingExchange && currentStep === 3}
              >
                  Back
              </button>
            )}
            {currentStep < 3 && (
              <button
                onClick={goToNextStep}
                disabled={!(fromCurrency && fromNetwork && fromAmount && fromAmount > 0) && currentStep === 0 || !(toCurrency && toNetwork) && currentStep === 1 || !(recipientAddress && !fetchingOutput) && currentStep === 2}
              >
                Next
              </button>
            )}
            {currentStep === 3 && (
              <button onClick={createExchange} disabled={creatingExchange}>
                {creatingExchange ? 'Creating Exchange...' : 'Submit'}
              </button>
            )}
          </div>
          {error && <div className="error">{error}</div>}
        </div>
        </div>)}
    </div>
  );
};

interface StepWidgetProps {
  step: number;
  currentStep: number;
  label: string;
}

const StepWidget: React.FC<StepWidgetProps> = ({ step, currentStep, label }) => {
  const isSelected = step === currentStep;
  return (
    <div className={`step-widget ${isSelected ? 'selected' : ''}`}>
      <div className="circle">{step + 1}</div>
      <div style={{ color: isSelected ? 'green' : 'white' }} className="label">{label}</div>
    </div>
  );
};

interface UnifiedSearchProps {
  query: string;
  currentStep: number;
  options: string[];
  onSelected: (selection: string) => void;
  onSearch: (query: string) => void;
  selectedOption?: string;
}

const chunkArray = (array: Array<any>, size: number) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

const AmountField: React.FC<{ value: number, onChange: (value: number) => void }> = ({ value, onChange }) => {
  return (
    <div className="unified-search">
      {/* <div>{label}</div> */}
      <input
        autoComplete='off'
        autoCorrect='off'
        autoCapitalize='off'
        type="number"
        min={0}
        onFocus={(e) => {
          if (e.target.value === '0') {
            e.target.value = '';
          }
        }}
        placeholder={`Amount`}
        value={isNaN(value) ? '' : value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({ query, currentStep, options, onSelected, onSearch, selectedOption }) => {
  return (
    <div className="unified-search">
      {/* <div>{currentStep === 0 ? 'Select Origin' : 'Select Destination'}</div> */}
      <input
        autoComplete='off'
        autoCorrect='off'
        autoCapitalize='off'
        type="text"
        placeholder={"Search " + (currentStep === 0 ? 'origin' : 'destination') + " currency"}
        value={query.toUpperCase()}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="options">
        {chunkArray(options, 1).map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} style={{ padding: 0, margin: '10px' }}>
            {row.map((option, index) => (
              <div key={index} style={{ color: selectedOption === option.toUpperCase() ? 'green' : 'white' }} className={`option ${selectedOption === option.toUpperCase() ? 'selected' : ''}`} onClick={() => onSelected(option)}>
                {option.toUpperCase()}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BridgeView;