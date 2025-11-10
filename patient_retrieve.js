// patient_retrieve.js
// Usage: node patient_retrieve.js <recordId>
// Example: node patient_retrieve.js 1

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const ECIES = require("eciesjs");
const { ethers } = require("ethers");
require("dotenv").config();

const RECORD_ID = process.argv[2] ? parseInt(process.argv[2]) : 1;

const {
  RPC_URL,
  CONTRACT_ADDRESS,
  PATIENT_PRIVATE_KEY,
  IPFS_GATEWAY
} = process.env;

if (!RPC_URL || !CONTRACT_ADDRESS || !PATIENT_PRIVATE_KEY) {
  console.error("Missing env vars. Ensure RPC_URL, CONTRACT_ADDRESS, PATIENT_PRIVATE_KEY are set in .env");
  process.exit(1);
}

const contractAbi = [
  {
    "inputs": [
      { "internalType": "uint256","name":"recordId","type":"uint256" }
    ],
    "name":"getRecord",
    "outputs": [
      { "components":[
          {"internalType":"uint256","name":"id","type":"uint256"},
          {"internalType":"address","name":"patient","type":"address"},
          {"internalType":"address","name":"uploader","type":"address"},
          {"internalType":"string","name":"cid","type":"string"},
          {"internalType":"string","name":"encKeyForPatient","type":"string"},
          {"internalType":"uint256","name":"timestamp","type":"uint256"}
        ],
        "internalType":"struct MedSecure.Record","name":"","type":"tuple"
      }
    ],
    "stateMutability":"view",
    "type":"function"
  }
];

async function main(){
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);

    console.log("Fetching record", RECORD_ID, "from contract...");
    const rec = await contract.getRecord(RECORD_ID);

    if (!rec || !rec.cid) {
      console.error("Record not found or no CID present");
      process.exit(1);
    }

    const cid = rec.cid;
    const encKeyForPatient = rec.encKeyForPatient;

    if (!encKeyForPatient || encKeyForPatient.length === 0) {
      console.error("No encrypted key for patient found on-chain.");
      process.exit(1);
    }

    console.log("CID:", cid);
    // decrypt the symKey (encKeyForPatient expected base64)
    const encKeyBuf = Buffer.from(encKeyForPatient, "base64");

    // PATIENT_PRIVATE_KEY may be with or without 0x prefix. Remove '0x' if present.
    const privHex = PATIENT_PRIVATE_KEY.replace(/^0x/, "");
    const privBuf = Buffer.from(privHex, "hex");

    // eciesjs: decrypt with private key buffer
    let symKey;
    try {
      symKey = ECIES.decrypt(privBuf, encKeyBuf); // returns Buffer
    } catch (e) {
      console.error("ECIES decrypt failed. Ensure PATIENT_PRIVATE_KEY is the correct encryption private key.");
      console.error(e.message || e);
      process.exit(1);
    }

    console.log("Successfully decrypted symmetric key (AES-256).");

    // Download encrypted payload from IPFS
    const gateway = (IPFS_GATEWAY && IPFS_GATEWAY.length) ? IPFS_GATEWAY : "https://ipfs.io/ipfs/";
    const url = gateway.endsWith("/") ? `${gateway}${cid}` : `${gateway}/${cid}`;
    console.log("Downloading encrypted file from:", url);

    const resp = await axios.get(url, { responseType: "arraybuffer" });
    const payload = Buffer.from(resp.data);

    // payload layout: iv(12) | tag(16) | ciphertext
    if (payload.length < 28) {
      console.error("Downloaded payload appears too small or malformed.");
      process.exit(1);
    }

    const iv = payload.slice(0, 12);
    const tag = payload.slice(12, 28);
    const ciphertext = payload.slice(28);

    // decrypt AES-256-GCM
    const decipher = crypto.createDecipheriv("aes-256-gcm", symKey, iv);
    decipher.setAuthTag(tag);

    let decrypted;
    try {
      decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch (e) {
      console.error("AES decryption failed. Possibly wrong symmetric key or corrupted payload.");
      console.error(e.message || e);
      process.exit(1);
    }

    // write to file
    const outName = `decrypted_record_${RECORD_ID}${getFileExtFromCid(cid) || ".bin"}`;
    fs.writeFileSync(outName, decrypted);
    console.log("Decrypted file written to:", outName);
    console.log("Open the file (PDF viewer, image viewer, or text editor depending on the original content).");

  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
}

function getFileExtFromCid(cid){
  // we can't reliably know the original filename or mime-type from CID alone.
  // Default to .pdf for your demo, or leave generic. You can hardcode ".pdf" if you know it.
  return ".pdf";
}

main();

