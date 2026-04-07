import { useState, useEffect, useCallback } from 'react';
import { fetchTransactionHistory, Transfer, Extrinsic } from './queries';

export interface TransactionHistoryState {
  transfers: Transfer[];
  extrinsics: Extrinsic[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface UseTransactionHistoryResult extends TransactionHistoryState {
  loadMore: () => void;
  refresh: () => void;
}

const ITEMS_PER_PAGE = 20;

/**
 * React hook to fetch and manage transaction history
 *
 * @param graphqlUrl - GraphQL endpoint URL (mainnet or testnet)
 * @param address - Blockchain address to query transactions for
 * @returns Transaction history state and actions
 *
 * @example
 * const { transfers, loading, error, loadMore } = useTransactionHistory(
 *   'https://squid.subsquid.io/reef-explorer/graphql',
 *   '5F3sa2TJAWMqDhXG6jhV4N8ko9SxwGy8TpaNS1repo5EYjQX'
 * );
 */
export function useTransactionHistory(
  graphqlUrl: string,
  address: string | undefined
): UseTransactionHistoryResult {
  const [state, setState] = useState<TransactionHistoryState>({
    transfers: [],
    extrinsics: [],
    loading: false,
    error: null,
    hasMore: true,
  });

  const [offset, setOffset] = useState(0);

  const fetchData = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      if (!address || !graphqlUrl) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'No address or GraphQL URL provided',
        }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const data = await fetchTransactionHistory(
          graphqlUrl,
          address,
          ITEMS_PER_PAGE,
          currentOffset
        );

        setState(prev => ({
          transfers: append
            ? [...prev.transfers, ...data.transfers]
            : data.transfers,
          extrinsics: append
            ? [...prev.extrinsics, ...data.extrinsics]
            : data.extrinsics,
          loading: false,
          error: null,
          hasMore: data.transfers.length === ITEMS_PER_PAGE,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch transaction history',
        }));
      }
    },
    [graphqlUrl, address]
  );

  // Initial load
  useEffect(() => {
    setOffset(0);
    fetchData(0, false);
  }, [fetchData]);

  // Load more transactions
  const loadMore = useCallback(() => {
    if (state.loading || !state.hasMore) return;

    const newOffset = offset + ITEMS_PER_PAGE;
    setOffset(newOffset);
    fetchData(newOffset, true);
  }, [offset, state.loading, state.hasMore, fetchData]);

  // Refresh from beginning
  const refresh = useCallback(() => {
    setOffset(0);
    fetchData(0, false);
  }, [fetchData]);

  return {
    ...state,
    loadMore,
    refresh,
  };
}
