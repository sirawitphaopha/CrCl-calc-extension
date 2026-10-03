/* ฟอนต์ของกล่อง ฝังมากับส่วนขยาย ไม่โหลดจากเน็ต (สกิล new-web-checklist หมวดหน้าจอ)
 *
 * - ชื่อฟอนต์เป็นชื่อเฉพาะของส่วนขยาย "CrClX Sarabun" กับ "CrClX Roboto Mono" ไม่ชนฟอนต์ของหน้า paperless
 * - @font-face ต้องประกาศที่ระดับหน้าเว็บ เพราะ Chrome ไม่ใช้ @font-face ที่ประกาศใน Shadow DOM
 *     กล่องลอย  background.js ฉีดด้วย insertCSS พร้อมที่อยู่ไฟล์เต็มของส่วนขยาย
 *     แผงข้าง   sidepanel.js ใส่ลงหัวหน้าแผงเอง
 * - ไฟล์ฟอนต์กับช่วงตัวอักษรยกจากมอคอัป docs/mockups/crcl-box-narrow-wide-2026-10-02.html
 * - ใช้ได้ทั้งในหน้าเว็บและในตัวกลาง (service worker) จึงเขียนบน globalThis
 */
(function (g) {
  'use strict';
  const CrCl = g.CrCl || (g.CrCl = {});
  if (CrCl.fontCSS) return;

  const THAI = 'U+02D7,U+0303,U+0331,U+0E01-0E5B,U+200C-200D,U+25CC';
  const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const GREEK = 'U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF';
  const FACES = [
    ['CrClX Sarabun', '400', 'sarabun-400-thai.woff2', THAI],
    ['CrClX Sarabun', '400', 'sarabun-400-latin.woff2', LATIN],
    ['CrClX Sarabun', '500', 'sarabun-500-thai.woff2', THAI],
    ['CrClX Sarabun', '500', 'sarabun-500-latin.woff2', LATIN],
    ['CrClX Sarabun', '600', 'sarabun-600-thai.woff2', THAI],
    ['CrClX Sarabun', '600', 'sarabun-600-latin.woff2', LATIN],
    ['CrClX Sarabun', '700', 'sarabun-700-thai.woff2', THAI],
    ['CrClX Sarabun', '700', 'sarabun-700-latin.woff2', LATIN],
    ['CrClX Roboto Mono', '100 700', 'roboto-mono-latin.woff2', LATIN],
    // μ ของหน่วย μmol/L
    ['CrClX Roboto Mono', '100 700', 'roboto-mono-greek.woff2', GREEK],
  ];

  /** url('fonts/ชื่อไฟล์') ต้องคืนที่อยู่ที่เบราว์เซอร์โหลดไฟล์ได้จริงในที่นั้น */
  CrCl.fontCSS = (url) => FACES.map(([family, weight, file, range]) =>
    `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url("${url('fonts/' + file)}") format("woff2");unicode-range:${range}}`).join('\n');

  /** ซ่อนกล่องตอนพิมพ์หน้าเว็บ ไม่ให้ติดไปกับใบพิมพ์ของ paperless */
  CrCl.printCSS = '@media print{crcl-ext-root{display:none!important}}';
})(globalThis);
