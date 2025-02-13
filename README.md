# AGI Fund

A sophisticated multi-agent system for cryptocurrency market analysis and management, built with TypeScript and powered by LLM-OS.

## Overview

This project implements an autonomous system of AI agents that work together to analyze cryptocurrency markets, manage communications, and make informed decisions. The system consists of multiple specialized agents including:

- Market Expert: Analyzes cryptocurrency market data
- CEO: Manages and coordinates tasks between team members
- CMO: Handles social media and market sentiment analysis
- Wallet Master: Manages secure multi-signature transactions using Safe protocol

## Features

- Real-time cryptocurrency market analysis
- Telegram integration for communication
- Multi-agent coordination and task management
- API monitoring and automated reasoning capabilities
- Reddit integration for social sentiment analysis
- Secure multi-signature wallet management with Safe protocol
  - Deploy and manage Safe smart accounts
  - Create and execute multi-signature transactions
  - Monitor transaction history and account status
  - Multi-owner transaction approval system

## Tech Stack

- TypeScript
- Node.js
- Express
- LLM-OS (Custom AI Operating System)
- Telegram Bot API
- Safe Protocol Kit
- Various Cryptocurrency APIs

## Prerequisites

- Node.js (Latest LTS version)
- npm or yarn
- Telegram Bot Token
- Ethereum Wallet with Private Key (for Safe transactions)
- Safe Protocol API Keys
- Required API keys (configured in .env)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/agi-fund.git
cd agi-fund
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory and add necessary API keys and tokens:
```
SAFE_AGENT_ADDRESS=your_agent_ethereum_address
SAFE_AGENT_PRIVATE_KEY=your_agent_private_key
SAFE_HUMAN_SIGNER_ADDRESS=your_human_signer_address
```

4. Build the project:
```bash
npm run build
```

5. Start the application:
```bash
npm start
```

## Project Structure

- `/src` - Source code
  - `/apps` - Application modules
    - `/chat` - Chat functionality and Telegram integration
    - `/crypto` - Cryptocurrency analysis
    - `/os` - Core operating system functionality
    - `/safe` - Safe Protocol integration and wallet management
    - `/reddit` - Reddit integration
  - `/utils` - Utility functions and helpers
  - `index.ts` - Application entry point
  - `personas.ts` - Agent personality definitions

## License
ISC
