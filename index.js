// Node.js WebCrypto API
const crypto = require("crypto").webcrypto;

// Utility function to convert an ArrayBuffer to a hex string
function bufferToHex(buffer) {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

// Utility function to convert a hex string to an ArrayBuffer
function hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
}

// Hash the string to produce a key of correct length
async function createKeyFromString(keyString) {
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return crypto.subtle.importKey(
        "raw",
        hashBuffer,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Encrypt function
async function encryptData(plainText, keyString) {
    const key = await createKeyFromString(keyString);

    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const cipherText = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data
    );

    return {
        iv: bufferToHex(iv),
        cipherText: bufferToHex(cipherText),
    };
}

// Decrypt function
async function decryptData(encryptedData, keyString) {
    const key = await createKeyFromString(keyString);

    const { iv, cipherText } = encryptedData;

    const ivBuffer = hexToBuffer(iv);
    const cipherTextBuffer = hexToBuffer(cipherText);

    const decryptedData = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivBuffer,
        },
        key,
        cipherTextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
}

module.exports = { encryptData, decryptData };
