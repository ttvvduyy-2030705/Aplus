import type {NfcAdapter, NfcAdapterSupport, NfcCredential} from '@/types/nfc';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

let forcedUnsupported = false;

export const MockNfcAdapter: NfcAdapter & {setForcedUnsupported: (value: boolean) => void} = {
  setForcedUnsupported(value: boolean) {
    forcedUnsupported = value;
  },

  async checkSupport(): Promise<NfcAdapterSupport> {
    await wait(120);
    if (forcedUnsupported) {
      return {
        phoneSupported: false,
        nfcEnabled: false,
        secureElementAvailable: false,
        hceAvailable: false,
        message: 'Thiết bị mock không hỗ trợ NFC/HCE.',
      };
    }
    return {
      phoneSupported: true,
      nfcEnabled: true,
      secureElementAvailable: true,
      hceAvailable: true,
      message: 'NFC/HCE mock sẵn sàng để ghi mobile card.',
    };
  },

  async provisionMobileCard(credential: NfcCredential) {
    await wait(220);
    if (credential.deviceSupport === 'unsupported') {
      throw new Error('Điện thoại không hỗ trợ NFC/HCE nên không thể ghi mobile card.');
    }
    return {secureElementRef: `SE-${credential.mobileCardId}-${String(Date.now()).slice(-5)}`};
  },

  async disableMobileCard() {
    await wait(120);
    return true;
  },
};
