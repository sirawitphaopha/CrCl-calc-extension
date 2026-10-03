/* ตัววาดผลของกล่อง CrCl กับไอคอน — ยกจากมอคอัปที่พี่กันเคาะแล้ว
 * docs/mockups/crcl-box-narrow-wide-2026-10-02.html (basisHTML · tableHTML · crclHTML · egfrHTML · bmiHTML · resultsHTML · crRefMsg · ICON)
 *
 * ต่างจากมอคอัป
 * - สีของระยะ CKD กับระดับ BMI ใช้คลาสใน box.css แทน style ที่ฝังในแท็ก (กันหน้าเว็บที่ตั้ง CSP เข้ม · สกิล web-craft 6.21 ⑪)
 * - ไอคอนเพิ่ม 2 ตัวสำหรับปุ่มสลับกล่องลอยกับแผงข้าง
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
    flip: sv(16, '<path d="M4 8h15"/><path d="M15 4l4 4-4 4"/><path d="M20 16H5"/><path d="M9 12l-4 4 4 4"/>'),
    foldR: sv(16, '<path d="M6 6l6 6-6 6"/><path d="M13 6l6 6-6 6"/>'),
    foldL: sv(16, '<path d="M18 6l-6 6 6 6"/><path d="M11 6l-6 6 6 6"/>'),
    close: sv(16, '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'),
    x: sv(13, '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>', 2.6),
    alert: sv(15, '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4"/><path d="M12 17.3v.2"/>'),
    alertSm: sv(13, '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4"/><path d="M12 17.3v.2"/>', 2.4),
    swapSm: sv(12, '<path d="M4 8h14"/><path d="M14 4l4 4-4 4"/><path d="M20 16H6"/><path d="M10 12l-4 4 4 4"/>', 2.4),
    calc: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="2.5" width="16" height="19" rx="3.2" fill="currentColor"/><rect x="7" y="5.5" width="10" height="4.2" rx="1.2" fill="#fff"/><g fill="#fff"><circle cx="8.6" cy="13.3" r="1.25"/><circle cx="12" cy="13.3" r="1.25"/><circle cx="15.4" cy="13.3" r="1.25"/><circle cx="8.6" cy="17.3" r="1.25"/><circle cx="12" cy="17.3" r="1.25"/><circle cx="15.4" cy="17.3" r="1.25"/></g></svg>',
  };

  const f1 = (v) => v.toFixed(1);
  function joinThai(list) {
    if (list.length <= 1) return list.join('');
    return list.slice(0, -1).join(' ') + ' และ ' + list[list.length - 1];
  }
  function warnLine(t) { return `<div class="cx-warnline">${ICON.alertSm}<span>${t}</span></div>`; }

  /** กล่องบอกน้ำหนักที่ใช้และเหตุผล */
  function basisHTML(c, r) {
    const lines = [];
    let cls, main, why;
    if (c.state === 'noheight') {
      cls = 'noht'; main = `ใช้ Actual BW ${f1(c.w)} kg`; why = 'เพราะยังไม่ได้กรอกส่วนสูง';
      lines.push('กรอกส่วนสูงเพื่อความแม่นยำ');
    } else if (c.kind === 'short') {
      cls = 'short'; main = `ใช้ Actual BW ${f1(c.w)} kg`; why = 'เพราะสูงต่ำกว่า 152 cm';
      lines.push('อาจมีภาวะหลังค่อม ค่า CrCl อาจต่ำกว่าความเป็นจริง');
    } else if (c.kind === 'under') {
      cls = 'under'; main = `Underweight ใช้ Actual BW ${f1(c.w)} kg`; why = 'เพราะ BW น้อยกว่า IBW';
      lines.push('มวลกล้ามเนื้อน้อย ค่า CrCl อาจสูงกว่าความเป็นจริง');
    } else if (c.kind === 'obese') {
      cls = 'obese o' + c.obLevel; main = `Obese ใช้ Adjusted BW ${f1(c.adj)} kg`; why = 'เพราะ BW มากกว่า 1.2 เท่าของ IBW';
    } else {
      cls = 'normal'; main = `Normal ใช้ Ideal BW ${f1(c.ibw)} kg`; why = 'เพราะ BW อยู่ระหว่าง IBW ถึง 1.2 เท่าของ IBW';
    }
    if (r.ageWarn) lines.push('อายุนอกช่วง 18–92 ปีที่สูตรรองรับ ค่า CrCl อาจไม่แม่นยำ');
    return `<div class="cx-basis ${cls}"><div class="cx-basis-main">${main}</div><div class="cx-basis-why">${why}</div>${lines.map(warnLine).join('')}</div>`;
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
    let h = '<div class="cx-sec cx-crcl"><div class="cx-sec-h"><h3 class="cx-sec-t">Creatinine Clearance (CrCl)</h3><span class="cx-tag use">ใช้ปรับขนาดยา</span></div>';
    if (c.state === 'error') {
      h += `<div class="cx-alert err">${ICON.alert}<span>ข้อมูลบางช่องไม่ถูกต้อง กรุณาตรวจสอบ</span></div>`;
    } else if (c.state === 'incomplete') {
      h += `<div class="cx-big"><span class="cx-none">ยังคำนวณไม่ได้</span><em>สูตร Cockcroft-Gault</em></div><p class="cx-hint">ยังไม่ได้กรอก ${joinThai(c.missing)}</p>`;
      if (r.ageWarn) h += warnLine('อายุนอกช่วง 18–92 ปีที่สูตรรองรับ ค่า CrCl อาจไม่แม่นยำ');
    } else {
      h += `<div class="cx-big"><b>${f1(c.value)}</b><span>mL/min</span><em>สูตร Cockcroft-Gault</em></div>`
        + basisHTML(c, r) + tableHTML(c)
        + '<p class="cx-note">IBW ใช้สูตร Devine และ Adjusted BW ใช้ตัวคูณ 0.4</p>';
    }
    return h + '</div>';
  }

  /** ส่วน eGFR — แสดงผลเท่านั้น ห้ามเอาไปปรับขนาดยา */
  function egfrHTML(r) {
    let b;
    if (r.egfr.v != null) {
      const s = r.egfr.stage;
      b = `<div class="cx-kv"><span class="cx-val">${f1(r.egfr.v)}<small>mL/min/1.73m²</small></span><span class="cx-cls ${s.cls}">CKD ${s.label}</span></div>`;
    } else if (r.egfr.state === 'error') {
      b = '<p class="cx-hint">คำนวณไม่ได้ เพราะค่า Cr หรืออายุเกินขอบเขต</p>';
    } else {
      b = '<p class="cx-hint">กรุณากรอก เพศกำเนิด อายุ และ Cr</p>';
    }
    return `<div class="cx-sec cx-egfr"><h3 class="cx-sec-t">eGFR</h3>${b}<div class="cx-meta"><span>สูตร CKD-EPI 2021</span><span class="cx-tag info">แสดงผลเท่านั้น</span></div></div>`;
  }

  /** ส่วน BMI — แสดงผลเท่านั้น */
  function bmiHTML(r) {
    let b;
    if (r.bmi.v != null) {
      b = `<div class="cx-kv"><span class="cx-val">${f1(r.bmi.v)}<small>kg/m²</small></span><span class="cx-cls ${r.bmi.cls.cls}">${r.bmi.cls.label}</span></div>`;
    } else if (r.bmi.state === 'error') {
      b = '<p class="cx-hint">คำนวณไม่ได้ เพราะ BW หรือ Height เกินขอบเขต</p>';
    } else {
      b = '<p class="cx-hint">กรุณากรอก BW และ Height</p>';
    }
    return `<div class="cx-sec cx-bmi"><h3 class="cx-sec-t">BMI</h3>${b}<div class="cx-meta"><span>เกณฑ์ WHO Asia-Pacific</span><span class="cx-tag info">แสดงผลเท่านั้น</span></div></div>`;
  }

  function resultsHTML(r, layout) {
    const pair = egfrHTML(r) + bmiHTML(r);
    return crclHTML(r) + (layout === 'wide' ? `<div class="cx-pair">${pair}</div>` : pair);
  }

  /** ข้อความใต้ช่อง Cr */
  function crRefMsg(r, sex) {
    const refTxt = sex === 'male' ? 'ชาย 0.7–1.2 mg/dL' : 'หญิง 0.5–1.0 mg/dL';
    if (r.crRef === 'low') return ['warn', `Cr ต่ำกว่าค่าอ้างอิง (${refTxt}) ค่า CrCl อาจสูงกว่าความเป็นจริง เนื่องจากการผลิต creatinine ลดลง`];
    if (r.crRef === 'high') return ['hi', `Cr สูงกว่าค่าอ้างอิง (${refTxt}) อาจบ่งชี้การทำงานของไตลดลง ควรติดตาม CrCl อย่างใกล้ชิด`];
    if (r.crRef === 'ok') return ['mute', `ค่าอ้างอิง Cr ${refTxt}`];
    return ['mute', 'ค่าอ้างอิง Cr ชาย 0.7–1.2 และหญิง 0.5–1.0 mg/dL'];
  }

  CrCl.render = { ICON, f1, joinThai, warnLine, basisHTML, tableHTML, crclHTML, egfrHTML, bmiHTML, resultsHTML, crRefMsg };
})(globalThis);
