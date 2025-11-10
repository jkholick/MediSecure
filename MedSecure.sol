// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title MedSecureV2
/// @notice Minimal, audit-friendly contract to store pointers (IPFS CIDs) and encrypted symmetric keys + access consent.
/// @dev This contract stores only metadata and encrypted keys (opaque strings). Never store plaintext medical data on-chain.
contract MedSecureV2 {
    uint256 public recordCounter;

    struct Record {
        uint256 id;
        address patient;
        address uploader;
        string cid;               // IPFS CID (encrypted file)
        string encKeyForPatient;  // AES key encrypted to patient's public key (base64/hex)
        uint256 timestamp;
    }

    // recordId => Record
    mapping(uint256 => Record) public records;

    // patient address => list of recordIds (helps listing records for a patient)
    mapping(address => uint256[]) public patientRecords;

    // recordId => grantee (hospital) => encKeyForGrantee (encrypted AES key for that grantee)
    mapping(uint256 => mapping(address => string)) public recordGranteeKey;

    // recordId => grantee => whether grantee requested access
    mapping(uint256 => mapping(address => bool)) public accessRequested;

    // wallet => pubKeyHex (encryption public key for ECIES, as hex or base64 string)
    mapping(address => string) public userPubKey;

    // Events
    event PubKeyRegistered(address indexed user, string pubKeyHex);
    event RecordCreated(uint256 indexed recordId, address indexed patient, address indexed uploader, string cid);
    event AccessRequested(uint256 indexed recordId, address indexed hospital);
    event AccessApproved(uint256 indexed recordId, address indexed grantee, address indexed approvedBy);
    event AccessRevoked(uint256 indexed recordId, address indexed grantee, address indexed revokedBy);

    /// @notice Register an encryption public key (opaque string) for the caller's wallet
    /// @param pubKeyHex public key in hex/base64 representation
    function registerPubKey(string calldata pubKeyHex) external {
        userPubKey[msg.sender] = pubKeyHex;
        emit PubKeyRegistered(msg.sender, pubKeyHex);
    }

    /// @notice Create a medical record pointer. Uploader supplies the AES key encrypted for the patient.
    /// @param patient the patient wallet address (owner of the record)
    /// @param cid IPFS CID where the encrypted file is stored
    /// @param encKeyForPatient AES symmetric key encrypted for the patient's public key (opaque string)
    /// @return recordId the generated record id
    function createRecord(
        address patient,
        string calldata cid,
        string calldata encKeyForPatient
    ) external returns (uint256 recordId) {
        require(patient != address(0), "invalid patient");
        require(bytes(cid).length > 0, "cid required");
        recordCounter++;
        recordId = recordCounter;

        records[recordId] = Record({
            id: recordId,
            patient: patient,
            uploader: msg.sender,
            cid: cid,
            encKeyForPatient: encKeyForPatient,
            timestamp: block.timestamp
        });

        patientRecords[patient].push(recordId);

        emit RecordCreated(recordId, patient, msg.sender, cid);
        return recordId;
    }

    /// @notice Hospital (or any caller) requests access to a record. Patient must approve later.
    /// @param recordId the target record
    function requestAccess(uint256 recordId) external {
        require(records[recordId].id != 0, "record not found");
        accessRequested[recordId][msg.sender] = true;
        emit AccessRequested(recordId, msg.sender);
    }

    /// @notice Patient approves access by storing the AES key encrypted for the grantee (hospital).
    /// @param recordId the target record
    /// @param grantee the hospital address to grant access to
    /// @param encKeyForGrantee symmetric AES key encrypted to the grantee's public key (opaque string)
    function approveAccess(
        uint256 recordId,
        address grantee,
        string calldata encKeyForGrantee
    ) external {
        Record storage r = records[recordId];
        require(r.id != 0, "record not found");
        require(msg.sender == r.patient, "only patient can approve");
        require(accessRequested[recordId][grantee] == true, "no request found");

        recordGranteeKey[recordId][grantee] = encKeyForGrantee;
        accessRequested[recordId][grantee] = false;

        emit AccessApproved(recordId, grantee, msg.sender);
    }

    /// @notice Patient or uploader can revoke access for a grantee.
    /// @param recordId the target record
    /// @param grantee the hospital address to revoke
    function revokeAccess(uint256 recordId, address grantee) external {
        Record storage r = records[recordId];
        require(r.id != 0, "record not found");
        require(msg.sender == r.patient || msg.sender == r.uploader, "not allowed");

        delete recordGranteeKey[recordId][grantee];
        emit AccessRevoked(recordId, grantee, msg.sender);
    }

    /* ---------- View helpers ---------- */

    /// @notice Get record struct for a given id
    /// @param recordId the target record id
    /// @return Record the stored record metadata
    function getRecord(uint256 recordId) external view returns (Record memory) {
        return records[recordId];
    }

    /// @notice Get encrypted key for a grantee (hospital) on a record
    /// @param recordId the target record id
    /// @param grantee the grantee address
    /// @return encKey the opaque encrypted symmetric key string
    function getGranteeEncKey(uint256 recordId, address grantee) external view returns (string memory encKey) {
        return recordGranteeKey[recordId][grantee];
    }

    /// @notice Get list of record IDs for a patient
    /// @param patient the patient address
    /// @return ids array of record ids assigned to the patient
    function getPatientRecords(address patient) external view returns (uint256[] memory ids) {
        return patientRecords[patient];
    }

    /// @notice Get registered public key for a wallet
    /// @param wallet the wallet address
    /// @return pubKey the registered public key string
    function getPubKey(address wallet) external view returns (string memory pubKey) {
        return userPubKey[wallet];
    }
}
