/**
 * Utilitário Oficial de Geração e Validação de PIX (Padrão EMVCo BRCode)
 * Conforme especificações do Banco Central do Brasil.
 */

export interface PixPayloadParams {
    pixKey: string;
    receiverName: string;
    receiverCity: string;
    amount?: number;
    txId?: string;
    description?: string;
}

/**
 * Utilitário Oficial de Cálculo CRC16-CCITT para BRCode PIX
 * Polinômio: 0x1021 | Valor Inicial: 0xFFFF
 */
export function calculateCRC16(payload: string): string {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
        crc ^= (payload.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ polynomial) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Remove acentuação e caracteres especiais para conformidade EMVCo
 */
function sanitizeText(text: string, maxLength: number): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .toUpperCase()
        .slice(0, maxLength);
}

/**
 * Formata um campo no padrão EMVCo TLV (Tag-Length-Value)
 */
function formatTLV(tag: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${tag}${length}${value}`;
}

/**
 * Gera a string do BRCode PIX (Copia e Cola)
 */
export function generatePixPayload({
    pixKey,
    receiverName,
    receiverCity,
    amount,
    txId = '***',
}: PixPayloadParams): string {
    const cleanKey = pixKey.trim();
    const cleanName = sanitizeText(receiverName || "BARBER PREMIUM", 25);
    const cleanCity = sanitizeText(receiverCity || "SAO PAULO", 15);
    const cleanTxId = (txId || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';

    // 00 - Payload Format Indicator
    let payload = formatTLV('00', '01');

    // 26 - Merchant Account Information (GUI + Chave)
    const gui = formatTLV('00', 'br.gov.bcb.pix');
    const key = formatTLV('01', cleanKey);
    payload += formatTLV('26', `${gui}${key}`);

    // 52 - Merchant Category Code (0000 = Geral)
    payload += formatTLV('52', '0000');

    // 53 - Transaction Currency (986 = BRL)
    payload += formatTLV('53', '986');

    // 54 - Transaction Amount (se fornecido)
    if (amount !== undefined && amount > 0) {
        payload += formatTLV('54', amount.toFixed(2));
    }

    // 58 - Country Code (BR)
    payload += formatTLV('58', 'BR');

    // 59 - Merchant Name
    payload += formatTLV('59', cleanName);

    // 60 - Merchant City
    payload += formatTLV('60', cleanCity);

    // 62 - Additional Data Field Template (TxId)
    const txidTLV = formatTLV('05', cleanTxId);
    payload += formatTLV('62', txidTLV);

    // 63 - CRC16 (Assinatura final)
    const payloadWithoutCRC = `${payload}6304`;
    const crc = calculateCRC16(payloadWithoutCRC);

    return `${payloadWithoutCRC}${crc}`;
}
