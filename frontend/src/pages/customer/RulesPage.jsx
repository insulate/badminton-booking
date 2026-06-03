import { useState, useEffect } from 'react';
import { settingsAPI } from '../../lib/api';

export default function RulesPage() {
  const [venueInfo, setVenueInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenueInfo = async () => {
      try {
        const response = await settingsAPI.getVenueInfo();
        if (response.success) {
          setVenueInfo(response.data);
        }
      } catch (error) {
        console.error('Error fetching venue info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenueInfo();
  }, []);

  const venueName = venueInfo?.venue?.name || '';
  const venuePhone = venueInfo?.venue?.phone || '';
  const openTime = venueInfo?.operating?.openTime || '';
  const closeTime = venueInfo?.operating?.closeTime || '';
  const daysOpen = venueInfo?.operating?.daysOpen || [];

  const formatTime = (time) => {
    if (!time) return '';
    return time.replace(':', '.') + ' น.';
  };

  const getDaysLabel = () => {
    if (daysOpen.length === 7) return 'เปิดทุกวัน';
    if (daysOpen.length === 0) return '';
    const dayNames = {
      monday: 'จ.', tuesday: 'อ.', wednesday: 'พ.',
      thursday: 'พฤ.', friday: 'ศ.', saturday: 'ส.', sunday: 'อา.',
    };
    return daysOpen.map(d => dayNames[d] || d).join(', ');
  };

  return (
    <div className="min-h-full bg-blue-700 font-sans">
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-1/4 w-px h-full bg-white transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-white transform -skew-x-12"></div>
      </div>

      <div className="p-4 md:p-8 relative z-10 max-w-4xl mx-auto">
        {/* Title */}
        <div className="flex justify-center mb-10">
          <div className="bg-yellow-400 px-8 py-4 transform -skew-x-6 shadow-lg">
            <h1 className="text-2xl md:text-4xl font-black text-blue-900 transform skew-x-6 uppercase tracking-wider">
              เงื่อนไขการจองสนาม
            </h1>
          </div>
        </div>

        <div className="space-y-8 mb-16">
          {/* Section 1: อัตราค่าบริการ */}
          <div className="bg-blue-800/50 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-black text-yellow-400 mb-4 flex items-center gap-2">
              <span>🏸</span> อัตราค่าบริการ
            </h2>
            <ul className="space-y-2 text-white text-base md:text-lg font-medium">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>ค่าเช่าสนาม: <span className="font-bold text-yellow-300">160 บาท</span> / ชั่วโมง / คอร์ท</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>เช่าไม้แบดมินตัน: <span className="font-bold text-yellow-300">30 บาท</span> / ไม้</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>เช่ารองเท้าแบดมินตัน (ไซส์ 39-42): <span className="font-bold text-yellow-300">30 บาท</span> / คู่</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>ลูกแบดมินตัน (Meirsar, Victor): <span className="font-bold text-yellow-300">90-110 บาท</span> / ลูก</span>
              </li>
            </ul>
          </div>

          {/* Section 2: การจองสนามและการชำระเงิน */}
          <div className="bg-blue-800/50 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-black text-yellow-400 mb-4 flex items-center gap-2">
              <span>📌</span> การจองสนามและการชำระเงิน
            </h2>
            <ol className="space-y-3 text-white text-base md:text-lg font-medium mb-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 bg-yellow-400 text-blue-900 font-black w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                <span>เลือกวัน-เวลา-สนามที่ต้องการ</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 bg-yellow-400 text-blue-900 font-black w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                <span>
                  เมื่อทำการเลือกเวลาและจองสนามเรียบร้อยแล้ว ลูกค้าจะต้องโอนชำระเงินและแนบสลิปหลักฐาน
                  <span className="font-bold text-yellow-300">ภายใน 15 นาที</span> เพื่อยืนยันการจองให้เสร็จสมบูรณ์{' '}
                  <span className="opacity-80">(หากเกินระยะเวลาที่กำหนด ระบบจะทำการยกเลิกสิทธิ์การจองโดยอัตโนมัติทันที)</span>
                </span>
              </li>
            </ol>
            {/* Important note */}
            <div className="bg-yellow-400/15 border border-yellow-400/40 rounded-xl p-4">
              <p className="text-white text-base md:text-lg font-medium leading-relaxed">
                <span className="font-black text-yellow-300">*สำคัญ*</span>{' '}
                หลังจากที่การจองสมบูรณ์และโอนเงินชำระแล้ว ให้ลูกค้าแคปหน้าจอรายละเอียดการจอง
                เพื่อแสดงต่อเจ้าหน้าที่เมื่อมาถึงสนาม
              </p>
            </div>
          </div>

          {/* Section 3: เงื่อนไขการยกเลิกและการคืนเงิน */}
          <div className="bg-blue-800/50 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-black text-yellow-400 mb-4 flex items-center gap-2">
              <span>🔥</span> เงื่อนไขการยกเลิกและการคืนเงิน
            </h2>
            <ul className="space-y-3 text-white text-base md:text-lg font-medium mb-4">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>
                  ยกเลิกก่อนเวลาเล่น <span className="font-bold text-yellow-300">2 ชั่วโมงขึ้นไป</span>: สามารถยกเลิกได้ และรับเงินคืน 100%
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>
                  ช่องทางการแจ้งยกเลิก: กรุณาทักแชทที่เพจ Facebook{' '}
                  <span className="font-bold">(Lucky Badminton | สนามแบดมินตัน)</span>{' '}
                  เพื่อความรวดเร็วในการเช็กเวลาและคืนเงิน
                </span>
              </li>
            </ul>
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-4">
              <p className="text-white text-base md:text-lg font-medium leading-relaxed">
                <span className="font-black text-red-300">⚠️ หมายเหตุ:</span>{' '}
                หากแจ้งยกเลิกน้อยกว่า 2 ชั่วโมงก่อนถึงเวลาเล่น หรือไม่มาเข้าใช้บริการตามเวลา
                ทางสนามขอสงวนสิทธิ์ในการคืนเงินทุกกรณี
              </p>
            </div>
          </div>

          {/* Section 4 & 5: two columns on large screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 4: ระบบก้วน / การจองประจำ */}
            <div className="bg-blue-800/50 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-black text-yellow-400 mb-3 flex items-center gap-2">
                <span>💡</span> ระบบก้วน / การจองประจำ
              </h2>
              <p className="text-white text-base md:text-lg font-medium leading-relaxed opacity-95">
                สำหรับลูกค้าหรือก้วนแบดที่ต้องการล็อกเวลาเล่นเป็นประจำทุกสัปดาห์ ทางสนามมีระบบจองประจำบริการ
                สามารถแจ้งเคาน์เตอร์หรือ Inbox แจ้งทางเพจได้เลย
              </p>
            </div>

            {/* Section 5: การต่อเวลาเล่น */}
            <div className="bg-blue-800/50 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-black text-yellow-400 mb-3 flex items-center gap-2">
                <span>🔑</span> การต่อเวลาเล่น
              </h2>
              <p className="text-white text-base md:text-lg font-medium leading-relaxed opacity-95">
                หากตีสนุกจนอยากต่อเวลา ลูกค้าสามารถเช็กในเว็บไซต์เพื่อดูเวลาว่างและกดจองต่อเวลาด้วยตัวเอง
                หรือแจ้งเจ้าหน้าที่หน้าเคาน์เตอร์สนาม เพื่อเช็กคอร์ทว่างและขอต่อเวลาเล่นได้ทันที
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col lg:flex-row items-end justify-between border-t border-white/20 pt-8 gap-8">
          <div className="w-full lg:w-auto">
            {venueName && (
              <div className="mb-4">
                <h2 className="text-2xl font-black text-white leading-tight">
                  {venueName}
                  <span className="block h-1 w-20 bg-yellow-400 mt-1"></span>
                </h2>
              </div>
            )}
            {openTime && closeTime && (
              <div className="space-y-2 text-white font-medium">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-800 px-2 py-0.5 rounded text-sm text-yellow-400 font-bold border border-yellow-400/30">
                    {getDaysLabel()}
                  </span>
                  <span className="text-lg">{formatTime(openTime)} - {formatTime(closeTime)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center md:items-end gap-4 w-full lg:w-auto">
            {venuePhone && (
              <div className="text-white text-right">
                <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Tel</p>
                <p className="text-lg font-bold">{venuePhone}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
