export interface BiometricAdapter {
  isAvailable(): Promise<boolean>;
  authenticate(reason: string): Promise<{success: boolean}>;
}
