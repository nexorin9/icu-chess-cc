# ICU-Chess-CC — Chess-Style Isolation Bed Coordination Collaborative Platform

## Project Overview

ICU-Chess-CC is a system that visualizes ICU beds in a chess-style grid format, in real time calculates isolation constraints (e.g., MRSA patients cannot be adjacent to immunosuppressed patients), outputs "bed transfer recommendation forms," and requires the signature and approval from all three parties—head nurse, infection control, and bed management center—before execution.

## Core Features

- **Bed Map Visualization**: Chess-style display of ICU bed distribution
- **Isolation Rule Engine**: High-performance isolation constraint calculation in Golang
- **Bed Transfer Recommendation Generation**: Intelligent calculation of optimal transfer plans
- **Three-Party Co-signature Workflow**: Collaborative approval among head nurse, infection control, and bed management center
- **Bed Transfer Recommendation Output**: Printable recommendation form generation

## Tech Stack

- **Backend Rule Engine**: Golang
- **API Service**: TypeScript / Node.js + Express
- **Frontend Visualization**: React

## Directory Structure

```
icu-chess-cc/
├── data/          # Sample data
├── src/           # Source code
├── templates/     # Template files
├── README.md      # This file
└── buymeacoffee.png
```

## Quick Start

### Install Dependencies

```bash
# Golang dependencies
cd src/go && go mod tidy

# Node.js dependencies
cd src/api && npm install

# Frontend dependencies
cd src/web && npm install
```

### Run

```bash
# Start API service
cd src/api && npm run dev

# Start frontend
cd src/web && npm run dev
```

## Usage Scenario

1. ICU head nurse initiates a bed transfer request
2. System calculates isolation constraints and generates transfer recommendations
3. Infection control nurse reviews online
4. Bed management center confirms execution
5. After three-party co-signature, the system outputs the bed transfer recommendation form