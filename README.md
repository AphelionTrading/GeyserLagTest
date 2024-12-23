# Solana gRPC Health Check Utility

A TypeScript utility that subscribes to Solana processed transactions and slot updates via gRPC and compares the slot numbers to the RPC endpoint.

## Prerequisites

- Node.js (v14 or higher recommended)
- Yarn package manager
- Solana RPC endpoint with gRPC support

## Installation

1. Clone the repository:

2. Install dependencies:
```
yarn install
```
3. Create a `.env` file in the root directory:
```
RPC_URL_PATH=your-rpc-base-url
RPC_TOKEN=your-rpc-token
```

## Usage

Build the project:
```
yarn build
```
Start the service:
```
yarn start
```

## Dependencies
- @solana/web3.js
- @triton-one/yellowstone-grpc
- dotenv