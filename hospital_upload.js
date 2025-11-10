// hospital_upload.js
// Usage: node hospital_upload.js ./path/to/record.pdf
// Pre-req: .env file with RPC_URL, CONTRACT_ADDRESS, PATIENT_ADDRESS, PATIENT_PUBHEX, PINATA_API_KEY, PINATA_API_SECRET, HOSPITAL_PRIVATE_KEY

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const FormData = require("form-data");
const ECIES = require("eciesjs");
const { ethers } = require("ethers");
require("dotenv").config();

const [
  , , filePathArg
] = process.argv;

if (!filePathArg) {
  console.error("Usage: node hospital_upload.js <path-to-file>");
  process.exit(1);
}

const {
  RPC_URL,
  CONTRACT_ADDRESS,
  PATIENT_ADDRESS,
  PATIENT_PUBHEX,
  PINATA_API_KEY,
  PINATA_API_SECRET,
  HOSPITAL_PRIVATE_KEY
} = process.env;

if (!RPC_URL || !CONTRACT_ADDRESS || !PATIENT_ADDRESS || !PATIENT_PUBHEX || !PINATA_API_KEY || !PINATA_API_SECRET || !HOSPITAL_PRIVATE_KEY) {
  console.error("Missing env vars. Check .env (RPC_URL, CONTRACT_ADDRESS, PATIENT_ADDRESS, PATIENT_PUBHEX, PINATA_API_KEY, PINATA_API_SECRET, HOSPITAL_PRIVATE_KEY).");
  process.exit(1);
}

const CONTRACT_ABI = [
  // minimal ABI for createRecord
  {
    "inputs": [
      { "internalType": "address", "name": "patient", "type": "address" },
      { "internalType": "string", "name": "cid", "type": "string" },
      { "internalType": "string", "name": "encKeyForPatient", "type": "string" }
    ],
    "name": "createRecord",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // event for helpful logs (optional)
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "recordId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "patient", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "uploader", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "cid", "type": "string" }
    ],
    "name": "RecordCreated",
    "type": "event"
  }
];

async function encryptFileAndUpload(filePath) {
  // 1) read file
  const fileBuf = fs.readFileSync(filePath);

  // 2) generate random AES-256-GCM key
  const symKey = crypto.randomBytes(32); // 256 bits

  // 3) encrypt file with AES-GCM
  const iv = crypto.randomBytes(12); // recommended 12 bytes for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", symKey, iv);
  const enc = Buffer.concat([cipher.update(fileBuf), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store iv + tag + ciphertext as payload
  const payload = Buffer.concat([iv, tag, enc]);

  // 4) upload payload to Pinata (pinFileToIPFS)
  const formData = new FormData();
  formData.append("file", payload, {
    filename: path.basename(filePath),
    contentType: "application/octet-stream"
  });

  const pinataUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const res = await axios.post(pinataUrl, formData, {
    maxBodyLength: Infinity,
    headers: {
      ...formData.getHeaders(),
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET
    }
  });

  if (!res.data || !res.data.IpfsHash) throw new Error("Pinata upload failed: " + JSON.stringify(res.data));
  const cid = res.data.IpfsHash;
  console.log("Uploaded to IPFS CID:", cid);

  // 5) encrypt symKey for patient using patient's ECIES public key (hex)
  // PATIENT_PUBHEX is expected to be hex (no 0x). Convert to Buffer.
  const pubBuffer = Buffer.from(PATIENT_PUBHEX.replace(/^0x/, ""), "hex");
  const encSymBuf = ECIES.encrypt(pubBuffer, symKey); // Buffer
  const encSymBase64 = encSymBuf.toString("base64");

  return { cid, encSymBase64, symKey };
}

async function writeOnChain(cid, encSymB64) {
  // 6) call createRecord(patient, cid, encKeyForPatient)
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(HOSPITAL_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  console.log("Sending createRecord transaction...");
  const tx = await contract.createRecord(PATIENT_ADDRESS, cid, encSymB64);
  console.log("tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Transaction mined. block:", receipt.blockNumber);
  // try to extract recordId if event emitted
  if (receipt.logs && receipt.logs.length) {
    try {
      // parse logs to find RecordCreated event (optional)
      const iface = new ethers.Interface(CONTRACT_ABI);
      for (const l of receipt.logs) {
        try {
          const parsed = iface.parseLog(l);
          if (parsed && parsed.name === "RecordCreated") {
            console.log("RecordCreated event -> recordId:", parsed.args.recordId.toString());
            return { receipt, recordId: parsed.args.recordId.toString() };
          }
        } catch (e) { /* ignore non-matching logs */ }
      }
    } catch (e) {/* ignore */}
  }
  return { receipt };
}

(async () => {
  try {
    console.log("Encrypting and uploading file...");
    const { cid, encSymBase64 } = await encryptFileAndUpload(filePathArg);
    console.log("On-chain write...");
    const result = await writeOnChain(cid, encSymBase64);
    console.log("Done. Result:", result);
    console.log("Keep your symmetric key (not stored anywhere by this script) if you need to decrypt locally.");
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
})();

