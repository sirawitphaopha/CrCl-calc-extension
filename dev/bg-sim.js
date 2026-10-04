// รัน extension/background.js ของจริงกับ chrome จำลอง (4 ต.ค. 2569)
// ดูว่าจังหวะ "No SW" (ตัวกลางกำลังปิดตอนรีโหลดส่วนขยาย อ่านค่าไม่สำเร็จ) ยังหลุดเป็นข้อผิดพลาดไหม และทางปกติยังทำงานเหมือนเดิมไหม
// รัน: node dev/bg-sim.js · ทุกบรรทัดต้องขึ้น ok · ลองกับไฟล์อื่นได้ด้วย node dev/bg-sim.js <ที่อยู่ไฟล์ background.js>
// (ไฟล์ก่อนแก้ 0.1.1.0 ขึ้น FAIL 3 บรรทัด ตัวจำลองจึงจับปัญหานี้ได้จริง)
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'extension');
const src = fs.readFileSync(process.argv[2] || path.join(ROOT, 'background.js'), 'utf8');
const fontsSrc = fs.readFileSync(path.join(ROOT, 'content/fonts.js'), 'utf8');

function run(name, opt) {
  return new Promise((done) => {
    const unhandled = [];
    const onRej = (r) => unhandled.push(String(r && r.message || r));
    process.on('unhandledRejection', onRej);
    const calls = [];
    const noSW = () => Promise.reject(new Error('No SW'));
    const listeners = {};
    const ev = (k) => ({ addListener: (f) => { listeners[k] = f; } });
    const chrome = {
      runtime: { getURL: (p) => 'chrome-extension://x/' + p, onMessage: ev('msg') },
      storage: {
        local: { get: (k) => opt.localFail ? noSW() : Promise.resolve({ mode: 'float' }), set: () => Promise.resolve() },
        session: { get: (k) => opt.sessionFail ? noSW() : Promise.resolve(opt.ui ? { [k]: opt.ui } : {}), set: () => Promise.resolve(), remove: () => Promise.resolve() },
      },
      sidePanel: { open: () => Promise.resolve(), setPanelBehavior: (o) => { calls.push('setPanelBehavior ' + o.openPanelOnActionClick); return Promise.resolve(); } },
      action: {
        onClicked: ev('click'),
        setBadgeText: (o) => { calls.push('badge "' + o.text + '"'); return Promise.resolve(); },
        setBadgeBackgroundColor: () => Promise.resolve(), setTitle: () => Promise.resolve(),
      },
      tabs: { onUpdated: ev('updated'), onRemoved: ev('removed'), query: () => Promise.resolve([]), sendMessage: () => Promise.resolve(), get: () => Promise.resolve(null) },
      scripting: {
        executeScript: (o) => { if (o.files) calls.push('inject files'); else if (o.args) calls.push('intent ' + o.args[0]); return Promise.resolve([{ result: false }]); },
        insertCSS: () => Promise.resolve(),
      },
    };
    const g = { chrome, fetch: () => Promise.resolve({ text: () => '' }), console };
    g.globalThis = g;
    g.importScripts = () => vm.runInContext(fontsSrc, ctx);
    const ctx = vm.createContext(g);
    vm.runInContext(src, ctx);
    if (opt.event) listeners.updated(7, opt.event, { url: 'https://example.org/' });
    setTimeout(() => {
      process.off('unhandledRejection', onRej);
      console.log((unhandled.length ? 'FAIL ' : 'ok   ') + name.padEnd(46) + ' | ข้อผิดพลาดหลุด ' + unhandled.length + ' | ' + calls.join(' · '));
      done();
    }, 80);
  });
}

(async () => {
  await run('ตื่นมาปกติ', {});
  await run('ตื่นมาตอนตัวกลางเก่ากำลังปิด (No SW)', { localFail: true });
  await run('หน้าเริ่มโหลด ล้างป้าย !', { event: { status: 'loading' } });
  await run('หน้าโหลดเสร็จ กล่องเปิดค้าง', { event: { status: 'complete' }, ui: { open: true } });
  await run('หน้าโหลดเสร็จ กล่องไม่ได้เปิด', { event: { status: 'complete' }, ui: { open: false } });
  await run('หน้าโหลดเสร็จ จังหวะ No SW (อ่านโหมด)', { event: { status: 'complete' }, localFail: true });
  await run('หน้าโหลดเสร็จ จังหวะ No SW (อ่านค่ารายแท็บ)', { event: { status: 'complete' }, sessionFail: true });
})();
