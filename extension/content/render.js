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
    swapSm: sv(12, '<path d="M4 9h16"/><path d="M15 4l5 5"/><path d="M20 15H4"/><path d="M9 20l-5-5"/>', 2.4),
    calc: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="2.5" width="16" height="19" rx="3.2" fill="currentColor"/><rect x="7" y="5.5" width="10" height="4.2" rx="1.2" fill="#fff"/><g fill="#fff"><circle cx="8.6" cy="13.3" r="1.25"/><circle cx="12" cy="13.3" r="1.25"/><circle cx="15.4" cy="13.3" r="1.25"/><circle cx="8.6" cy="17.3" r="1.25"/><circle cx="12" cy="17.3" r="1.25"/><circle cx="15.4" cy="17.3" r="1.25"/></g></svg>',
  };

  const f1 = (v) => v.toFixed(1);
  function joinThai(list) {
    if (list.length <= 1) return list.join('');
    return list.slice(0, -1).join(' ') + ' และ ' + list[list.length - 1];
  }
  function warnLine(t, cls) { return `<div class="cx-warnline${cls ? ' ' + cls : ''}">${ICON.alertSm}<span>${t}</span></div>`; }

  /** กล่องบอกน้ำหนักที่ใช้และเหตุผล */
  /** below คือรายการที่จะไปเป็นหมายเหตุใต้แถวตัวเลข ไม่มีกรอบ (กรณีที่พี่กันเกลาแล้ว) */
  function basisHTML(c, r, below) {
    const lines = [];
    let toBelow = false;
    let cls, main, why;
    if (c.state === 'noheight') {
      cls = 'noht'; main = `ใช้ Actual BW ${f1(c.w)} kg`; why = 'เพราะยังไม่ได้กรอกส่วนสูง';
      lines.push('กรอกส่วนสูงเพื่อความแม่นยำ');
    } else if (c.kind === 'short') {
      cls = 'short'; main = `ใช้ Actual BW ${f1(c.w)} kg`; why = 'เพราะสูงต่ำกว่า 152 cm';
      lines.push('อาจมีภาวะหลังค่อม ค่า CrCl อาจต่ำกว่าความเป็นจริง');
    } else if (c.kind === 'under') {
      // ตัดคำ Underweight ตัดบรรทัดเหตุผล คำเตือนแบบสั้น แล้วย้ายคำเตือนไปเป็นหมายเหตุใต้แถวตัวเลขไม่มีกรอบ
      // (พี่กันเลือกแบบ 3-2 ข้อ 6 "เอาอันนี้ เเต่ย้าย มวลกล้ามเนื้อ ไปไว้เป็นหมายเหตุด้านล่างเลย โดยไม่มีกรอบ" 5 ต.ค. 2569)
      cls = 'under'; main = `ใช้ Actual BW ${f1(c.w)} kg`; why = '';
      // ขึ้นต้นด้วย Underweight ตามด้วยทวิภาค (พี่กันเลือกแบบ 3-3 ข้อ 2 แล้วเลือกตัวคั่นแบบ 3-4 ข้อ 1 5 ต.ค. 2569)
      lines.push('Underweight: มวลกล้ามเนื้อน้อย CrCl อาจสูงเกินจริง');
      toBelow = true;
    } else if (c.kind === 'obese') {
      cls = 'obese o' + c.obLevel; main = `Obese ใช้ Adjusted BW ${f1(c.adj)} kg`; why = 'เพราะ BW มากกว่า 1.2 เท่าของ IBW';
    } else {
      // กรณีปกติไม่มีบรรทัดเหตุผล กรณีอื่นยังบอกว่าทำไมไม่ใช้ IBW (พี่กันเลือก "เอาออกเฉพาะ Normal" แล้วสั่ง "เอาออกเลย" 5 ต.ค. 2569)
      // ไม่มีคำว่า Normal อ่านแล้วสงสัยว่าปกติอะไร และชนกับ BMI ที่อาจขึ้น Overweight (พี่กันสั่ง "เอาแบบตัดคำ Normal ออก" 5 ต.ค. 2569)
      cls = 'normal'; main = `ใช้ Ideal BW ${f1(c.ibw)} kg`; why = '';
    }
    if (r.ageWarn) lines.push('อายุนอกช่วง 18–92 ปีที่สูตรรองรับ ค่า CrCl อาจไม่แม่นยำ');
    if (toBelow && below) { below.push(...lines); lines.length = 0; }
    return `<div class="cx-basis ${cls}"><div class="cx-basis-main">${main}</div>${why ? `<div class="cx-basis-why">${why}</div>` : ''}${lines.map(warnLine).join('')}</div>`;
  }

  /** ตารางน้ำหนักสามแบบ เป็นตารางจริง */
  function tableHTML(c) {
    const row = (key, label, bw, cc, note) => {
      const on = c.pick === key;
      const cells = note ? `<td colspan="2" class="cx-na">${note}</td>` : `<td>${f1(bw)}</td><td>${f1(cc)}</td>`;
      return `<tr class="${on ? 'on' : ''}"><th scope="row">${label}${on ? '<span class="sr"> ใช้ค่านี้</span>' : ''}</th>${cells}</tr>`;
    };
    const note = c.state === 'noheight' ? 'กรอกส่วนสูง' : c.short ? 'N/A' : '';
    const rows = row('A', 'Actual BW', c.w, c.cA)
      + (note ? row('I', 'Ideal BW', 0, 0, note) + row('J', 'Adjusted BW', 0, 0, note)
              : row('I', 'Ideal BW', c.ibw, c.cI) + row('J', 'Adjusted BW', c.adj, c.cJ));
    return `<table class="cx-bw"><thead><tr><th scope="col"><span class="sr">ชนิดน้ำหนัก</span></th><th scope="col">BW (kg)</th><th scope="col">CrCl (mL/min)</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  /** ส่วน CrCl — ตัวนี้ใช้ปรับขนาดยา */
  function crclHTML(r) {
    const c = r.crcl;
    // หัวข้อ CrCl ชื่อสูตรในวงเล็บสีจางต่อท้าย แบบเดียวกับ eGFR กับ BMI · เดิม "Creatinine Clearance (CrCl)" กับชื่อสูตรเป็นบรรทัดใต้หัวข้อ
    // พี่กันเลือกเอง แม้สกิลจะให้หัวข้อเป็นชื่อเต็ม ชื่อเต็มจะไปอยู่บนหัวกล่องแทน (กำลังเลือกในหน้าเกลาคำ)
    // "จริงๆเอาอันนี้ก็ได้นะ ส่วนชื่อเต็ม อาจจะเอาไว้ที่เเบนเน้อบนสุด" 5 ต.ค. 2569
    let h = '<div class="cx-sec cx-crcl"><div class="cx-sec-h"><h3 class="cx-sec-t">CrCl<span class="cx-f"> (Cockcroft-Gault)</span></h3><span class="cx-tag use">ใช้ปรับขนาดยา</span></div>';
    if (c.state === 'error') {
      h += `<div class="cx-alert err">${ICON.alert}<span>ข้อมูลบางช่องไม่ถูกต้อง กรุณาตรวจสอบ</span></div>`;
    } else if (c.state === 'incomplete') {
      // ขึ้นต้นด้วย กรุณากรอก เหมือนข้อความใน eGFR กับ BMI (พี่กันสั่ง "เปลี่ยนเป็นกรุณาให้หมด" 5 ต.ค. 2569)
      h += `<div class="cx-big"><span class="cx-none">ยังคำนวณไม่ได้</span></div><p class="cx-hint">กรุณากรอก ${joinThai(c.missing)}</p>`;
      if (r.ageWarn) h += warnLine('อายุนอกช่วง 18–92 ปีที่สูตรรองรับ ค่า CrCl อาจไม่แม่นยำ');
    } else {
      // ค่า CrCl ต่ำกว่า 30 สีอำพันส้มอิฐ ตั้งแต่ 30 ขึ้นไปสีอำพันส้มอ่อน ตัดสินจากเลขที่โชว์ (ทศนิยม 1 ตำแหน่ง) 30.0 พอดีเป็นอำพันส้มอ่อน
      // (พี่กันสั่ง "ค่าที่คำนวนได้ ถ้ามากกว่า 30 จะสีอำพันเข้ม เเต่ถ้าต่ำกส่า 30 จะสีโทนเเดงเลือดหมุ" แล้วเลือก "เเต่เอาออันนี้เป้นน้อยกว่าสามสิบ" 4 ต.ค. 2569)
      // ตั้งแต่ 30 ขึ้นไป พี่กันสั่ง "ลองออันนี้" (ส่งภาพการ์ดอำพันส้มอ่อน #FFA000 · ก่อนหน้านี้ลองเหลืองอำพัน #FFC107)
      const below = [];   // หมายเหตุใต้แถวตัวเลข basisHTML ใส่ให้
      // กล่องบอกน้ำหนักที่ใช้ อยู่ทางขวาของตัวเลข บรรทัดเดียวกัน (พี่กันสั่ง "ย้ายจากที่อยู่บรรทัดล่าง ไปเป็นกรออกสี่เหลี่ยมขวา" 5 ต.ค. 2569 · เดิมอยู่บรรทัดใต้ตัวเลข)
      h += `<div class="cx-top"><div class="cx-big"><b class="${Number(f1(c.value)) < 30 ? 'lt30' : 'ge30'}">${f1(c.value)}</b><span>mL/min</span></div>${basisHTML(c, r, below)}</div>${below.map((t) => warnLine(t, t.startsWith('อายุนอกช่วง') ? 'age' : '')).join('')}`
        + tableHTML(c)
        + '<p class="cx-note">IBW ใช้สูตร Devine และ Adjusted BW ใช้ตัวคูณ 0.4</p>';
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
      b = `<div class="cx-kv"><span class="cx-val">${f1(r.egfr.v)}<small>mL/min/1.73m²</small></span><span class="cx-cls ${s.cls}">CKD ${s.label}</span></div>`;
    } else if (r.egfr.state === 'error') {
      b = '<p class="cx-hint">คำนวณไม่ได้ เพราะค่า sCr หรืออายุเกินขอบเขต</p>';
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
      b = `<div class="cx-kv"><span class="cx-val">${f1(r.bmi.v)}<small>kg/m²</small></span><span class="cx-cls ${r.bmi.cls.cls}">${r.bmi.cls.label}</span></div>`;
    } else if (r.bmi.state === 'error') {
      b = '<p class="cx-hint">คำนวณไม่ได้ เพราะ BW หรือ Height เกินขอบเขต</p>';
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

  /** ข้อความใต้ช่อง sCr */
  function crRefMsg(r, sex) {
    const refTxt = sex === 'male' ? 'ชาย 0.7–1.2 mg/dL' : 'หญิง 0.5–1.0 mg/dL';
    if (r.crRef === 'low') return ['warn', `sCr ต่ำกว่าค่าอ้างอิง (${refTxt}) ค่า CrCl อาจสูงกว่าความเป็นจริง เนื่องจากการผลิต creatinine ลดลง`];
    if (r.crRef === 'high') return ['hi', `sCr สูงกว่าค่าอ้างอิง (${refTxt}) อาจบ่งชี้การทำงานของไตลดลง ควรติดตาม CrCl อย่างใกล้ชิด`];
    // เลือกเพศแล้ว sCr อยู่ในเกณฑ์ ข้อความเดียวกับตอนยังไม่เลือกเพศ เพศที่เลือกตัวเข้ม อีกเพศจาง (box.css .cx-ref)
    // พี่กันเลือกจากตัวเลือกใต้ภาพที่ 2 ในหน้าเกลาคำ "เอาอันนี้ละกัน ที่จะจางเข้ม" 4 ต.ค. 2569 · ข้อความตายตัว ไม่มีค่าจากผู้ใช้ปน
    if (r.crRef === 'ok') {
      const male = sex === 'male';
      return ['mute', `<span class="cx-ref${male ? ' on' : ''}">ชาย 0.7–1.2</span> <span class="cx-ref${male ? '' : ' on'}">หญิง 0.5–1.0</span> mg/dL`];
    }
    // ยังไม่เลือกเพศ ให้อยู่บรรทัดเดียวในช่อง 212 จุด (พี่กันสั่ง "เกลาให้เหลือ 1 บรรทัด" 4 ต.ค. 2569) · อยู่ใต้ช่อง sCr จึงไม่ต้องมีคำว่าค่าอ้างอิง sCr · หน่วยต้องมี เพราะช่อง sCr สลับเป็น μmol/L ได้
    return ['mute', 'ชาย 0.7–1.2 หญิง 0.5–1.0 mg/dL'];
  }

  CrCl.render = { ICON, f1, joinThai, warnLine, basisHTML, tableHTML, crclHTML, egfrHTML, bmiHTML, resultsHTML, crRefMsg };
})(globalThis);
