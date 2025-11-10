const { PrivateKey } = require("eciesjs");
const fs = require("fs");

// Generate Patient Keys
const patientPrivKey = new PrivateKey();
const patientPubKey = patientPrivKey.publicKey;

// Generate Hospital Keys
const hospitalPrivKey = new PrivateKey();
const hospitalPubKey = hospitalPrivKey.publicKey;

fs.writeFileSync("patient_keys.json", JSON.stringify({
  priv: patientPrivKey.toHex(),
  pub: patientPubKey.toHex()
}, null, 2));

fs.writeFileSync("hospital_keys.json", JSON.stringify({
  priv: hospitalPrivKey.toHex(),
  pub: hospitalPubKey.toHex()
}, null, 2));

console.log("✅ Keys generated! Check patient_keys.json and hospital_keys.json");

