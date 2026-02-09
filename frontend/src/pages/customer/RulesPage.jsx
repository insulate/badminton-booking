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

  const rules = [
    {
      id: 1,
      text: 'ราคาและเงื่อนไขการจองสนามนี้ จะเริ่มมีผลตั้งแต่ 1 มกราคม 2568 เป็นต้นไป',
    },
    {
      id: 2,
      text: `ลูกค้าสามารถจองสนามล่วงหน้าได้สูงสุด 2 เดือน โดยระบบจะขยายระยะเวลาการจอง วันต่อวัน
ตัวอย่างเช่น:
• วันที่ 1 ต.ค. สามารถจองได้ถึงวันที่ 30 พ.ย.
• วันที่ 2 ต.ค. สามารถจองได้ถึงวันที่ 1 ธ.ค.
• วันที่ 3 ต.ค. สามารถจองได้ถึงวันที่ 2 ธ.ค.`,
    },
    {
      id: 3,
      text: 'ทางสนามขอสงวนสิทธิ์ในการคืนเงินค่าบริการสนามแบดมินตันในทุกกรณี',
    },
    {
      id: 4,
      text: 'ทางสนามขอสงวนสิทธิ์ในการยกเลิกการจอง / เปลี่ยน, เลื่อน, ย้ายวันหรือเวลาการจอง หรือฝากขายสนาม',
    },
    {
      id: 5,
      text: 'การโอนชำระการจองสนาม ลูกค้าจะต้องโอนชำระเต็มจำนวนเท่านั้น',
    },
    {
      id: 6,
      text: `หากลูกค้าทำการจองสนามเรียบร้อยแล้ว ลูกค้าจะต้องโอนชำระเงินภายใน 5 นาที
(หากเกินระยะเวลาที่กำหนด ระบบจะทำการยกเลิกการจองทันที)

ในกรณีลูกค้าจองผ่านเว็บไซต์:
• หลังจากทำการจองผ่านเว็บไซต์และโอนเงินชำระแล้ว ให้ลูกค้าแคปหน้าจอรายละเอียดการจอง เพื่อแสดงต่อเจ้าหน้าที่เมื่อมาถึงสนาม`,
    },
    {
      id: 7,
      text: 'เมื่อเข้าใช้บริการ ขอความร่วมมือลูกค้าโปรดรักษาความสะอาดในบริเวณสนาม และไม่สร้างความรบกวนต่อผู้อื่น',
    },
    {
      id: 8,
      text: 'เมื่อสิ้นสุดเวลาการจอง ลูกค้าจะต้องออกจากสนาม เพื่อให้ลูกค้าท่านต่อไปเข้าใช้บริการในชั่วโมงถัดไป',
    },
    {
      id: 9,
      text: 'ก่อนทำการจองสนาม ขอความร่วมมือลูกค้าทุกท่านอ่านและทำความเข้าใจเงื่อนไขการจองสนามอย่างละเอียดก่อนทำการจอง',
    },
    {
      id: 10,
      text: 'ทางสนามขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขโดยไม่ต้องแจ้งให้ทราบล่วงหน้า',
    },
  ];

  const venueName = venueInfo?.venue?.name || '';
  const venuePhone = venueInfo?.venue?.phone || '';
  const openTime = venueInfo?.operating?.openTime || '';
  const closeTime = venueInfo?.operating?.closeTime || '';
  const daysOpen = venueInfo?.operating?.daysOpen || [];

  // Format time for display (09:00 → 09.00)
  const formatTime = (time) => {
    if (!time) return '';
    return time.replace(':', '.') + ' น.';
  };

  // Get days label
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
      {/* Background decoration lines - subtle overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
         <div className="absolute top-0 left-1/4 w-px h-full bg-white transform -skew-x-12"></div>
         <div className="absolute top-0 right-1/4 w-px h-full bg-white transform -skew-x-12"></div>
      </div>

      <div className="p-4 md:p-8 relative z-10 max-w-7xl mx-auto">
        {/* Title */}
        <div className="flex justify-center mb-12">
          <div className="bg-yellow-400 px-8 py-4 transform -skew-x-6 shadow-lg">
            <h1 className="text-2xl md:text-4xl font-black text-blue-900 transform skew-x-6 uppercase tracking-wider">
              เงื่อนไขการจองสนามแบดมินตัน
            </h1>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 mb-16">
          {/* Rules 1-5 */}
          <div className="space-y-6">
            {rules.slice(0, 5).map((rule) => (
              <div key={rule.id} className="flex gap-4 text-white">
                <span className="flex-shrink-0 font-bold text-lg">{rule.id}.</span>
                <div className="text-base md:text-lg leading-relaxed whitespace-pre-line font-medium opacity-95">
                  {rule.text}
                </div>
              </div>
            ))}
          </div>

          {/* Rules 6-10 */}
          <div className="space-y-6">
            {rules.slice(5, 10).map((rule) => (
              <div key={rule.id} className="flex gap-4 text-white">
                <span className="flex-shrink-0 font-bold text-lg">{rule.id}.</span>
                <div className="text-base md:text-lg leading-relaxed whitespace-pre-line font-medium opacity-95">
                  {rule.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex flex-col lg:flex-row items-end justify-between border-t border-white/20 pt-8 gap-8">
          {/* Left Footer - Venue Name & Hours */}
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

          {/* Right Footer - Contact Info */}
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
