import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">ตั้งค่า</h1>
        <p className="text-text-secondary mt-1">การตั้งค่าระบบและการกำหนดค่า</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <SettingsIcon className="mx-auto text-primary-blue mb-4" size={64} />
        <p className="text-text-muted text-lg">หน้าตั้งค่ากำลังพัฒนา</p>
      </div>
    </div>
  );
}
