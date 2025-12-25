import { DictionaryEntry, RoadmapStep } from './types';

// --- Google Sheets Configuration ---
export const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1cFYXLvqtv8bMo31u2etTbJq-PDqjGYqeGvFcfQ1V2Bg/export?format=csv'; 

export const ROADMAP_DATA: RoadmapStep[] = [
  {
    phase: 'Phase 1',
    title: 'Core System',
    description: 'พัฒนาระบบพื้นฐานและค้นหา 3 ภาษา',
    details: [
      'UI/UX design ลวดลายอาข่าสมัยใหม่',
      'ระบบค้นหา Akha-Thai-English',
      'ระบบ Bookmark คำที่สนใจ',
      'รองรับการใช้งานแบบ Offline เบื้องต้น'
    ],
    status: 'completed'
  },
  {
    phase: 'Phase 2',
    title: 'Release Version',
    description: 'เวอร์ชันเผยแพร่สาธารณะและระบบจัดการข้อมูล',
    details: [
      'Sync ข้อมูลจาก Google Sheets แบบ Real-time',
      'ระบบ Word of the Day แบบบันทึกค่ารายวัน',
      'ปรับปรุง UI ให้มีความลื่นไหลและสวยงาม'
    ],
    status: 'completed'
  },
  {
    phase: 'Phase 3',
    title: 'Multimedia & Community',
    description: 'ยกระดับการเรียนรู้ด้วยเสียงและชุมชน',
    details: [
      'ระบบ Text-to-Speech (TTS) สำหรับการออกเสียง',
      'คลังภาพวัฒนธรรมและการแต่งกาย',
      'ระบบแนะนำการใช้ภาษาตามบริบทพื้นที่',
      'มินิเกมทายคำศัพท์พื้นบ้าน'
    ],
    status: 'current'
  }
];