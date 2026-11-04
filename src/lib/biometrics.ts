import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export async function checkBiometricSupport() {
  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch (error) {
    console.error("Error checking biometric availability:", error);
    return false;
  }
}

export async function authenticateWithBiometrics() {
  try {
    await NativeBiometric.verifyIdentity({
      reason: 'Authenticate to access your EduCard securely',
      title: 'Biometric Login',
      subtitle: 'Use your fingerprint or device PIN',
      negativeButtonText: 'Cancel'
    });
    
    return true; // Authentication passed
  } catch (error) {
    console.error("Biometric prompt error or cancelled:", error);
    return false;
  }
}