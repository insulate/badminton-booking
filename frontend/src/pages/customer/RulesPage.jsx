export default function RulesPage() {
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

  return (
    <div className="min-h-full p-4">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-block bg-blue-50 border-2 border-blue-200 rounded-xl px-6 py-3">
          <h1 className="text-lg md:text-xl font-bold text-blue-700">
            เงื่อนไขการจองสนามแบดมินตัน
          </h1>
        </div>
      </div>

      {/* Rules Content */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column (Rules 1-5) */}
          <div className="space-y-4">
            {rules.slice(0, 5).map((rule) => (
              <div
                key={rule.id}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white font-bold rounded-full text-sm">
                      {rule.id}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {rule.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column (Rules 6-10) */}
          <div className="space-y-4">
            {rules.slice(5, 10).map((rule) => (
              <div
                key={rule.id}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white font-bold rounded-full text-sm">
                      {rule.id}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {rule.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 flex flex-col lg:flex-row lg:justify-end">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm max-w-sm lg:ml-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="5" r="3" />
                  <path d="M12 8C10.34 8 9 9.34 9 11v2c0 1.66 1.34 3 3 3s3-1.34 3-3v-2c0-1.66-1.34-3-3-3z" />
                  <path d="M12 18c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <span className="text-blue-600 font-bold text-lg">
                Lucky Badminton
              </span>
            </div>

            {/* Operating Hours */}
            <div className="text-sm text-gray-700 space-y-1 mb-4">
              <p className="flex items-center gap-2">
                <span className="text-blue-600 font-medium">เวลาเปิด:</span>
              </p>
              <p className="pl-4">จ-ส 08:00-24:00 น.</p>
              <p className="pl-4">อา 08:00-22:00 น.</p>
            </div>

            {/* LINE QR Placeholder */}
            <div className="mb-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mx-auto border border-gray-200">
                <span className="text-gray-400 text-xs text-center">
                  LINE QR
                  <br />
                  Code
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="text-sm space-y-2">
              <p className="flex items-center gap-2 text-gray-700">
                <span className="text-blue-600 font-medium">TEL:</span>
                099-999-9999
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <span className="text-blue-600 font-medium">LINE:</span>
                @luckybadminton
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <span className="text-blue-600 font-medium">FACEBOOK:</span>
                Lucky Badminton
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <span className="text-blue-600 font-medium">INSTAGRAM:</span>
                @luckybadminton
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
