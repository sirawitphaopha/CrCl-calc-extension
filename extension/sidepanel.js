/* แผงข้างของ Chrome — ใช้ตัวกล่อง สูตร และสไตล์ชุดเดียวกับกล่องลอย
 *
 * - แสดงค่าของแท็บที่เปิดดูอยู่ในหน้าต่างนี้ สลับแท็บแล้วค่าก็ตามแท็บนั้น แท็บใหม่เริ่มว่าง
 * - อ่านและเขียนค่ารายแท็บคีย์เดียวกับกล่องลอย (chrome.storage.session tab:<เลขแท็บ>) ค่าที่กรอกตามไปด้วยทั้งสองทาง
 * - แบบแคบหรือกว้างสลับเองตามความกว้างแผง (box.js) เพราะ Chrome ให้ผู้ใช้ลากขอบแผงเอง
 * - ปุ่มที่หัวกล่องกดกลับเป็นกล่องลอยบนหน้าเว็บ
 * - ไม่อ่านอะไรจากหน้าเว็บ และไม่ส่งข้อมูลออกนอกเครื่อง
 */
(async function () {
  'use strict';
  const KEY = (id) => 'tab:' + id;
  const quiet = () => {};
  // เทียบค่าแบบไม่สนลำดับช่อง
  const canon = (o) => JSON.stringify(o ? Object.keys(o).sort().reduce((a, k) => { a[k] = o[k]; return a; }, {}) : null);

  const fonts = document.createElement('style');
  fonts.textContent = CrCl.fontCSS((p) => p);
  document.head.appendChild(fonts);

  const host = document.createElement('crcl-ext-root');
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(await (await fetch('styles/box.css')).text());
  root.adoptedStyleSheets = [sheet];

  const win = await chrome.windows.getCurrent();
  let tabId = null;
  // ค่าที่แผงนี้เพิ่งเขียนเอง เมื่อสัญญาณเปลี่ยนค่าวนกลับมา ไม่ต้องใส่ทับช่อง
  // ไม่งั้นพิมพ์เร็ว ๆ แล้วสัญญาณของตัวอักษรก่อนหน้ามาทับตัวที่เพิ่งพิมพ์
  let echoes = [];

  const box = new CrCl.Box({
    root,
    mode: 'panel',
    canPanel: true,
    onState: (state) => {
      if (tabId == null) return;
      echoes.push({ v: canon(state), t: Date.now() });
      chrome.storage.session.set({ [KEY(tabId)]: state }).catch(quiet);
    },
    onMode: async () => {
      const res = await chrome.runtime.sendMessage({ type: 'toFloat', tabId }).catch(() => null);
      if (res && res.ok) { window.close(); return; }
      box.showBar('หน้านี้เป็นหน้าของ Chrome เองหรือ Chrome Web Store กล่องลอยใช้ไม่ได้ เปิดหน้าเว็บที่จะใช้ก่อน แล้วกดปุ่มนี้อีกครั้ง', 'ปิดข้อความ');
    },
  });

  async function follow(id) {
    tabId = id;
    echoes = [];
    const got = await chrome.storage.session.get(KEY(id));
    if (tabId !== id) return;
    box.hideBar();
    box.setState(got[KEY(id)] || null);
  }

  const [active] = await chrome.tabs.query({ active: true, windowId: win.id });
  if (active) await follow(active.id);

  chrome.tabs.onActivated.addListener((info) => { if (info.windowId === win.id) follow(info.tabId); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'session' || tabId == null) return;
    const c = changes[KEY(tabId)];
    if (!c) return;
    const v = canon(c.newValue || null);
    const now = Date.now();
    echoes = echoes.filter((e) => now - e.t < 3000);
    const i = echoes.findIndex((e) => e.v === v);
    if (i !== -1) { echoes.splice(i, 1); return; }
    box.setState(c.newValue || null);
  });
  chrome.runtime.sendMessage({ type: 'panelOpened' }).catch(quiet);
})();
