import React, { useState, useEffect } from 'react';
import './BridgeView.css';

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
  amount: number;
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
  toAmount: number;
  exchangeId: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime: string;
  warningMessage: string;
}

const BridgeView: React.FC<BridgeViewProps> = ({
  currentView
}) => {
  const changeNowApiKey: string = "9e27b09a64a0a1251c512396f77b7d41484804d2bc80bcf16b3aff8894679e13";
  const tonConsoleApiKey: string = "AFOY3TQXSDIHJIYAAAAACL3Q2BJWZAXFIGT5LZDNPBPHJXKNEHYA7XDDWFIWGQMYRCG333Q";
  const tgBotToken: string = "6672603630:AAGcfOtvXAqT6BRqqN8aKW4qcnah5sS05I4";
  const tmaId: number | null = (window as any).Telegram.WebApp.initDataUnsafe.user?.id ?? (window as any).Telegram.WebApp.chat?.id;
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currencies, setCurrencies] = useState<Map<string, Currency[]>>(new Map());
  const [fromCurrency, setFromCurrency] = useState<string | null>(null);
  const [fromNetwork, setFromNetwork] = useState<string | null>(null);
  const [toCurrency, setToCurrency] = useState<string | null>(null);
  const [toNetwork, setToNetwork] = useState<string | null>(null);
  const [fromAmount, setFromAmount] = useState<number | null>(null);
  const [toAmount, setToAmount] = useState<number | null>(null);
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
      const response = await fetch('https://api.changenow.io/v2/exchange/currencies?active=true&flow=standard');
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
      const response = await fetch(`https://api.changenow.io/v2/exchange/estimated-amount?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&fromAmount=${fromAmount}&fromNetwork=${fromNetwork}&toNetwork=${toNetwork}&flow=standard`, {
        headers: {
          'Content-Type': 'application/json',
          'x-changenow-api-key': changeNowApiKey,
        },
      });
      if (response.ok) {
        const eData: ExchangeEstimate = await response.json();
        setToAmount(Number(eData.toAmount.toFixed(4)));
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
    if (creatingExchange) return;
    setCreatingExchange(true);
    try {
      // Mocking some firebase logic and handling API responses
      // Please replace with actual logic
      const order: Order = {
        credit: 1,
        chatId: tmaId ?? null,
        amount: fromAmount ?? 0,
        fromCurrency: fromCurrency,
        toCurrency: toCurrency,
        toNetwork: toNetwork,
        fromNetwork: fromNetwork,
        estimatedFee: 0,
        estimatedFeeUsd: '',
        recipientAddress: recipientAddress,
        userRecipientAddress: recipientAddress,
        messageId: '',
        depositAddress: '',
        status: 'pending',
        step: 0,
        toAmount: toAmount ?? 0,
        exchangeId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedTime: '',
        warningMessage: '',
      };

      // Simulate an API call to create exchange
      const response = await fetch('https://api.changenow.io/v2/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-changenow-api-key': changeNowApiKey,
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
        order.exchangeId = eData.id;
        order.depositAddress = eData.payinAddress;
        // ... (other success logic)
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
      const tonConsoleResponse = await fetch(
        'https://tonapi.io/v2/accounts/$address/jettons/EQAdFbynSUlzIlh_I4fXuYaer3rvY0TG0BK-NQZ-Y871pZoM',
        {
          headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${tonConsoleApiKey}`,
        },
      });

      const stringBalance = (await tonConsoleResponse.json())['balance'];
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

  // Equivalent function from Flutter: escapeMarkdown
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
        <div style={{  borderRadius: 14, backgroundColor: !(fromAmount && fromCurrency) ? 'transparent' : 'rgb(21,21,21)', display: 'flex', alignItems: 'center', textAlign: 'center', height: 32, margin: '8px 0 12px', padding: '4px 14px', width: 'fit-content', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          {`${fromAmount && fromCurrency ? fromAmount : ''} ${(fromCurrency ? `$${fromCurrency}` : '').toUpperCase()} ${(fromNetwork ? `(${fromNetwork})` : '').toUpperCase()} ${!toCurrency ? '' : `${' '}🔀${' '}`} ${toAmount ? toAmount : ''} ${(toCurrency ? `$${toCurrency}` : '').toUpperCase()} ${(toNetwork ? `(${toNetwork})` : '').toUpperCase()}`}
        </div>
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
                label="Amount"
                value={fromAmount ?? 0}
                onChange={(value) => {
                  setFromAmount(value);
                  setToAmount(0);
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
                  type="text"
                  placeholder="Recipient Address"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
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

const AmountField: React.FC<{ label: string, value: number, onChange: (value: number) => void }> = ({ label, value, onChange }) => {
  return (
    <div className="unified-search">
      {/* <div>{label}</div> */}
      <input
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