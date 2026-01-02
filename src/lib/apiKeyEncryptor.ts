import JSEncrypt from "jsencrypt";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_PUBLIC_KEY;

export function encryptApiKey(apiKey: string): string {
  if (!PUBLIC_KEY) {
    throw new Error(
      "NEXT_PUBLIC_ENCRYPTION_PUBLIC_KEY environment variable is not set."
    );
  }

  const formattedPublicKey = PUBLIC_KEY.replace(/\\n/g, "\n");
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(formattedPublicKey);
  const encryptedApiKey = encryptor.encrypt(apiKey);

  if (!encryptedApiKey) {
    throw new Error("Encryption failed. Please check your public key.");
  }

  return encryptedApiKey;
}
