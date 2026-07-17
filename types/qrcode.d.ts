declare module 'qrcode' {
  type QrOptions = {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    width?: number;
    type?: 'png' | 'svg';
    color?: { dark?: string; light?: string };
  };

  export function toBuffer(
    text: string,
    options?: QrOptions
  ): Promise<Uint8Array>;
  export function toString(text: string, options?: QrOptions): Promise<string>;
}
