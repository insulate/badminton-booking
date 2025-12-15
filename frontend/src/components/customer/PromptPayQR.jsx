import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import generatePayload from 'promptpay-qr';

export default function PromptPayQR({ promptPayNumber, amount }) {
  // Generate PromptPay payload
  const payload = useMemo(() => {
    if (!promptPayNumber) return null;
    try {
      return generatePayload(promptPayNumber, { amount: amount || undefined });
    } catch (error) {
      console.error('Error generating PromptPay payload:', error);
      return null;
    }
  }, [promptPayNumber, amount]);

  if (!payload) {
    return (
      <div className="text-center text-gray-500 py-4">
        ไม่สามารถสร้าง QR Code ได้
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <QRCodeSVG
          value={payload}
          size={200}
          level="M"
          includeMargin={true}
        />
      </div>
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-600">พร้อมเพย์</p>
        <p className="font-medium text-gray-800">{promptPayNumber}</p>
        {amount > 0 && (
          <p className="text-lg font-bold text-blue-600 mt-1">
            {amount.toLocaleString()} บาท
          </p>
        )}
      </div>
    </div>
  );
}
