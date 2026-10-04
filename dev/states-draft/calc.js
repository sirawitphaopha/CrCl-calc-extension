/* ระบบคำนวณกล่อง CrCl — สูตรล้วน ไม่แตะหน้าจอ
 *
 * ยกจาก TB calc 100% (C:/Users/PKH/tb-calculator · script.js · calcCrCl() กับส่วน CrCl ใน calculate() · LIMITS · toggle*Unit)
 * ผ่านมอคอัปที่พี่กันเคาะแล้ว docs/mockups/crcl-box-narrow-wide-2026-10-02.html
 * 🔴 ห้ามแก้สูตร เกณฑ์ หรือขอบเขตเอง ต้องตรงกับ TB calc เสมอ (สกิล medical-data-safety) · ตรวจด้วย dev/parity.html
 *
 * ส่วนที่ต่างจาก TB calc โดยตั้งใจ (เคาะในมอคอัป)
 * - ไม่มีเกณฑ์ CrCl ต่ำกว่า 30 เพราะเป็นเกณฑ์ของยาวัณโรค
 * - ยังไม่เลือกเพศ ยังไม่เตือนว่า sCr สูงหรือต่ำ
 * - ค่าที่เกินขอบเขต ไม่เอาไปคิด eGFR และ BMI
 *
 * ใช้ร่วมกันสองที่ คือกล่องลอย (สคริปต์ที่ฉีดลงหน้าเว็บ) กับแผงข้าง (sidepanel.html)
 */
