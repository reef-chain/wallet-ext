import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUp,
  faArrowDown,
  faCircleCheck,
  faCircleXmark,
  faExternalLink,
} from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Transfer } from './queries';
import Uik from '@reef-chain/ui-kit';
import BigNumber from 'bignumber.js';

interface TransactionItemProps {
  transfer: Transfer;
  currentAddress: string;
  reefscanUrl: string;
  isDarkMode: boolean;
  onClick: () => void;
}

/**
 * Truncate address to show first and last characters
 * @example "5F3sa2TJ...5EYjQX"
 */
function truncateAddress(address: string, start: number = 6, end: number = 6): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Format timestamp to readable date
 * @example "Dec 22, 2025 10:30 PM"
 */
function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format token amount with proper decimals
 * @example "1,234.56 REEF"
 */
function formatAmount(amount: string, decimals: number, symbol: string): string {
  const bn = new BigNumber(amount).div(new BigNumber(10).pow(decimals));
  return `${bn.toFormat(2)} ${symbol}`;
}

/**
 * TransactionItem Component
 * Displays a single transaction/transfer in the history list
 */
export const TransactionItem: React.FC<TransactionItemProps> = ({
  transfer,
  currentAddress,
  reefscanUrl,
  isDarkMode,
  onClick,
}) => {
  const isSent = transfer.from.toLowerCase() === currentAddress.toLowerCase();
  const isReceived = transfer.to.toLowerCase() === currentAddress.toLowerCase();

  const otherAddress = isSent ? transfer.to : transfer.from;
  const direction = isSent ? 'Sent' : 'Received';
  const directionColor = isSent ? 'text-red-500' : 'text-green-500';
  const directionIcon = isSent ? faArrowUp : faArrowDown;

  return (
    <div
      onClick={onClick}
      className={`
        transaction-item
        ${isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'}
        rounded-lg p-4 mb-2 cursor-pointer transition-colors
        border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
      `}
    >
      <div className="flex items-center justify-between">
        {/* Left section: Icon + Details */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Direction Icon */}
          <div className={`
            ${isSent ? 'bg-red-100' : 'bg-green-100'}
            ${isDarkMode && (isSent ? 'bg-red-900/30' : 'bg-green-900/30')}
            rounded-full p-2
          `}>
            <FontAwesomeIcon
              icon={directionIcon as IconProp}
              className={`${directionColor} text-lg`}
            />
          </div>

          {/* Transaction Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Uik.Text
                text={direction}
                type="mini"
                className={`${directionColor} font-semibold`}
              />
              <Uik.Text
                text={transfer.token.symbol}
                type="mini"
                className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
              />
            </div>

            <div className="flex items-center space-x-2 mt-1">
              <Uik.Text
                text={`${isSent ? 'To:' : 'From:'} ${truncateAddress(otherAddress)}`}
                type="light"
                className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
              />

              {/* Success/Failed badge */}
              <FontAwesomeIcon
                icon={(transfer.success ? faCircleCheck : faCircleXmark) as IconProp}
                className={`text-xs ${
                  transfer.success
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
                title={transfer.success ? 'Success' : 'Failed'}
              />
            </div>

            <Uik.Text
              text={formatDate(transfer.timestamp)}
              type="light"
              className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-xs mt-1`}
            />
          </div>
        </div>

        {/* Right section: Amount + Link */}
        <div className="flex flex-col items-end space-y-1 ml-4">
          <Uik.Text
            text={formatAmount(
              transfer.amount,
              transfer.token.decimals,
              transfer.token.symbol
            )}
            type="mini"
            className={`${directionColor} font-semibold whitespace-nowrap`}
          />

          <a
            href={`${reefscanUrl}/extrinsic/${transfer.extrinsicHash}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`
              ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}
              transition-colors
            `}
          >
            <FontAwesomeIcon icon={faExternalLink as IconProp} className="text-xs" />
          </a>
        </div>
      </div>
    </div>
  );
};
