import { useState } from 'react';

interface Props {
  address: string;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

export function WalletConnect({ address, onConnect, onDisconnect }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  function handleConnect() {
    if (inputValue.trim()) {
      onConnect(inputValue.trim());
      setShowInput(false);
      setInputValue('');
    }
  }

  if (address) {
    return (
      <div className="wallet-connected">
        <span className="wallet-indicator" />
        <span className="wallet-address" title={address}>
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button className="btn btn-outline btn-sm" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      {showInput ? (
        <div className="wallet-input-row">
          <input
            className="input"
            type="text"
            placeholder="0x… wallet address"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            autoFocus
          />
          <button className="btn btn-primary btn-sm" onClick={handleConnect}>
            Connect
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowInput(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={() => setShowInput(true)}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}