(function (g) {
  'use strict';
  const CrCl = g.CrCl || (g.CrCl = {});
  if (CrCl.calc) return;

  // ขอบเขตค่าตาม LIMITS ของ TB calc · next = หน่วยถัดไปตอนกดสลับ
  const UNIT = {
    wu: { kg: { lim: [20, 200], next: 'lb' }, lb: { lim: [44, 441], next: 'kg' } },
    hu: { cm: { lim: [100, 230], next: 'inch' }, inch: { lim: [40, 91], next: 'cm' } },
    su: { mgdl: { lim: [0.1, 30], next: 'umol' }, umol: { lim: [9, 2652], next: 'mgdl' } },
  };
  const UNIT_TXT = { kg: 'kg', lb: 'lb', cm: 'cm', inch: 'in', mgdl: 'mg/dL', umol: 'μmol/L' };
  const FIELD_OF = { wu: 'w', hu: 'h', su: 'scr' };
  const UNIT_OF = { w: 'wu', h: 'hu', scr: 'su' };
  // ตัวเลขตัวอย่างกว้างเท่ากัน 3 ตัวอักษร คำว่า "เช่น" ตรงแนวกันทุกช่องตอนชิดขวา (พี่กันสั่ง "เห็นคำว่า เช่น ไหม เอาให้มันตรงกัน" 4 ต.ค. 2569)
  // ตัวเลข 2 หลักเติมช่องว่างไม่ตัดบรรทัด ( ) ข้างหน้าหนึ่งตัว ฟอนต์ตัวเลขเป็นแบบกว้างเท่ากันทุกตัว
  const PH = {
    age: 'เช่น  45',
    w: { kg: 'เช่น  60', lb: 'เช่น 132' },
    h: { cm: 'เช่น 165', inch: 'เช่น  65' },
    scr: { mgdl: 'เช่น 1.0', umol: 'เช่น  88' },
  };
  // ข้อความตาม lang.js ของ TB calc
  const ERR = {
    w: { kg: ['น้ำหนักต่ำเกินไป (ต่ำสุด 20 kg)', 'น้ำหนักสูงเกินไป (สูงสุด 200 kg)'], lb: ['น้ำหนักต่ำเกินไป (ต่ำสุด 44 lb)', 'น้ำหนักสูงเกินไป (สูงสุด 441 lb)'] },
    h: { cm: ['ส่วนสูงต่ำเกินไป (ต่ำสุด 100 cm)', 'ส่วนสูงสูงเกินไป (สูงสุด 230 cm)'], inch: ['ส่วนสูงต่ำเกินไป (ต่ำสุด 40 in)', 'ส่วนสูงสูงเกินไป (สูงสุด 91 in)'] },
    age: ['อายุต่ำเกินไป (ต่ำสุด 15 ปี)', 'อายุสูงเกินไป (สูงสุด 110 ปี)'],
    scr: { mgdl: ['ค่า sCr ต่ำเกินไป (ต่ำสุด 0.1 mg/dL)', 'ค่า sCr สูงเกินไป (สูงสุด 30 mg/dL)'], umol: ['ค่า sCr ต่ำเกินไป (ต่ำสุด 9 μmol/L)', 'ค่า sCr สูงเกินไป (สูงสุด 2652 μmol/L)'] },
  };

  /** CrCl สูตร Cockcroft-Gault · ตัวนี้ใช้ปรับขนาดยา · ไม่ปัดค่า sCr · ผู้หญิงคูณ 0.85 */
  function calcCrCl(bw, age, scr, sex) {
    const v = ((140 - age) * bw) / (72 * scr);
    return sex === 'female' ? v * 0.85 : v;
  }
  /** eGFR สูตร CKD-EPI 2021 · แสดงผลเท่านั้น ห้ามเอาไปปรับขนาดยา */
  function calcEGFR(scr, age, sex) {
    const k = sex === 'female' ? 0.7 : 0.9;
    const a = sex === 'female' ? -0.241 : -0.302;
    const r = scr / k;
    return 142 * Math.pow(Math.min(r, 1), a) * Math.pow(Math.max(r, 1), -1.2) * Math.pow(0.9938, age) * (sex === 'female' ? 1.012 : 1);
  }
  /** ระยะ CKD ตาม TB calc ครบ 6 ระยะ ห้ามรวม · สีอยู่ใน box.css ตามคลาส */
  function ckdStage(v) {
    if (v >= 90) return { label: 'Stage 1', cls: 'ckd-1' };
    if (v >= 60) return { label: 'Stage 2', cls: 'ckd-2' };
    if (v >= 45) return { label: 'Stage 3a', cls: 'ckd-3a' };
    if (v >= 30) return { label: 'Stage 3b', cls: 'ckd-3b' };
    if (v >= 15) return { label: 'Stage 4', cls: 'ckd-4' };
    return { label: 'Stage 5 (ESRD)', cls: 'ckd-5' };
  }
  /** ระดับ BMI เกณฑ์ WHO Asia-Pacific ตาม TB calc · แสดงผลเท่านั้น */
  function bmiClass(b) {
    if (b < 18.5) return { label: 'Underweight (ผอม)', cls: 'bmi-under' };
    if (b < 23) return { label: 'Normal Weight (ปกติ)', cls: 'bmi-normal' };
    if (b < 25) return { label: 'Overweight (น้ำหนักเกิน)', cls: 'bmi-over' };
    if (b < 30) return { label: 'Obese I (อ้วนระดับ 1)', cls: 'bmi-ob1' };
    if (b < 35) return { label: 'Obese II (อ้วนระดับ 2)', cls: 'bmi-ob2' };
    return { label: 'Obese III (อ้วนระดับ 3)', cls: 'bmi-ob3' };
  }
  function num(s) {
    if (s === '' || s == null) return NaN;
    const v = Number(String(s));
    return Number.isFinite(v) ? v : NaN;
  }

  /** ค่าตั้งต้นของผู้ป่วยหนึ่งราย · น้ำหนักเริ่มว่าง ไม่มีค่าตั้งต้น 50 kg แบบ TB calc (ตั้งใจ) */
  const emptyState = () => ({ sex: '', age: '', w: '', h: '', scr: '', wu: 'kg', hu: 'cm', su: 'mgdl' });

  /** ทำความสะอาดสิ่งที่พิมพ์ ประตูเดียวตอนรับเข้า · ลูกน้ำเป็นจุด · เหลือตัวเลขกับจุดเดียว */
  function sanitizeNumber(raw) {
    let v = String(raw).replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const dot = v.indexOf('.');
    if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/[.]/g, '');
    return v;
  }

  /** แปลงค่าตอนกดสลับหน่วย ตาม toggleWeightUnit / toggleHeightUnit / toggleScrUnit ของ TB calc */
  function convertUnit(key, cur, raw) {
    const val = parseFloat(raw);
    if (!Number.isFinite(val)) return raw;
    if (key === 'wu') return String(cur === 'kg' ? Math.round(val * 2.20462) : Math.round(val / 2.20462));
    if (key === 'hu') return String(cur === 'cm' ? (val / 2.54).toFixed(1) : Math.round(val * 2.54));
    return String(cur === 'mgdl' ? Math.round(val * 88.4) : (val / 88.4).toFixed(2));
  }

  /** คิดทุกอย่างจากค่าที่กรอก คืนผลพร้อมสถานะของแต่ละส่วน (แยกด้วยธง ไม่เดาจากผลว่าง) */
  function compute(st) {
    const r = { err: {} };
    const wRaw = num(st.w), hRaw = num(st.h), age = num(st.age), sRaw = num(st.scr);
    const check = (key, v, lim, msgs) => {
      if (!Number.isFinite(v)) return;
      if (v < lim[0]) r.err[key] = msgs[0];
      else if (v > lim[1]) r.err[key] = msgs[1];
    };
    check('w', wRaw, UNIT.wu[st.wu].lim, ERR.w[st.wu]);
    check('h', hRaw, UNIT.hu[st.hu].lim, ERR.h[st.hu]);
    check('age', age, [15, 110], ERR.age);
    check('scr', sRaw, UNIT.su[st.su].lim, ERR.scr[st.su]);
    const w = st.wu === 'lb' ? wRaw / 2.20462 : wRaw;
    const h = st.hu === 'inch' ? hRaw * 2.54 : hRaw;
    const scr = st.su === 'umol' ? sRaw / 88.4 : sRaw;
    const sex = st.sex;
    r.hasError = Object.keys(r.err).length > 0;
    // อายุนอก 18 ถึง 92 ปี = เตือนสีส้มแต่ยังคิด (ระบบเตือน ไม่ใช่ระบบห้าม)
    r.ageWarn = Number.isFinite(age) && !r.err.age && (age < 18 || age > 92);
    r.sexWarn = !sex && (Number.isFinite(sRaw) || Number.isFinite(hRaw) || Number.isFinite(age));

    // ค่าอ้างอิง sCr ตาม TB calc (ชาย 0.7 ถึง 1.2 · หญิง 0.5 ถึง 1.0 mg/dL) ยังไม่เลือกเพศ = ยังไม่เตือน
    r.crRef = 'neutral';
    if (Number.isFinite(sRaw) && !r.err.scr && sex) {
      const ref = sex === 'male' ? [0.7, 1.2] : [0.5, 1.0];
      r.crRef = scr < ref[0] ? 'low' : scr > ref[1] ? 'high' : 'ok';
    }

    // CrCl เลือกน้ำหนักตามกติกาของ TB calc
    const ready = w > 0 && Number.isFinite(age) && Number.isFinite(scr) && (sex === 'male' || sex === 'female');
    if (r.hasError) {
      r.crcl = { state: 'error' };
    } else if (ready && Number.isFinite(h)) {
      const over60 = Math.max(0, h / 2.54 - 60);
      const ibw = sex === 'male' ? 50 + 2.3 * over60 : 45.5 + 2.3 * over60;
      const adj = ibw + 0.4 * (w - ibw);
      const short = h < 152;
      const cA = calcCrCl(w, age, scr, sex);
      const cI = short ? null : calcCrCl(ibw, age, scr, sex);
      const cJ = short ? null : calcCrCl(adj, age, scr, sex);
      let pick, kind;
      if (short) { pick = 'A'; kind = 'short'; }
      else if (w < ibw) { pick = 'A'; kind = 'under'; }
      else if (w > ibw * 1.2) { pick = 'J'; kind = 'obese'; }
      else { pick = 'I'; kind = 'normal'; }
      const bmi = w / ((h / 100) ** 2);
      r.crcl = {
        state: 'full', w, ibw, adj, short, cA, cI, cJ, pick, kind,
        obLevel: bmi < 30 ? 1 : bmi < 35 ? 2 : 3,
        value: pick === 'A' ? cA : pick === 'I' ? cI : cJ,
      };
    } else if (ready) {
      const cA = calcCrCl(w, age, scr, sex);
      r.crcl = { state: 'noheight', w, cA, pick: 'A', value: cA };
    } else {
      // เรียงตามลำดับช่องกรอก เพศ อายุ sCr BW (พี่กันสั่งเรียงช่อง sCr ก่อน BW แล้วสั่งแก้ข้อความนี้ให้ตรง 4 ต.ค. 2569)
      const miss = [];
      if (!sex) miss.push('Sex');
      if (!Number.isFinite(age)) miss.push('Age');
      if (!Number.isFinite(scr)) miss.push('sCr');
      if (!(w > 0)) miss.push('Weight');
      r.crcl = { state: 'incomplete', missing: miss };
    }

    // eGFR แสดงผลเท่านั้น
    if (Number.isFinite(scr) && Number.isFinite(age) && sex && !r.err.scr && !r.err.age) {
      const v = calcEGFR(scr, age, sex);
      r.egfr = { v, stage: ckdStage(v) };
    } else {
      r.egfr = { state: (r.err.scr || r.err.age) ? 'error' : 'incomplete' };
    }
    // BMI แสดงผลเท่านั้น
    if (w > 0 && Number.isFinite(h) && !r.err.w && !r.err.h) {
      const v = w / ((h / 100) ** 2);
      r.bmi = { v, cls: bmiClass(v) };
    } else {
      r.bmi = { state: (r.err.w || r.err.h) ? 'error' : 'incomplete' };
    }
    return r;
  }

  /** ค่า CrCl ที่ใช้ขึ้นบนแถบตอนพับ · ไม่มีค่า = null */
  function crclValue(r) {
    const c = r && r.crcl;
    return c && (c.state === 'full' || c.state === 'noheight') ? c.value : null;
  }

  CrCl.calc = {
    UNIT, UNIT_TXT, FIELD_OF, UNIT_OF, PH, ERR,
    calcCrCl, calcEGFR, ckdStage, bmiClass, num, emptyState, sanitizeNumber, convertUnit, compute, crclValue,
  };
})(globalThis);
