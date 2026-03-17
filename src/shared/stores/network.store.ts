import { create } from 'zustand';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isBackendReachable: boolean;
  setNetworkState: (isConnected: boolean, isInternetReachable: boolean | null) => void;
  setBackendReachable: (reachable: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  isInternetReachable: null,
  isBackendReachable: true,

  setNetworkState: (isConnected, isInternetReachable) => set({ isConnected, isInternetReachable }),
  setBackendReachable: (reachable) => set({ isBackendReachable: reachable }),
}));
