# AGI Fund

A sophisticated multi-agent system for cryptocurrency market analysis and management, built with TypeScript and powered by LLM-OS.

## Overview

This project implements an autonomous system of AI agents that work together to analyze cryptocurrency markets, manage communications, and make informed decisions. The system consists of multiple specialized agents including:

- Market Expert: Analyzes cryptocurrency market data
- CEO: Manages and coordinates tasks between team members
- CMO: Handles social media and market sentiment analysis

## Features

- Real-time cryptocurrency market analysis
- Telegram integration for communication
- Multi-agent coordination and task management
- API monitoring and automated reasoning capabilities
- Reddit integration for social sentiment analysis

## Tech Stack

- TypeScript
- Node.js
- Express
- LLM-OS (Custom AI Operating System)
- Telegram Bot API
- Various Cryptocurrency APIs

## Prerequisites

- Node.js (Latest LTS version)
- npm or yarn
- Telegram Bot Token
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
Create a `.env` file in the root directory and add necessary API keys and tokens.

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
    - `/reddit` - Reddit integration
  - `/utils` - Utility functions and helpers
  - `index.ts` - Application entry point
  - `personas.ts` - Agent personality definitions

## License
ISC
