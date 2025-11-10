# MediSecure 🏥🔐  
**Decentralized Medical Record Encryption & Sharing on Blockchain**

## Team Members
- **K Ayesha**
- **Gagan**
- **Jauhar Mohamed**
- **Jayanth Kishore N**

## 🚀 Overview

MediSecure enables patients to take **full ownership** of their medical data.  
Hospitals encrypt records locally and store them on **IPFS**, while only the file reference (CID) and access metadata go on the **Ethereum blockchain**.  
Patients decrypt records using their **private key** — making privacy absolute (even we cannot see the medical data).

✅ No centralized data leaks  
✅ Patient-controlled access  
✅ Hospitals cannot view other hospital uploads  
✅ End-to-end security with AES-256 + ECIES

---

## ✅ Key Features

| Feature | Description |
|--------|-------------|
| Decentralized Storage | Report files stored encrypted on IPFS |
| Smart Contract Access Control | CID linked to patient only |
| Zero-Zero-Trust Security | Only patient’s private key can decrypt |
| Multi-Hospital Collaboration | Multiple hospitals can add records to one patient |
| Privacy by Design | No identifiable medical data stored on-chain |

---

## 🏗 Architecture Diagram — Full Flow (Patient + 2 Hospitals)

```plaintext
 ┌─────────────┐         ┌─────────────┐
 │ Hospital A  │         │ Hospital B  │
 │Encrypt file │         │Encrypt file │
 └──────┬──────┘         └──────┬──────┘
        │ AES + Patient PubKey  │
        └────────┬──────────────┘
                 ▼
          ┌──────────────┐
          │  Encrypted   │
          │ Medical File │
          └──────┬───────┘
                 │ Upload via Pinata
                 ▼
          ┌──────────────┐
          │    IPFS      │
          └──────┬───────┘
                 │ CID returned
                 ▼
         ┌────────────────────┐
         │ Smart Contract     │
         │ CID + AES Key (Enc)│
         └─────────┬──────────┘
                   │ Patient fetches
                   ▼
            ┌───────────────┐
            │   Patient     │
            │Decrypt + View │
            └───────────────┘
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

## 🛡 Security Notes

✅ Hospital cannot read encrypted backup once uploaded  
✅ IPFS gateway cannot see file contents  
✅ Blockchain stores **no** plain medical data  
✅ Even if CID leaks, file is useless without private key  

---

## 📌 Smart Contract

✅ Handles only record indexing  
❌ No medical data stored — only CIDs + encrypted AES keys


---

### Optional Reference Contract (Sepolia Testnet)

```
0xf34E27C7FACE16c27a02f9559879051d0e4A55A1
```

---

## ⚙️ Deploy Smart Contract Using Remix

1. Open https://remix.ethereum.org  
2. Create a new file → `MediSecure.sol` and paste the contract code from [MedSecure.sol](MedSecure.sol)
3. From **Solidity Compiler** tab → Compile  
4. From **Deploy & Run** tab:
   - Environment: **Injected Provider (MetaMask Sepolia)**
   - Click **Deploy**
5. Copy deployed contract address into `.env`

---

## 🔧 Installation & Usage (Local Runner)

### Requirements
- Node.js 18+
- MetaMask wallet
- Sepolia test ETH
- Pinata account (IPFS)

### Clone & Install
```bash
git clone https://github.com/jkholick/MediSecure.git
cd MediSecure
npm install
```

### Generate Patient Keys

```bash
node generateKeys.js
```

Paste the generated values into `.env`.

### Setup Environment
Create `.env`
```env
RPC_URL=<your Infura/Alchemy RPC URL>
CONTRACT_ADDRESS=<your contract or optional one above>
PINATA_API_KEY=<your key>
PINATA_API_SECRET=<your secret>
PATIENT_ADDRESS=<patient wallet>
PATIENT_PRV_KEY=<private key for decryption>
PATIENT_PUBHEX=<public encryption key>
HOSPITAL_PRIVATE_KEY=<hospital wallet key>
```


### Upload File (Hospital)
```bash
node hospital_upload.js <report.pdf>
```

✔ Encrypts  
✔ Uploads to IPFS  
✔ Stores metadata on blockchain

---

### Download + Decrypt (Patient)
```bash
node patient_download.js <record_index>
```

✔ Retrieves CID  
✔ Decrypts AES key  
✔ Restores original medical record

