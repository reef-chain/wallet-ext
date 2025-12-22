import React, { useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHistory,
  faRefresh,
  faSpinner,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import Uik from '@reef-chain/ui-kit';
import { useTheme } from '../context/ThemeContext';
import ReefSigners from '../context/ReefSigners';
import { useTransactionHistory } from './useTransactionHistory';
import { TransactionItem } from './TransactionItem';
import { TransactionDetails } from './TransactionDetails';
import { Transfer } from './queries';
import strings from '../../i18n/locales';

/**
 * Empty State Component
 */
const EmptyState: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
  <div className="text-center py-12">
    <FontAwesomeIcon
      icon={faHistory as IconProp}
      className={`${isDarkMode ? 'text-gray-600' : 'text-gray-300'} text-6xl mb-4`}
    />
    <Uik.Text
      text="No transactions yet"
      type="title"
      className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
    />
    <Uik.Text
      text="Your transaction history will appear here"
      type="light"
      className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-2`}
    />
  </div>
);

/**
 * Error State Component
 */
const ErrorState: React.FC<{
  error: string;
  onRetry: () => void;
  isDarkMode: boolean;
}> = ({ error, onRetry, isDarkMode }) => (
  <div className="text-center py-12">
    <FontAwesomeIcon
      icon={faExclamationTriangle as IconProp}
      className="text-red-500 text-6xl mb-4"
    />
    <Uik.Text
      text="Failed to load transactions"
      type="title"
      className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
    />
    <Uik.Text
      text={error}
      type="light"
      className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 mb-4`}
    />
    <Uik.Button
      text="Retry"
      onClick={onRetry}
      icon={<FontAwesomeIcon icon={faRefresh as IconProp} />}
    />
  </div>
);

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
  <div className="space-y-2">
    {[...Array(5)].map((_, index) => (
      <div
        key={index}
        className={`
          ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}
          rounded-lg p-4 animate-pulse
        `}
      >
        <div className="flex items-center space-x-3">
          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} w-10 h-10 rounded-full`} />
          <div className="flex-1">
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} h-4 w-24 rounded mb-2`} />
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} h-3 w-32 rounded`} />
          </div>
          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} h-4 w-20 rounded`} />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Transaction History Component
 * Main component that displays the transaction history page
 */
const TransactionHistory: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { accounts, network } = useContext(ReefSigners);

  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  // Get selected account address
  const selectedAccount = accounts?.find(acc => !!(acc as any).isSelected);
  const currentAddress = selectedAccount?.address;

  // Get GraphQL URL from network config
  const graphqlUrl = network?.graphqlExplorerUrl || 'https://squid.subsquid.io/reef-explorer/graphql';
  const reefscanUrl = network?.reefscanUrl || 'https://reefscan.com';

  // Fetch transaction history
  const {
    transfers,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useTransactionHistory(graphqlUrl, currentAddress);

  // Handle transaction click
  const handleTransactionClick = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
  };

  return (
    <div className={`transaction-history ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen pb-4`}>
      {/* Header */}
      <div className={`
        sticky top-0 z-10
        ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
        border-b px-4 py-3
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon
              icon={faHistory as IconProp}
              className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
            />
            <Uik.Text
              text="Transaction History"
              type="title"
              className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}
            />
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className={`
              ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              transition-colors
            `}
          >
            <FontAwesomeIcon
              icon={faRefresh as IconProp}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* No address selected */}
        {!currentAddress && (
          <div className="text-center py-12">
            <Uik.Text
              text="Please select an account"
              type="title"
              className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
            />
          </div>
        )}

        {/* Loading initial data */}
        {loading && transfers.length === 0 && <LoadingSkeleton isDarkMode={isDarkMode} />}

        {/* Error state */}
        {error && !loading && (
          <ErrorState error={error} onRetry={refresh} isDarkMode={isDarkMode} />
        )}

        {/* Empty state */}
        {!loading && !error && transfers.length === 0 && currentAddress && (
          <EmptyState isDarkMode={isDarkMode} />
        )}

        {/* Transaction List */}
        {transfers.length > 0 && (
          <>
            <div className="space-y-0">
              {transfers.map((transfer) => (
                <TransactionItem
                  key={transfer.id}
                  transfer={transfer}
                  currentAddress={currentAddress || ''}
                  reefscanUrl={reefscanUrl}
                  isDarkMode={isDarkMode}
                  onClick={() => handleTransactionClick(transfer)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-4">
                <Uik.Button
                  text={loading ? 'Loading...' : 'Load More'}
                  onClick={loadMore}
                  disabled={loading}
                  icon={
                    loading ? (
                      <FontAwesomeIcon icon={faSpinner as IconProp} className="animate-spin" />
                    ) : undefined
                  }
                />
              </div>
            )}

            {/* End of list message */}
            {!hasMore && transfers.length > 0 && (
              <div className="text-center mt-6 pb-4">
                <Uik.Text
                  text="No more transactions"
                  type="light"
                  className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransfer && (
        <TransactionDetails
          transfer={selectedTransfer}
          currentAddress={currentAddress || ''}
          reefscanUrl={reefscanUrl}
          isDarkMode={isDarkMode}
          onClose={() => setSelectedTransfer(null)}
        />
      )}
    </div>
  );
};

export default TransactionHistory;
