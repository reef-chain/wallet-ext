import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faCircleCheck,
  faCircleXmark,
  faExternalLink,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Transfer } from './queries';
import Uik from '@reef-chain/ui-kit';
import BigNumber from 'bignumber.js';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { toast } from 'react-toastify';

interface TransactionDetailsProps {
  transfer: Transfer;
  currentAddress: string;
  reefscanUrl: string;
  isDarkMode: boolean;
  onClose: () => void;
}

/**
 * Format token amount with full precision
 */
function formatFullAmount(amount: string, decimals: number): string {
  const bn = new BigNumber(amount).div(new BigNumber(10).pow(decimals));
  return bn.toFormat();
}

/**
 * Format timestamp to full date and time
 */
function formatFullDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * InfoRow component for displaying transaction details
 */
const InfoRow: React.FC<{
  label: string;
  value: string;
  copyable?: boolean;
  isDarkMode: boolean;
}> = ({ label, value, copyable = false, isDarkMode }) => (
  <div className="mb-4">
    <Uik.Text
      text={label}
      type="light"
      className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs mb-1`}
    />
    <div className="flex items-center space-x-2">
      <Uik.Text
        text={value}
        className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} break-all`}
      />
      {copyable && (
        <CopyToClipboard
          text={value}
          onCopy={() => toast.success('Copied to clipboard!')}
        >
          <button
            className={`
              ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}
              transition-colors cursor-pointer
            `}
          >
            <FontAwesomeIcon icon={faCopy as IconProp} className="text-sm" />
          </button>
        </CopyToClipboard>
      )}
    </div>
  </div>
);

/**
 * TransactionDetails Modal Component
 * Shows detailed information about a transaction
 */
export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transfer,
  currentAddress,
  reefscanUrl,
  isDarkMode,
  onClose,
}) => {
  const isSent = transfer.from.toLowerCase() === currentAddress.toLowerCase();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
          rounded-lg shadow-xl z-50
          w-11/12 max-w-md max-h-[90vh] overflow-y-auto
        `}
      >
        {/* Header */}
        <div className={`
          sticky top-0
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          border-b p-4 flex items-center justify-between
        `}>
          <Uik.Text
            text="Transaction Details"
            type="title"
            className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}
          />
          <button
            onClick={onClose}
            className={`
              ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}
              transition-colors
            `}
          >
            <FontAwesomeIcon icon={faXmark as IconProp} className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Status Badge */}
          <div className="mb-6 text-center">
            <div className={`
              inline-flex items-center space-x-2 px-4 py-2 rounded-full
              ${transfer.success
                ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-100')
                : (isDarkMode ? 'bg-red-900/30' : 'bg-red-100')
              }
            `}>
              <FontAwesomeIcon
                icon={(transfer.success ? faCircleCheck : faCircleXmark) as IconProp}
                className={`${transfer.success ? 'text-green-500' : 'text-red-500'}`}
              />
              <Uik.Text
                text={transfer.success ? 'Success' : 'Failed'}
                className={`${transfer.success ? 'text-green-600' : 'text-red-600'} font-semibold`}
              />
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6 text-center">
            <Uik.Text
              text={formatFullAmount(transfer.amount, transfer.token.decimals)}
              type="headline"
              className={`${isDarkMode ? 'text-gray-100' : 'text-gray-900'} text-2xl font-bold`}
            />
            <Uik.Text
              text={transfer.token.symbol}
              type="title"
              className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mt-1`}
            />
          </div>

          <Uik.Divider />

          {/* Details */}
          <div className="mt-4">
            <InfoRow
              label="Direction"
              value={isSent ? 'Sent' : 'Received'}
              isDarkMode={isDarkMode}
            />

            <InfoRow
              label="From"
              value={transfer.from}
              copyable
              isDarkMode={isDarkMode}
            />

            <InfoRow
              label="To"
              value={transfer.to}
              copyable
              isDarkMode={isDarkMode}
            />

            <InfoRow
              label="Token"
              value={`${transfer.token.name} (${transfer.token.symbol})`}
              isDarkMode={isDarkMode}
            />

            <InfoRow
              label="Token Address"
              value={transfer.token.id}
              copyable
              isDarkMode={isDarkMode}
            />

            <InfoRow
              label="Block Number"
              value={transfer.blockNumber.toString()}
              isDarkMode={isDarkMode}
            />

            <InfoRow
              label="Transaction Hash"
              value={transfer.extrinsicHash}
              copyable
              isDarkMode={isDarkMode}
            />

            <InfoRow
              label="Timestamp"
              value={formatFullDate(transfer.timestamp)}
              isDarkMode={isDarkMode}
            />

            <InfoRow
              label="Type"
              value={transfer.type}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* View on Explorer Button */}
          <a
            href={`${reefscanUrl}/extrinsic/${transfer.extrinsicHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block"
          >
            <Uik.Button
              text="View on Reefscan"
              fill
              icon={<FontAwesomeIcon icon={faExternalLink as IconProp} />}
              className="w-full"
            />
          </a>
        </div>
      </div>
    </>
  );
};
