// GraphQL queries for Reef blockchain transaction history via Subsquid

export interface Transfer {
  id: string;
  blockNumber: number;
  timestamp: string;
  extrinsicHash: string;
  from: string;
  to: string;
  token: {
    id: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  amount: string;
  success: boolean;
  type: 'EVM' | 'Native';
}

export interface Extrinsic {
  id: string;
  hash: string;
  blockNumber: number;
  timestamp: string;
  signer: string;
  method: string;
  section: string;
  args: string;
  success: boolean;
  fee: string;
}

export interface TransactionHistoryResponse {
  transfers: Transfer[];
  extrinsics: Extrinsic[];
}

/**
 * GraphQL query to fetch transfer history for an address
 * Queries both incoming and outgoing transfers
 */
export const TRANSFER_HISTORY_QUERY = `
  query GetTransferHistory(
    $address: String!
    $limit: Int!
    $offset: Int!
  ) {
    sentTransfers: transfers(
      where: { from_eq: $address }
      orderBy: timestamp_DESC
      limit: $limit
      offset: $offset
    ) {
      id
      blockNumber
      timestamp
      extrinsicHash
      from
      to
      token {
        id
        name
        symbol
        decimals
      }
      amount
      success
      type
    }
    receivedTransfers: transfers(
      where: { to_eq: $address }
      orderBy: timestamp_DESC
      limit: $limit
      offset: $offset
    ) {
      id
      blockNumber
      timestamp
      extrinsicHash
      from
      to
      token {
        id
        name
        symbol
        decimals
      }
      amount
      success
      type
    }
  }
`;

/**
 * GraphQL query to fetch extrinsic (transaction) history for an address
 */
export const EXTRINSIC_HISTORY_QUERY = `
  query GetExtrinsicHistory(
    $address: String!
    $limit: Int!
    $offset: Int!
  ) {
    extrinsics(
      where: { signer_eq: $address }
      orderBy: timestamp_DESC
      limit: $limit
      offset: $offset
    ) {
      id
      hash
      blockNumber
      timestamp
      signer
      method
      section
      args
      success
      fee
    }
  }
`;

/**
 * Fetch transaction history from Reef GraphQL API
 */
export async function fetchTransactionHistory(
  graphqlUrl: string,
  address: string,
  limit: number = 20,
  offset: number = 0
): Promise<TransactionHistoryResponse> {
  try {
    // Fetch transfers
    const transferResponse = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: TRANSFER_HISTORY_QUERY,
        variables: { address, limit, offset },
      }),
    });

    if (!transferResponse.ok) {
      throw new Error(`Transfer query failed: ${transferResponse.statusText}`);
    }

    const transferData = await transferResponse.json();

    if (transferData.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(transferData.errors)}`);
    }

    // Combine sent and received transfers
    const sentTransfers = transferData.data?.sentTransfers || [];
    const receivedTransfers = transferData.data?.receivedTransfers || [];
    const allTransfers = [...sentTransfers, ...receivedTransfers];

    // Remove duplicates and sort by timestamp
    const uniqueTransfers = Array.from(
      new Map(allTransfers.map((t) => [t.id, t])).values()
    ).sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Fetch extrinsics
    const extrinsicResponse = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: EXTRINSIC_HISTORY_QUERY,
        variables: { address, limit, offset },
      }),
    });

    if (!extrinsicResponse.ok) {
      throw new Error(`Extrinsic query failed: ${extrinsicResponse.statusText}`);
    }

    const extrinsicData = await extrinsicResponse.json();

    if (extrinsicData.errors) {
      console.error('GraphQL errors:', extrinsicData.errors);
    }

    return {
      transfers: uniqueTransfers.slice(0, limit),
      extrinsics: extrinsicData.data?.extrinsics || [],
    };
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
}
