import CryptoJS from 'crypto-js';
import { ethers } from 'ethers';

/**
 * SecurityService provides core cryptographic utilities for a secure crypto wallet.
 * It handles key derivation, encryption, and HD wallet features locally.
 */
class SecurityService {
    /**
     * Generates a new random 12-word mnemonic phrase (BIP-39).
     * @returns {string} The mnemonic phrase.
     */
    static generateMnemonic() {
        return ethers.Mnemonic.fromEntropy(ethers.randomBytes(16)).phrase;
    }

    /**
     * Derives a private key from a mnemonic and an index.
     * @param {string} mnemonic - The BIP-39 mnemonic.
     * @param {number} index - The account index (default is 0).
     * @returns {string} The private key.
     */
    static derivePrivateKey(mnemonic, index = 0) {
        const path = `m/44'/60'/0'/0/${index}`;
        const wallet = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(mnemonic), path);
        return wallet.privateKey;
    }

    /**
     * Encrypts a sensitive string (like a private key) using AES-256.
     * Uses PBKDF2 for password-based key derivation.
     * @param {string} data - The string to encrypt.
     * @param {string} password - The user's password/PIN.
     * @returns {string} The encrypted string (Base64).
     */
    static encryptData(data, password) {
        // Generate a random salt for PBKDF2
        const salt = CryptoJS.lib.WordArray.random(128 / 8);

        // Derive key using PBKDF2
        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: 256 / 32,
            iterations: 1000
        });

        // Encrypt data
        const encrypted = CryptoJS.AES.encrypt(data, key, {
            iv: salt, // Using salt as IV for simplicity in this demo, though usually separate
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });

        // Store salt and ciphertext together
        return salt.toString() + ":" + encrypted.toString();
    }

    /**
     * Decrypts an AES-256 encrypted string.
     * @param {string} encryptedWithSalt - The encrypted string format "salt:ciphertext".
     * @param {string} password - The user's password/PIN.
     * @returns {string} The decrypted string.
     */
    static decryptData(encryptedWithSalt, password) {
        try {
            const parts = encryptedWithSalt.split(':');
            const salt = CryptoJS.enc.Hex.parse(parts[0]);
            const ciphertext = parts[1];

            const key = CryptoJS.PBKDF2(password, salt, {
                keySize: 256 / 32,
                iterations: 1000
            });

            const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
                iv: salt,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            });

            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("Decryption failed", e);
            return null;
        }
    }

    /**
     * Signs a mock transaction object.
     * @param {object} txData - The transaction data.
     * @param {string} privateKey - The private key to sign with.
     * @returns {string} The signed transaction hash (simulated).
     */
    static signSimulatedTransaction(txData, privateKey) {
        // In a real app, this would use ethers.Wallet.signTransaction
        // Here we simulate the process
        const dataStr = JSON.stringify(txData) + privateKey;
        return CryptoJS.SHA256(dataStr).toString();
    }
}

export default SecurityService;
