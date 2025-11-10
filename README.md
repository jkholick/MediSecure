
# MediSecure: Blockchain‑Enabled Medical Record Privacy

## 🏥 Problem & Solution Overview

Patients often struggle to control who can view or modify their medical reports. Traditional systems:
- Store data in centralized servers → vulnerable to leaks.
- Don’t give patients encryption ownership → hospitals hold the keys.
- Lack tamper‑proof audit tracking.

### ✅ Our Solution
MediSecure provides **privacy‑first medical data management** using ECIES encryption + blockchain access rules.

Patients hold their own **encryption keys**, hospitals upload **encrypted reports** to IPFS, and only authorized users can decrypt using blockchain‑verified access permission.

---

## 🔐 Privacy Workflow

1️⃣ Hospital encrypts report using patient public key ❯ Uploads encrypted file to IPFS  
2️⃣ Encryption key is securely encrypted again using patient wallet pubkey  
3️⃣ Smart contract logs the record and access permissions  
4️⃣ Patient retrieves, decrypts, and controls report visibility

---

## 🧩 System Architecture (Aligned Layout)

```plaintext
                   ┌────────────────────┐
                   │     Hospital       │
                   │ - Encrypts Report  │
                   │ - Submits CID      │
                   └─────────┬──────────┘
                             │ (CID + Encrypted AES Key)
                             ▼
                    ┌────────────────────┐
                    │  Smart Contract    │
                    │  - Record Metadata │
                    │  - Access Control  │
                    └─────────┬──────────┘
                              │ (CID)
                              ▼
                     ┌─────────────────┐
                     │      IPFS       │
                     │ Stores Encrypted│
                     │ Medical Records │
                     └─────────┬───────┘
                               │
                               ▼
                     ┌─────────────────┐
                     │    Patient      │
                     │ - Owns Private  │
                     │   Key           │
                     │ - Decrypts File │
                     └─────────────────┘
```

---

## 🛠️ Tools & Technology

| Component | Tool Used | Purpose |
|----------|-----------|---------|
| Blockchain | Ethereum Sepolia Testnet | Public tamper‑proof logs |
| Smart Contracts | Solidity | Access & metadata registry |
| Storage | IPFS + Pinata | Decentralized encrypted storage |
| Encryption | ECIES + AES‑256 | Dual‑layer end‑to‑end encryption |
| Wallets | MetaMask / EOA | Ownership & signing |
| Backend | Node.js + Ethers.js | Contract + encryption logic |

---

## ✅ Features Implemented

- ✅ On‑chain public key registration
- ✅ Encrypted record upload from hospital
- ✅ Secure IPFS storage
- ✅ Record retrieval & decryption by patient
- ✅ Event‑based tracking (RecordCreated)

---

## 🚀 Hackathon Impact

| Criterion | Score Contribution |
|----------|-------------------|
| Innovation | ✅ Patient‑owned key security |
| Technical Difficulty | ✅ Hybrid blockchain‑encryption architecture |
| Privacy & Safety | ✅ No plaintext leaves hospital |
| User Benefit | ✅ Control of personal medical data |

---

## Installation & Usage Instructions

### Prerequisites

* Node.js (v18 or later recommended)
* Web3 wallet (Metamask)
* Sepolia ETH for interactions
* Pinata account for IPFS storage

### Setup

1. Clone the project:

```bash
git clone <repository_url>
cd Medisecure-blockchain
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with required secrets:

```env
RPC_URL=<your_rpc_url>
CONTRACT_ADDRESS=<deployed_contract_address>
PATIENT_ADDRESS=<your_patient_wallet>
PATIENT_PUBHEX=<your_generated_key>
HOSPITAL_PRIVATE_KEY=<hospital_wallet_private_key>
PINATA_JWT=<your_pinata_jwt>
```

### Upload Encrypted Medical Records

```bash
node hospital_upload.js <medical_file.pdf>
```

This encrypts the file using the patient’s public key, uploads it to IPFS, and writes the CID on-chain.

### Retrieve & Decrypt Medical Records

```bash
node patient_download.js <recordId>
```

This fetches the CID and encrypted symmetric key from the blockchain, decrypts it, and restores the original medical file.


## 👥 Team & Attribution
Built for the Hackathon by **Team MediSecure**.

---

## 📌 Note
Keep your private keys safe. Smart contract stores **no sensitive data** — only encrypted pointers.

