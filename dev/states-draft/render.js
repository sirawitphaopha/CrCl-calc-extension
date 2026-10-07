/* ตัววาดผลของกล่อง CrCl กับไอคอน — ยกจากมอคอัปที่พี่กันเคาะแล้ว
 * docs/mockups/crcl-box-narrow-wide-2026-10-02.html (basisHTML · tableHTML · crclHTML · egfrHTML · bmiHTML · resultsHTML · crRefMsg · ICON)
 *
 * ต่างจากมอคอัป
 * - สีของระยะ CKD กับระดับ BMI ใช้คลาสใน box.css แทน style ที่ฝังในแท็ก (กันหน้าเว็บที่ตั้ง CSP เข้ม · สกิล web-craft 6.21 ⑪)
 * - ไอคอนเพิ่ม 2 ตัวสำหรับปุ่มสลับกล่องลอยกับแผงข้าง · ไอคอนปุ่มเลือกขอบ 4 แบบ (ICON.edge)
 * ข้อความที่แทรกลงหน้าจอมีแต่ตัวเลขที่คิดเองกับข้อความตายตัว ไม่มีสิ่งที่ผู้ใช้พิมพ์
 */
(function (g) {
  'use strict';
  const CrCl = g.CrCl || (g.CrCl = {});
  if (CrCl.render) return;

  /* ไอคอนวาดด้วยเส้น ห้ามใช้ตัวอักษรพิเศษ */
  const sv = (s, body, sw = 2.2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  const ICON = {
    grip: '<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/><circle cx="2.5" cy="8" r="1.5"/><circle cx="7.5" cy="8" r="1.5"/><circle cx="2.5" cy="13.5" r="1.5"/><circle cx="7.5" cy="13.5" r="1.5"/></svg>',
    // เครื่องหมายถูกหน้าแถวที่ใช้ในตารางน้ำหนัก (พี่กันเลือก 5 ต.ค. 2569)
    check: sv(11, '<path d="M5 12.5l4.5 4.5L19 7.5"/>', 3.2),
    // ไอคอนสลับแบบ วาด "แบบที่เป็นอยู่ตอนนี้" ตามกฎไอคอนสลับสถานะ
    narrow: sv(18, '<rect x="7" y="3.5" width="10" height="17" rx="2"/><path d="M10 8.5h4"/><path d="M10 12h4"/><path d="M10 15.5h4"/>', 1.9),
    wide: sv(18, '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M11 5.5v13"/><path d="M5 9.5h3.5"/><path d="M5 13h3.5"/><path d="M13.8 9.5h5"/><path d="M13.8 13h5"/>', 1.9),
    // ตอนนี้เป็นกล่องลอย = กรอบหน้าเว็บมีกล่องเล็กติดขอบ · ตอนนี้เป็นแผงข้าง = กรอบหน้าเว็บมีแผงเต็มความสูง
    modeFloat: sv(18, '<rect x="2.5" y="4" width="19" height="16" rx="2"/><rect x="13.5" y="8" width="5" height="8" rx="1.2"/>', 1.9),
    modePanel: sv(18, '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M15 4v16"/><path d="M17.3 9h1.7"/><path d="M17.3 12h1.7"/>', 1.9),
    // ปุ่มเลือกขอบ (พี่กันเลือกแบบ ข 3 ต.ค. 2569) ลูกศรออก 4 ทิศ ลูกศรเข้มที่มีเส้นปิดปลายคือขอบที่ติดอยู่ ลูกศรจางคือขอบอื่น
    // ไม่ใช้รูปจอ เพราะจะไปเหมือนปุ่มสลับกล่องลอยกับแผงข้างที่อยู่ข้างกัน
    edge: (() => {
      const ARM = {
        top: ['M12 12V5.5', '12,3.2 9.1,6.8 14.9,6.8', 'M6.5 1.4h11'],
        bottom: ['M12 12v6.5', '12,20.8 9.1,17.2 14.9,17.2', 'M6.5 22.6h11'],
        left: ['M12 12H5.5', '3.2,12 6.8,9.1 6.8,14.9', 'M1.4 6.5v11'],
        right: ['M12 12h6.5', '20.8,12 17.2,9.1 17.2,14.9', 'M22.6 6.5v11'],
      };
      const icon = (e) => sv(18, Object.entries(ARM).map(([k, [line, head, bar]]) => (k === e
        ? `<g><path d="${line}" stroke-width="2.2"/><polygon points="${head}" fill="currentColor" stroke="none"/><path d="${bar}" stroke-width="2.4"/></g>`
        : `<g opacity=".38"><path d="${line}" stroke-width="1.8"/><polygon points="${head}" fill="currentColor" stroke="none"/></g>`)).join(''), 2);
      return { right: icon('right'), left: icon('left'), top: icon('top'), bottom: icon('bottom') };
    })(),
    foldR: sv(16, '<path d="M6 6l6 6-6 6"/><path d="M13 6l6 6-6 6"/>'),
    foldL: sv(16, '<path d="M18 6l-6 6 6 6"/><path d="M11 6l-6 6 6 6"/>'),
    close: sv(16, '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'),
    x: sv(13, '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>', 2.6),
    alert: sv(15, '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4"/><path d="M12 17.3v.2"/>'),
    alertSm: sv(13, '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4"/><path d="M12 17.3v.2"/>', 2.4),
    // บั้งคู่ขึ้นลง ต่อท้ายตัวเลขในช่อง sCr ตอนสูงหรือต่ำกว่าค่าอ้างอิง (พี่กันเลือกแบบ 7-7 ข้อ 7 กับ 8 "เอาอันนี้" 5 ต.ค. 2569)
    flagUp: sv(14, '<path d="M6 12l6-6 6 6"/><path d="M6 18l6-6 6 6"/>', 2.6),
    flagDown: sv(14, '<path d="M6 6l6 6 6-6"/><path d="M6 12l6 6 6-6"/>', 2.6),
    swapSm: sv(12, '<path d="M4 9h16"/><path d="M15 4l5 5"/><path d="M20 15H4"/><path d="M9 20l-5-5"/>', 2.4),
    calc: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="2.5" width="16" height="19" rx="3.2" fill="currentColor"/><rect x="7" y="5.5" width="10" height="4.2" rx="1.2" fill="#fff"/><g fill="#fff"><circle cx="8.6" cy="13.3" r="1.25"/><circle cx="12" cy="13.3" r="1.25"/><circle cx="15.4" cy="13.3" r="1.25"/><circle cx="8.6" cy="17.3" r="1.25"/><circle cx="12" cy="17.3" r="1.25"/><circle cx="15.4" cy="17.3" r="1.25"/></g></svg>',
  };

  const f1 = (v) => v.toFixed(1);
  function joinThai(list) {
    if (list.length <= 1) return list.join('');
    return list.slice(0, -1).join(' ') + ' และ ' + list[list.length - 1];
  }
  function warnLine(t, cls) { return `<div class="cx-warnline${cls ? ' ' + cls : ''}">${ICON.alertSm}<span>${t}</span></div>`; }
  /** กล่องแดงตอนช่องที่ใช้คิดเกินขอบเขต บอกชื่อช่องที่เกินจริง เรียงตามช่องกรอก ชื่อเดียวกับป้ายช่อง · keys = ช่องที่ส่วนนั้นใช้คิด
   *  ส่วน CrCl แบบ 9-3 ข้อ 2 · eGFR กับ BMI แบบ 9-4 ข้อ 3 กล่องแดงคำเดียวกัน (พี่กันเลือก 7 ต.ค. 2569) */
  const FIELD_NAME = [['age', 'Age'], ['scr', 'sCr'], ['w', 'Weight'], ['h', 'Height']];
  function errBox(r, keys) {
    const bad = FIELD_NAME.filter(([k]) => keys.includes(k) && r.err[k]).map(([, n]) => n);
    return `<div class="cx-alert err">${ICON.alert}<span>คำนวณไม่ได้ เพราะ ${joinThai(bad)} เกินขอบเขต</span></div>`;
  }

  /** น้ำหนักบนจอตามหน่วยของช่อง Weight · ระบบคิดเป็น kg เสมอ ตอนช่องเป็น lb แปลงตอนแสดง × 2.20462 (ตัวคูณเดียวกับปุ่มสลับหน่วย) ทศนิยม 1 ตำแหน่ง
   *  (พี่กันเลือกแบบ ก กลุ่ม 13-2 lb อย่างเดียว "ก ไม่เอาวงเล็บ" 7 ต.ค. 2569 · เดิมกล่องกับตารางเป็น kg ทุกหน่วย) · r.units ใส่มาจาก box.js */
  const wOut = (r) => (r && r.units && r.units.wu === 'lb' ? { f: (kg) => f1(kg * 2.20462), u: 'lb' } : { f: f1, u: 'kg' });

  /** กล่องบอกน้ำหนักที่ใช้และเหตุผล */
  /** below คือรายการที่จะไปเป็นหมายเหตุใต้แถวตัวเลข ไม่มีกรอบ (กรณีที่พี่กันเกลาแล้ว) */
  function basisHTML(c, r, below) {
    const W = wOut(r);
    const lines = [];
    let toBelow = false;
    let cls, main, why, ask = '';
    if (c.state === 'noheight') {
      // ตัดบรรทัดเหตุผล คำขอให้กรอกไปอยู่ใต้แถวตัวเลข ไม่มีไอคอน เพราะเป็นคำขอ ไม่ใช่คำเตือน · เริ่มตรงกับคำว่าใช้ในกล่อง (box.css .nh)
      // (พี่กันเลือกแบบ 6-1 ข้อ 7 "เอา 7 เเละขยับ กรุณา... ไปฝั่งขวา ให้ตรงกัล ใช้ actual" 5 ต.ค. 2569 · เดิม เพราะยังไม่ได้กรอกส่วนสูง กับ กรอกส่วนสูงเพื่อความแม่นยำ อยู่ในกล่อง)
      cls = 'noht'; main = `ใช้ Actual BW ${W.f(c.w)} ${W.u}`; why = '';
      // เหลือแค่ กรุณากรอกส่วนสูง ให้อยู่บรรทัดเดียวในแผงแคบ (พี่กันสั่ง "กรุณากรอกส่วนสูง เอาเเค่นี้" 5 ต.ค. 2569)
      // คำขออยู่ใต้กล่องในคอลัมน์ขวา ตัวเลข CrCl จึงอยู่กึ่งกลางความสูงของกล่องกับคำขอรวมกัน
      // (พี่กันสั่ง "เอา 58.6 ไปอยู่ตรงหลาง ตอนนี้มันอยู่บนน่ะ" 5 ต.ค. 2569 · เดิมคำขออยู่ใต้แถวตัวเลข ตัวเลขกึ่งกลางเฉพาะกล่อง)
      ask = 'กรุณากรอกส่วนสูง';
      toBelow = true;
    } else if (c.kind === 'short') {
      // ตัดบรรทัดเหตุผล คำเตือนสั้นลง ย้ายไปเป็นหมายเหตุใต้แถวตัวเลข ขึ้นต้นด้วย สูงต่ำกว่า 152 cm: แนวเดียวกับผอม
      // (พี่กันเลือกแบบ 5-1 ข้อ 5 "เอาอันนี้" 5 ต.ค. 2569 · เดิม เพราะสูงต่ำกว่า 152 cm กับ อาจมีภาวะหลังค่อม ค่า CrCl อาจต่ำกว่าความเป็นจริง อยู่ในกล่อง)
      cls = 'short'; main = `ใช้ Actual BW ${W.f(c.w)} ${W.u}`; why = '';
      // คำนำหน้าใช้คำว่าส่วนสูง แล้วเปลี่ยนต่ำกว่าเป็นเครื่องหมายน้อยกว่า (พี่กันสั่ง "ใช่คำว่า ส่วนสูง" "ต่ำกว่า เป็น <" 5 ต.ค. 2569 · เดิม สูงต่ำกว่า 152 cm:)
      // ข้อความนี้ลง innerHTML จึงเขียน < เป็น &lt;
      // ตัดคำว่ามีภาวะ ให้อยู่บรรทัดเดียวในแผงแคบ (พี่กันสั่ง "เอา อาจหลังค่อม" 5 ต.ค. 2569)
      // ช่อง Height เป็น in เกณฑ์บอกเป็น in ด้วย 152 ÷ 2.54 = 59.8 เครื่องหมายน้อยกว่าเหมือนเกณฑ์ต้นฉบับ · ระบบยังตัดสินจาก cm < 152
      // (พี่กันให้เลือกแบบที่ใช้กันปกติ "13-3 เอาอันไหนดี 2 หรือ 3 ที่ต่างเเค่เครื่องหมาย ปกติเขาใช้อันไหน เอาอันนั้น" 7 ต.ค. 2569 แคลร์เลือกแบบ 2)
      const inch = r && r.units && r.units.hu === 'inch';
      lines.push(`ส่วนสูง &lt; ${inch ? `${(152 / 2.54).toFixed(1)} in` : '152 cm'}: อาจหลังค่อม CrCl อาจต่ำเกินจริง`);
      toBelow = true;
    } else if (c.kind === 'under') {
      // ตัดคำ Underweight ตัดบรรทัดเหตุผล คำเตือนแบบสั้น แล้วย้ายคำเตือนไปเป็นหมายเหตุใต้แถวตัวเลขไม่มีกรอบ
      // (พี่กันเลือกแบบ 3-2 ข้อ 6 "เอาอันนี้ เเต่ย้าย มวลกล้ามเนื้อ ไปไว้เป็นหมายเหตุด้านล่างเลย โดยไม่มีกรอบ" 5 ต.ค. 2569)
      cls = 'under'; main = `ใช้ Actual BW ${W.f(c.w)} ${W.u}`; why = '';
      // ขึ้นต้นด้วย Underweight ตามด้วยทวิภาค (พี่กันเลือกแบบ 3-3 ข้อ 2 แล้วเลือกตัวคั่นแบบ 3-4 ข้อ 1 5 ต.ค. 2569)
      lines.push('Underweight: มวลกล้ามเนื้อน้อย CrCl อาจสูงเกินจริง');
      toBelow = true;
    } else if (c.kind === 'obese') {
      // ตัดคำ Obese กับบรรทัดเหตุผล เหมือนกรณีปกติกับผอม · ตัวหนังสือในกล่องนี้ 10.5 ให้อยู่บรรทัดเดียว (box.css)
      // (พี่กันเลือกแบบ 4-1 ข้อ 7 "เอาข้อ 7" 5 ต.ค. 2569 · เดิม Obese ใช้ Adjusted BW xx kg กับ เพราะ BW มากกว่า 1.2 เท่าของ IBW)
      cls = 'obese o' + c.obLevel; main = `ใช้ Adjusted BW ${W.f(c.adj)} ${W.u}`; why = '';
    } else {
      // กรณีปกติไม่มีบรรทัดเหตุผล กรณีอื่นยังบอกว่าทำไมไม่ใช้ IBW (พี่กันเลือก "เอาออกเฉพาะ Normal" แล้วสั่ง "เอาออกเลย" 5 ต.ค. 2569)
      // ไม่มีคำว่า Normal อ่านแล้วสงสัยว่าปกติอะไร และชนกับ BMI ที่อาจขึ้น Overweight (พี่กันสั่ง "เอาแบบตัดคำ Normal ออก" 5 ต.ค. 2569)
      cls = 'normal'; main = `ใช้ Ideal BW ${W.f(c.ibw)} ${W.u}`; why = '';
    }
    // ขึ้นต้นด้วยกรณีแล้วทวิภาค เหมือนหมายเหตุอื่น (พี่กันเลือกแบบ 7-3 ข้อ 2 5 ต.ค. 2569 · เดิม อายุนอกช่วง 18–92 ปีที่สูตรรองรับ ค่า CrCl อาจไม่แม่นยำ)
    if (r.ageWarn) lines.push('อายุนอกช่วง 18–92 ปี: CrCl อาจไม่แม่นยำ');
    if (toBelow && below) { below.push(...lines); lines.length = 0; }
    const box = `<div class="cx-basis ${cls}"><div class="cx-basis-main">${main}</div>${why ? `<div class="cx-basis-why">${why}</div>` : ''}${lines.map(warnLine).join('')}</div>`;
    return ask ? `<div class="cx-rcol">${box}<div class="cx-warnline nh"><span>${ask}</span></div></div>` : box;
  }

  /** ตารางน้ำหนักสามแบบ เป็นตารางจริง */
  function tableHTML(c, r) {
    const W = wOut(r);
    const row = (key, label, bw, cc, note) => {
      const on = c.pick === key;
      const cells = note ? `<td colspan="2" class="cx-na">${note}</td>` : `<td>${W.f(bw)}</td><td>${f1(cc)}</td>`;
      // ช่องหน้าชื่อแถวจองที่ไว้ทุกแถว แถวที่ใช้มีเครื่องหมายถูก ชื่อแถวจึงตรงแนวกันทุกแถว
      // (พี่กันสั่ง "ติ๊กแบบรูป 2 เเต่ต้องเว้นระยะให้เครื่องหมายด้วย" 5 ต.ค. 2569 · เดิมเป็นแถบเขียวทางซ้าย)
      return `<tr class="${on ? 'on' : ''}"><th scope="row"><span class="cx-ck">${on ? ICON.check : ''}</span>${label}${on ? '<span class="sr"> ใช้ค่านี้</span>' : ''}</th>${cells}</tr>`;
    };
    // ขึ้นต้นด้วยกรุณาเหมือนคำขอใต้กล่อง (พี่กันสั่ง "กรุณา ด้วย" 5 ต.ค. 2569 · เดิม กรอกส่วนสูง)
    const note = c.state === 'noheight' ? 'กรุณากรอกส่วนสูง' : c.short ? 'N/A' : '';
    const rows = row('A', 'Actual BW', c.w, c.cA)
      + (note ? row('I', 'Ideal BW', 0, 0, note) + row('J', 'Adjusted BW', 0, 0, note)
              : row('I', 'Ideal BW', c.ibw, c.cI) + row('J', 'Adjusted BW', c.adj, c.cJ));
    return `<table class="cx-bw"><thead><tr><th scope="col"><span class="sr">ชนิดน้ำหนัก</span></th><th scope="col">BW (${W.u})</th><th scope="col">CrCl (mL/min)</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  /** ส่วน CrCl — ตัวนี้ใช้ปรับขนาดยา */
  function crclHTML(r) {
    const c = r.crcl;
    // หัวข้อ CrCl ชื่อสูตรในวงเล็บสีจางต่อท้าย แบบเดียวกับ eGFR กับ BMI · เดิม "Creatinine Clearance (CrCl)" กับชื่อสูตรเป็นบรรทัดใต้หัวข้อ
    // พี่กันเลือกเอง แม้สกิลจะให้หัวข้อเป็นชื่อเต็ม ชื่อเต็มจะไปอยู่บนหัวกล่องแทน (กำลังเลือกในหน้าเกลาคำ)
    // "จริงๆเอาอันนี้ก็ได้นะ ส่วนชื่อเต็ม อาจจะเอาไว้ที่เเบนเน้อบนสุด" 5 ต.ค. 2569
    let h = '<div class="cx-sec cx-crcl"><div class="cx-sec-h"><h3 class="cx-sec-t">CrCl<span class="cx-f"> (Cockcroft-Gault)</span></h3><span class="cx-tag use">ใช้ปรับขนาดยา</span></div>';
    if (c.state === 'error') {
      // บอกชื่อช่องที่เกินขอบเขต เรียงตามช่องกรอก ชื่อเดียวกับป้ายช่อง · เกินหลายช่องตก 2 บรรทัดได้
      // (พี่กันเลือกแบบ 9-3 ข้อ 2 "เอาตาม 2 4 5 ให้สองบันทัดได้" 7 ต.ค. 2569 · เดิม ข้อมูลบางช่องไม่ถูกต้อง กรุณาตรวจสอบ)
      h += errBox(r, ['age', 'scr', 'w', 'h']);
    } else if (c.state === 'incomplete') {
      // ขึ้นต้นด้วย กรุณากรอก เหมือนข้อความใน eGFR กับ BMI (พี่กันสั่ง "เปลี่ยนเป็นกรุณาให้หมด" 5 ต.ค. 2569)
      h += `<div class="cx-big"><span class="cx-none">ยังคำนวณไม่ได้</span></div><p class="cx-hint">กรุณากรอก ${joinThai(c.missing)}</p>`;
      if (r.ageWarn) h += warnLine('อายุนอกช่วง 18–92 ปี: CrCl อาจไม่แม่นยำ');
    } else {
      // ค่า CrCl ต่ำกว่า 30 สีอำพันส้มอิฐ ตั้งแต่ 30 ขึ้นไปสีอำพันส้มอ่อน ตัดสินจากเลขที่โชว์ (ทศนิยม 1 ตำแหน่ง) 30.0 พอดีเป็นอำพันส้มอ่อน
      // (พี่กันสั่ง "ค่าที่คำนวนได้ ถ้ามากกว่า 30 จะสีอำพันเข้ม เเต่ถ้าต่ำกส่า 30 จะสีโทนเเดงเลือดหมุ" แล้วเลือก "เเต่เอาออันนี้เป้นน้อยกว่าสามสิบ" 4 ต.ค. 2569)
      // ตั้งแต่ 30 ขึ้นไป พี่กันสั่ง "ลองออันนี้" (ส่งภาพการ์ดอำพันส้มอ่อน #FFA000 · ก่อนหน้านี้ลองเหลืองอำพัน #FFC107)
      const below = [];   // หมายเหตุใต้แถวตัวเลข basisHTML ใส่ให้
      // กล่องบอกน้ำหนักที่ใช้ อยู่ทางขวาของตัวเลข บรรทัดเดียวกัน (พี่กันสั่ง "ย้ายจากที่อยู่บรรทัดล่าง ไปเป็นกรออกสี่เหลี่ยมขวา" 5 ต.ค. 2569 · เดิมอยู่บรรทัดใต้ตัวเลข)
      h += `<div class="cx-top"><div class="cx-big"><b class="${Number(f1(c.value)) < 30 ? 'lt30' : 'ge30'}">${f1(c.value)}</b><span>mL/min</span></div>${basisHTML(c, r, below)}</div>${below.map((t) => typeof t === 'string' ? warnLine(t, t.startsWith('อายุนอกช่วง') ? 'age' : '') : `<div class="cx-warnline ${t.cls}"><span>${t.t}</span></div>`).join('')}`
        + tableHTML(c, r)
        // ชื่อสูตรในวงเล็บเหมือนหัวข้อ CrCl eGFR BMI · เขียน Devine Formula เต็ม (พี่กันสั่ง "มันควรเขียนว่า Devine Formula เพราะถ้าเเค่ Devine ใครมันจะรู้"
        // "วงเล้บไหมนะ เพราะตามจุดอื่น ถ้าสูตร มันจะวงเล็บ" 5 ต.ค. 2569 · เดิม IBW ใช้สูตร Devine และ Adjusted BW ใช้ตัวคูณ 0.4)
        // Adjusted BW เขียนสูตรเต็มหลังทวิภาค พี่กันเลือกจากตัวเลือกกลุ่ม 3-6 ("เอาอันีน้" ส่งภาพ IBW (Devine Formula) กับ Adjusted BW: IBW + 0.4 x (BW - IBW))
        // ชี้หรือกด Tab มาที่ Devine Formula แล้วขึ้นกล่องสูตร (พี่กันสั่ง "พอเอาเมาส์ไปชี้ที่ devine มันจะมี popup สูตรขึ้นด้วย" 5 ต.ค. 2569)
        // สูตรในกล่องตรงกับ calc.js ทุกตัวเลข (ชาย 50 หญิง 45.5 บวก 2.3 ต่อนิ้วที่เกิน 60 นิ้ว · นิ้ว = cm / 2.54)
        + '<p class="cx-note">IBW (<span class="cx-dv" tabindex="0">Devine Formula<span class="cx-dvpop" role="tooltip">'
        + '<span class="cx-dvpop-t">Devine Formula (kg)</span>'
        + '<span>ชาย: IBW = 50 + 2.3 x (Height (in) - 60)</span>'
        + '<span>หญิง: IBW = 45.5 + 2.3 x (Height (in) - 60)</span>'
        + '<span>Height (in) = Height (cm) / 2.54</span>'
        + '</span></span>) · Adjusted BW: IBW + 0.4 x (BW - IBW)</p>';
    }
    return h + '</div>';
  }

  /** หัวข้อ eGFR กับ BMI · ชื่อสูตรอยู่สองที่ box.css เลือกโชว์ตามแผง
   *  แผงแคบโชว์ในวงเล็บต่อท้ายหัวข้อ สีจาง · แผงกว้างโชว์เป็นบรรทัดเล็กใต้หัวข้อ เพราะการ์ดคู่กันกว้างแค่ราว 150 จุด
   *  (พี่กันเลือก "เอาอันนี้" จากตัวเลือกใต้ภาพที่ 18 แล้วสั่ง "ในเเบบเเนวตั้ง สูตรเอาสีจางเหมือนกันด้วย" 5 ต.ค. 2569) */
  const secHead = (t, f) => `<div class="cx-sec-h"><h3 class="cx-sec-t">${t}<span class="cx-f"> (${f})</span></h3><span class="cx-tag info">แสดงผลเท่านั้น</span></div><p class="cx-formula">${f}</p>`;

  /** ส่วน eGFR — แสดงผลเท่านั้น ห้ามเอาไปปรับขนาดยา */
  function egfrHTML(r) {
    let b;
    if (r.egfr.v != null) {
      const s = r.egfr.stage;
      // ตัวเลข eGFR สีเดียวกับระยะ CKD (พี่กันสั่ง "เราขอสีของค่า eGFR BMI เปลี่ยนสีตามระบบหน่อย" 5 ต.ค. 2569 · หน่วยยังเทา)
      b = `<div class="cx-kv"><span class="cx-val ${s.cls}">${f1(r.egfr.v)}<small>mL/min/1.73m²</small></span><span class="cx-cls ${s.cls}">CKD ${s.label}</span></div>`;
    } else if (r.egfr.state === 'error') {
      // กล่องแดงแบบส่วน CrCl บอกเฉพาะช่องที่ใช้คิด eGFR (พี่กันสั่ง "ลองเอา 3 ก่อน เราจะดู" แล้ว "เราโอเครนะ เอาตามนี้" 7 ต.ค. 2569 · เดิม คำนวณไม่ได้ เพราะค่า sCr หรืออายุเกินขอบเขต บรรทัดเทา)
      b = errBox(r, ['age', 'scr']);
    } else {
      b = '<p class="cx-hint">กรุณากรอก Sex Age และ sCr</p>';
    }
    // สูตรกับป้ายแสดงผลเท่านั้นอยู่บรรทัดหัวข้อ (พี่กันสั่ง "ย้ายสูตรมาข้างบน เป็น eGFR (CKD-EPI 2021) แสดงผลเท่านั้น" 5 ต.ค. 2569)
    // แผงแคบ ชื่อสูตรในวงเล็บต่อท้ายหัวข้อ สีจาง · แผงกว้าง หัวข้อเหลือ eGFR ชื่อสูตรเป็นบรรทัดเล็กใต้หัวข้อ (box.css .cx-f .cx-formula)
    return `<div class="cx-sec cx-egfr">${secHead('eGFR', 'CKD-EPI 2021')}${b}</div>`;
  }

  /** ส่วน BMI — แสดงผลเท่านั้น */
  function bmiHTML(r) {
    let b;
    if (r.bmi.v != null) {
      // ตัวเลข BMI สีเดียวกับระดับ BMI (พี่กันสั่งพร้อม eGFR 5 ต.ค. 2569)
      b = `<div class="cx-kv"><span class="cx-val ${r.bmi.cls.cls}">${f1(r.bmi.v)}<small>kg/m²</small></span><span class="cx-cls ${r.bmi.cls.cls}">${r.bmi.cls.label}</span></div>`;
    } else if (r.bmi.state === 'error') {
      // แบบเดียวกับ eGFR (9-4 ข้อ 3 · เดิม คำนวณไม่ได้ เพราะ BW หรือ Height เกินขอบเขต บรรทัดเทา)
      b = errBox(r, ['w', 'h']);
    } else {
      b = '<p class="cx-hint">กรุณากรอก Weight และ Height</p>';
    }
    // เกณฑ์กับป้ายแสดงผลเท่านั้นอยู่บรรทัดหัวข้อ เหมือน eGFR (พี่กันสั่ง "BMI เหมือนกัน" 5 ต.ค. 2569)
    return `<div class="cx-sec cx-bmi">${secHead('BMI', 'WHO Asia-Pacific')}${b}</div>`;
  }

  function resultsHTML(r, layout) {
    const pair = egfrHTML(r) + bmiHTML(r);
    return crclHTML(r) + (layout === 'wide' ? `<div class="cx-pair">${pair}</div>` : pair);
  }

  /** ข้อความใต้ช่อง sCr · su หน่วยของช่อง sCr ตอนนี้
   *  ช่องเป็น μmol/L ค่าอ้างอิงแปลงเป็น μmol/L ด้วย (× 88.4 ตัวคูณเดียวกับปุ่มสลับหน่วย) ปัดเป็นจำนวนเต็ม ชาย 62–106 หญิง 44–88
   *  (พี่กันเลือกแบบ ก กลุ่ม 13-1 "ก ไม่เอาทศนิยม" 7 ต.ค. 2569 · เดิมค่าอ้างอิงเป็น mg/dL ทุกหน่วย)
   *  ระบบยังตัดสิน High Low จาก mg/dL ตาม calc.js · ปัดแล้วไม่ตรงหนึ่งค่า กรอก 44 นับเป็น Low ของหญิง (0.498 mg/dL) พี่กันเห็นข้อนี้ตอนเลือกแล้ว */
  function crRefMsg(r, sex, su) {
    const um = su === 'umol';
    const n = (v) => (um ? String(Math.round(v * 88.4)) : v.toFixed(1));
    const M = [n(0.7), n(1.2)], F = [n(0.5), n(1.0)], unit = um ? 'μmol/L' : 'mg/dL';
    // สูงหรือต่ำกว่าค่าอ้างอิง ใต้ช่องเป็นบรรทัดค่าอ้างอิงแบบปกติ สูงต่ำบอกด้วยบั้งคู่สีแดงหรือส้มต่อท้ายตัวเลขในช่อง (box.js .cx-mirror)
    // โปรแกรมอ่านจอได้ยินคำว่าสูงหรือต่ำจากข้อความซ่อน (พี่กันเลือกแบบ 7-7 ข้อ 7 กับ 8 5 ต.ค. 2569
    // เดิม sCr สูงกว่าค่าอ้างอิง (...) อาจบ่งชี้การทำงานของไตลดลง ควรติดตาม CrCl อย่างใกล้ชิด · sCr ต่ำกว่าค่าอ้างอิง (...) ค่า CrCl อาจสูงกว่าความเป็นจริง เนื่องจากการผลิต creatinine ลดลง)
    // คำว่า High อยู่หลังเลขบน Low อยู่หน้าเลขล่าง ของเพศที่เลือก ฝั่งที่ค่าหลุดออกไป สีเดียวกับบั้งคู่
    // บีบช่องว่างระหว่างคำ 1 จุดให้อยู่บรรทัดเดียว ไม่ลดขนาด ไม่ตัดคำ (box.css .cx-tight)
    // (พี่กันเสนอ "1.6 : ชาย 0.7–1.2 High หญิง 0.5–1.0 mg/dL · 0.6 : ชาย Low 0.7–1.2 หญิง 0.5–1.0 mg/dL" แล้วเลือกแบบ 7-11 "เอาอันนี้ จบ เราเเค่ให้มันอยูบันทัดเดียว" 5 ต.ค. 2569)
    if (r.crRef === 'low' || r.crRef === 'high') {
      const male = sex === 'male', hi = r.crRef === 'high';
      const sr = hi ? 'sCr สูงกว่าค่าอ้างอิง ' : 'sCr ต่ำกว่าค่าอ้างอิง ';
      const w = hi ? '<b class="cx-hl hi">High</b>' : '<b class="cx-hl lo">Low</b>';
      const range = ([lo, up]) => (hi ? `${lo}–${up} ${w}` : `${w} ${lo}–${up}`);
      const m = male ? `ชาย ${range(M)}` : `ชาย ${M.join('–')}`;
      const f = male ? `หญิง ${F.join('–')}` : `หญิง ${range(F)}`;
      return ['mute', `<span class="cx-tight"><span class="sr">${sr}</span><span class="cx-ref${male ? ' on' : ''}">${m}</span> <span class="cx-ref${male ? '' : ' on'}">${f}</span> ${unit}</span>`];
    }
    // เลือกเพศแล้ว sCr อยู่ในเกณฑ์ ข้อความเดียวกับตอนยังไม่เลือกเพศ เพศที่เลือกตัวเข้ม อีกเพศจาง (box.css .cx-ref)
    // พี่กันเลือกจากตัวเลือกใต้ภาพที่ 2 ในหน้าเกลาคำ "เอาอันนี้ละกัน ที่จะจางเข้ม" 4 ต.ค. 2569 · ข้อความตายตัว ไม่มีค่าจากผู้ใช้ปน
    if (r.crRef === 'ok') {
      const male = sex === 'male';
      return ['mute', `<span class="cx-ref${male ? ' on' : ''}">ชาย ${M.join('–')}</span> <span class="cx-ref${male ? '' : ' on'}">หญิง ${F.join('–')}</span> ${unit}`];
    }
    // ยังไม่เลือกเพศ ให้อยู่บรรทัดเดียวในช่อง 212 จุด (พี่กันสั่ง "เกลาให้เหลือ 1 บรรทัด" 4 ต.ค. 2569) · อยู่ใต้ช่อง sCr จึงไม่ต้องมีคำว่าค่าอ้างอิง sCr · หน่วยต้องมี เพราะช่อง sCr สลับเป็น μmol/L ได้
    return ['mute', `ชาย ${M.join('–')} หญิง ${F.join('–')} ${unit}`];
  }

  CrCl.render = { ICON, f1, joinThai, warnLine, basisHTML, tableHTML, crclHTML, egfrHTML, bmiHTML, resultsHTML, crRefMsg };
})(globalThis);
