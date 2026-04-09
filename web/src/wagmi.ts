import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  console.warn(
    '[EarnRebalancer] VITE_WALLET_CONNECT_PROJECT_ID is not set. ' +
    'WalletConnect-based wallets may not work correctly. ' +
    'Get a free project ID at https://cloud.walletconnect.com',
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: 'EarnRebalancer',
  projectId: projectId || 'earnrebalancer-demo',
  chains: [mainnet, polygon, arbitrum, optimism, base],
  ssr: false,
});
