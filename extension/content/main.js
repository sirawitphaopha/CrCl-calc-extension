/* ตัวเริ่มกล่องลอยบนหน้าเว็บ — background.js ฉีดไฟล์นี้ต่อจาก calc.js render.js box.js
 *
 * - สร้างกล่องใน Shadow DOM แบบปิด สไตล์ของหน้าเว็บกับกล่องไม่ปนกัน และสคริปต์ของหน้าเว็บมองไม่เห็นค่าในกล่อง
 * - สไตล์ใส่ด้วย stylesheet ที่สร้างจากสคริปต์ ไม่มี style ฝังในแท็ก เผื่อหน้าเว็บตั้งกติกาความปลอดภัย (CSP) เข้ม
 * - ค่าที่กรอกส่งให้ background เก็บลง chrome.storage.session ผูกกับแท็บ (สคริปต์ในหน้าเว็บเข้าที่เก็บนี้เองไม่ได้)
 *   เก็บทันทีทุกครั้งที่พิมพ์ ไม่หน่วง เปลี่ยนหน้ากลางคันค่าจะได้ไม่หาย
 * - ฉีดซ้ำในหน้าเดิมไม่สร้างกล่องที่สอง (เช็ก __crclApp)
 * - ส่วนขยายไม่อ่านอะไรจากหน้าเว็บ และไม่ส่งข้อมูลออกนอกเครื่อง
 *
 * __crclIntent ที่ background ตั้งไว้ก่อนฉีด
 *   'open'     ผู้ใช้กดไอคอนส่วนขยาย กางกล่องขึ้นมา
 *   'restore'  เปลี่ยนหน้าในแท็บที่เปิดกล่องค้างไว้ แสดงตามสภาพเดิม พับหรือกาง
 * __crclBridge  ตัวแทน chrome.runtime ตอนทดสอบใน dev/harness.html (ส่วนขยายจริงไม่มีตัวนี้)
 */
(function (g) {
  'use strict';
  if (g.__crclApp) return;
  const bridge = g.__crclBridge || {
    send: (msg) => chrome.runtime.sendMessage(msg),
    listen: (fn) => chrome.runtime.onMessage.addListener((msg, sender, reply) => { fn(msg); reply({ ok: true }); }),
    // รีโหลดหรืออัปเดตส่วนขยายแล้ว กล่องเดิมในหน้าเว็บคุยกับส่วนขยายไม่ได้อีก (chrome.runtime.id หายไป)
    alive: () => { try { return !!(chrome.runtime && chrome.runtime.id); } catch (_) { return false; } },
    shadowMode: 'closed',
  };
  let host = null;
  const app = (g.__crclApp = {
    box: null,
    alive: () => bridge.alive(),
    destroy: () => { if (host) host.remove(); host = null; },
  });
  const intent = g.__crclIntent || 'restore';
  g.__crclIntent = null;

  // ข้อความจาก background ที่มาถึงก่อนกล่องพร้อม เก็บไว้ทำทีหลัง
  const pending = [];
  bridge.listen((msg) => { if (app.box) handle(msg); else pending.push(msg); });

  function handle(msg) {
    const box = app.box;
    if (msg.type === 'icon') box.iconClick();
    // กลับจากแผงข้าง ค่าอาจเปลี่ยนไประหว่างอยู่ในแผง ใช้ค่าล่าสุดที่ส่งมาด้วย
    else if (msg.type === 'open') {
      if ('state' in msg) box.setState(msg.state);
      box.hideBar();
      box.show({ animate: true, focus: true });
    }
    // สลับไปแผงข้างแล้ว กล่องลอยทุกแท็บปิด ค่าที่กรอกยังอยู่
    else if (msg.type === 'hide') { box.hideBar(); box.close(); }
  }

  function makeRoot(css) {
    // กล่องค้างจากส่วนขยายรุ่นก่อนที่ถูกรีโหลดไปแล้ว เอาออกก่อน กันกล่องซ้อนสองใบ
    document.querySelectorAll('crcl-ext-root').forEach((el) => el.remove());
    host = document.createElement('crcl-ext-root');
    const s = host.style;
    for (const [k, v] of [['all', 'initial'], ['display', 'block'], ['position', 'fixed'], ['inset', '0'],
      ['z-index', '2147483647'], ['pointer-events', 'none']]) s.setProperty(k, v, 'important');
    const root = host.attachShadow({ mode: bridge.shadowMode || 'closed' });
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      root.adoptedStyleSheets = [sheet];
    } catch (_) {
      const st = document.createElement('style');
      st.textContent = css;
      root.appendChild(st);
    }
    document.documentElement.appendChild(host);
    // บางหน้าเขียนเอกสารใหม่ทั้งก้อน กล่องหลุดออกจากหน้าเมื่อไหร่ ใส่กลับคืนทันที
    // ยกเว้นกล่องที่ส่วนขยายรีโหลดไปแล้ว ปล่อยให้หลุดไป กล่องใบใหม่จะมาแทน
    new MutationObserver(() => {
      if (host && !host.isConnected && app.alive()) document.documentElement.appendChild(host);
    }).observe(document.documentElement, { childList: true });
    return root;
  }

  const quiet = () => {};
  bridge.send({ type: 'load' }).then((boot) => {
    if (!boot || !boot.css) return;
    const prefs = boot.prefs || {};
    const ui = boot.ui || {};
    const box = new CrCl.Box({
      root: makeRoot(boot.css),
      mode: 'float',
      state: boot.state,
      layout: prefs.layout,
      side: prefs.side,
      top: prefs.top,
      canPanel: boot.canPanel,
      onState: (state) => { bridge.send({ type: 'save', state }).catch(quiet); },
      onUi: (u) => { bridge.send({ type: 'saveUi', ui: u }).catch(quiet); },
      onPrefs: (p) => { bridge.send({ type: 'prefs', prefs: p }).catch(quiet); },
      onMode: () => {
        bridge.send({ type: 'toPanel' }).then((res) => {
          if (res && res.ok) { box.hideBar(); box.close(); return; }
          box.showBar('Chrome ไม่ให้เปิดแผงข้างจากปุ่มในกล่อง กดไอคอนคำนวณ CrCl บนแถบเครื่องมือของ Chrome เพื่อเปิดแผงข้าง', 'ยกเลิก');
        }).catch(quiet);
      },
      // ยกเลิกการย้ายไปแผงข้าง ไอคอนกลับมาเปิดปิดกล่องลอยเหมือนเดิม
      onBar: () => { bridge.send({ type: 'cancelPanel' }).catch(quiet); },
    });
    app.box = box;
    if (intent === 'open') box.show({ animate: true, focus: true });
    else if (ui.open) box.show({ folded: !!ui.folded });
    pending.splice(0).forEach(handle);
  }).catch(quiet);
})(globalThis);
