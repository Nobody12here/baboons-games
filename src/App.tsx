// App.jsx
import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseEther, formatEther, Address, Hash } from 'viem';

// ABI for the BaboonGames contract
const baboonGamesABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" },
      { "internalType": "uint256", "name": "_depositAmount", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "GameAlreadyFinished",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidPlayers",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidWinner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WinnerNotInGame",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player1",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "player2",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deposit",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "gameID",
        "type": "uint256"
      }
    ],
    "name": "TokensDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "WinnerSelected",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "address", "name": "player1", "type": "address" },
      { "internalType": "address", "name": "player2", "type": "address" }
    ],
    "name": "depositTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "depositAmount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "games",
    "outputs": [
      { "internalType": "address[2]", "name": "players", "type": "address[2]" },
      { "internalType": "address", "name": "winner", "type": "address" },
      { "internalType": "uint8", "name": "isPlayed", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "address", "name": "_winner", "type": "address" }
    ],
    "name": "pickWinner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token",
    "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI for the ERC20 token
const erc20ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses (replace with your actual deployed addresses)
const BABOON_GAMES_CONTRACT_ADDRESS = "0xc2489F21cfCCe0db9542F0A5A110F6D7c4514Cc5"; // Replace with your contract address
const TOKEN_CONTRACT_ADDRESS = "0x6B276a376EE1b93205fB8bcaC387B86a7DFb380d"; // Replace with your token address

function App() {
  const [gameId, setGameId] = useState("");
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [winner, setWinner] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [txHash, setTxHash] = useState<Hash>();
  
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  
  // Read deposit amount from contract
  const { data: depositAmountData } = useReadContract({
    address: BABOON_GAMES_CONTRACT_ADDRESS,
    abi: baboonGamesABI,
    functionName: 'depositAmount',
  });
  const depositAmount = depositAmountData ? BigInt(depositAmountData.toString()) : undefined;

  // Wait for transaction receipt
  const { isLoading: isPending, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash  ,
  });

  // Check if current user is the contract owner (admin)
  useEffect(() => {
    
    if (isConnected) {
      alert("Connected: " + address);
      if(address === "0x174501fd8461F910beDE1E2689Aee51c4B55a85a"){
        setIsAdmin(true);
      }
    }
  }, [address, isConnected]);

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess) {
      alert("Transaction successful!");
      setGameId("");
      setPlayer1("");
      setPlayer2("");
      setWinner("");
      setTxHash(undefined);
    }
  }, [isSuccess]);

  // Approve tokens for the game contract
  const handleApproveTokens = async () => {
    try {
      const hash = await writeContractAsync({
        address: TOKEN_CONTRACT_ADDRESS,
        abi: erc20ABI,
        functionName: 'approve',
        args: [BABOON_GAMES_CONTRACT_ADDRESS, depositAmount],
      });
      setTxHash(hash);
    } catch (error) {
      console.error("Error approving tokens:", error);
      alert("Failed to approve tokens: " + error);
    }
  };

  // Deposit tokens for a game
  const handleDeposit = async (e:any) => {
    e.preventDefault();
    if (!gameId || !player1 || !player2) {
      alert("Please fill in all fields");
      return;
    }
    
    try {
      // First approve tokens
      await handleApproveTokens();
      
      // Then deposit tokens
      const hash = await writeContractAsync({
        address: BABOON_GAMES_CONTRACT_ADDRESS,
        abi: baboonGamesABI,
        functionName: 'depositTokens',
        args: [gameId, player1, player2],
      });
      setTxHash(hash);
    } catch (error) {
      console.error("Error depositing tokens:", error);
      alert("Failed to deposit tokens: " + error);
    }
  };

  // Pick a winner for a game
  const handlePickWinner = async (e:any) => {
    e.preventDefault();
    if (!gameId || !winner) {
      alert("Please fill in all fields");
      return;
    }
    
    try {
      const hash = await writeContractAsync({
        address: BABOON_GAMES_CONTRACT_ADDRESS,
        abi: baboonGamesABI,
        functionName: 'pickWinner',
        args: [BigInt(gameId), winner],
      });
      setTxHash(hash);
    } catch (error) {
      console.error("Error picking winner:", error);
      alert("Failed to pick winner: " + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Baboon Games</h1>
        
        {/* Connect Wallet Button */}
        <div className="mb-6 flex justify-center">
          {isConnected ? (
            <div className="text-center">
              <p className="mb-2 text-sm text-gray-600">Connected: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}</p>
              <button 
                onClick={() => disconnect()}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={() => connect({ connector: injected() })}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
        
        {isConnected && (
          <>
            {/* Deposit Tokens Form */}
            <div className="mb-8 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Deposit Tokens</h2>
              <form onSubmit={handleDeposit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Game ID</label>
                  <input
                    type="number"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter game ID"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 Address</label>
                  <input
                    type="text"
                    value={player1}
                    onChange={(e) => setPlayer1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0x..."
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 Address</label>
                  <input
                    type="text"
                    value={player2}
                    onChange={(e) => setPlayer2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0x..."
                    required
                  />
                </div>
                {depositAmount && (
                  <p className="mb-4 text-sm text-gray-600">
                    Deposit Amount: {depositAmount ? formatEther(depositAmount) : 'Loading...'} tokens per player
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"
                  disabled={isPending}
                >
                  {isPending ? "Processing..." : "Deposit Tokens"}
                </button>
              </form>
            </div>
            
            {/* Pick Winner Form (Admin Only) */}
            {isAdmin && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Pick Winner (Admin Only)</h2>
                <form onSubmit={handlePickWinner}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Game ID</label>
                    <input
                      type="number"
                      value={gameId}
                      onChange={(e) => setGameId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter game ID"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Winner Address</label>
                    <input
                      type="text"
                      value={winner}
                      onChange={(e) => setWinner(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0x..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:bg-gray-400"
                    disabled={isPending}
                  >
                    {isPending ? "Processing..." : "Pick Winner"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;