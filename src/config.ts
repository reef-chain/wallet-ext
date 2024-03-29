let defaultReefNetwork = "mainnet";

if (process.env.NODE_ENV === "development") {
  defaultReefNetwork = "testnet";
}

export const DEFAULT_REEF_NETWORK = defaultReefNetwork;

export type AvailableNetwork = "mainnet" | "testnet";

export type ReefNetwork = {
  id: AvailableNetwork;
  name: string;
  rpcUrl: string;
  reefScanUrl: string;
  genesisHash: string;
};

const ReefMainnet: ReefNetwork = {
  id: "mainnet",
  name: "Reef Mainnet",
  rpcUrl: "wss://rpc.reefscan.com/ws",
  reefScanUrl: "https://reefscan.com",
  genesisHash:
    "0x7834781d38e4798d548e34ec947d19deea29df148a7bf32484b7b24dacf8d4b7",
};

const ReefTestnet: ReefNetwork = {
  id: "testnet",
  name: "Reef Scuba (testnet)",
  rpcUrl: "wss://rpc-testnet.reefscan.com/ws",
  reefScanUrl: "https://testnet.reefscan.com",
  genesisHash:
    "0xb414a8602b2251fa538d38a9322391500bd0324bc7ac6048845d57c37dd83fe6",
};

export const reefNetworks: Record<AvailableNetwork, ReefNetwork> = {
  ["mainnet"]: ReefMainnet,
  ["testnet"]: ReefTestnet,
};
