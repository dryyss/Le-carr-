import QRCode from 'qrcode'

import { siteUrl } from './site-url'

export function tableUrl(code: string, qrToken: string): string {
  return `${siteUrl}/t/${encodeURIComponent(code)}?k=${encodeURIComponent(qrToken)}`
}

export async function qrPng(text: string, width = 600): Promise<Buffer> {
  return QRCode.toBuffer(text, { type: 'png', width, margin: 1, errorCorrectionLevel: 'M' })
}
