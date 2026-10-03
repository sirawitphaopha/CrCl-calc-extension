/* ตัวกลางของส่วนขยายคำนวณ CrCl (service worker ของ Manifest V3)
 *
 * - กดไอคอนตอนเป็นโหมดกล่องลอย ฉีดกล่องลงหน้าเว็บ หรือสั่งกล่องที่มีอยู่ให้เปิดปิด
 * - เปลี่ยนหน้าในแท็บที่เปิดกล่องค้างไว้ ฉีดให้ใหม่เองเมื่อหน้าใหม่โหลดเสร็จ (พี่กันเลือก "กล่องตามไปเอง" 3 ต.ค. 2569)
 * - ค่าที่กรอกเก็บรายแท็บใน chrome.storage.session อยู่ในหน่วยความจำ ไม่ลงดิสก์ ปิดโครมแล้วหาย ลบเมื่อปิดแท็บ
 *     tab:<เลขแท็บ>  ค่าที่กรอก (แผงข้างอ่านและเขียนคีย์เดียวกันนี้ ค่าจึงตามไปด้วยทั้งสองทาง)
 *     ui:<เลขแท็บ>   กล่องเปิดอยู่ไหม พับอยู่ไหม
 *   แยกสองคีย์ เพราะกล่องส่งสองเรื่องนี้มาติด ๆ กัน รวมคีย์เดียวแล้วอ่านเขียนสลับกันจนค่าทับกันได้
 * - แบบแผง ขอบ ตำแหน่ง (prefs) กับโหมดกล่องลอยหรือแผงข้าง (mode) เก็บถาวรใน chrome.storage.local ไม่ใช่ข้อมูลผู้ป่วย
 * - หน้าที่ฉีดไม่ได้ (หน้าของ Chrome เอง Chrome Web Store) ขึ้นป้ายบนไอคอน
 * - ส่วนขยายไม่อ่านอะไรจากหน้าเว็บ และไม่ส่งข้อมูลออกนอกเครื่อง
 */
importScripts('content/fonts.js');

const FILES = ['content/calc.js', 'content/render.js', 'content/box.js', 'content/main.js'];
const KEY = (tabId) => 'tab:' + tabId;
const UI_KEY = (tabId) => 'ui:' + tabId;
const PREFS_DEFAULT = { layout: 'narrow', side: 'right', top: 96 };
// แผงข้างต้องใช้ Chrome 116 ขึ้นไป รุ่นเก่ากว่าซ่อนปุ่มสลับ ใช้กล่องลอยอย่างเดียว
const CAN_PANEL = !!(chrome.sidePanel && typeof chrome.sidePanel.open === 'function'
  && typeof chrome.sidePanel.setPanelBehavior === 'function');
const TITLE = 'คำนวณ CrCl';
const BLOCKED_TITLE = 'คำนวณ CrCl ใช้กับหน้านี้ไม่ได้ หน้าของ Chrome เองและ Chrome Web Store ไม่อนุญาตให้ส่วนขยายทำงาน';
const quiet = () => {};

let cssText = null;
async function boxCSS() {
  if (!cssText) cssText = await (await fetch(chrome.runtime.getURL('styles/box.css'))).text();
  return cssText;
}

/* ══════════ โหมดกล่องลอยหรือแผงข้าง ══════════ */

async function getMode() {
  const { mode } = await chrome.storage.local.get('mode');
  return CAN_PANEL && mode === 'panel' ? 'panel' : 'float';
}

/** โหมดแผงข้าง = กดไอคอนแล้วโครมเปิดแผงข้างให้เอง · โหมดกล่องลอย = กดไอคอนแล้วมาที่ onClicked ข้างล่าง */
async function setMode(mode) {
  await chrome.storage.local.set({ mode });
  if (CAN_PANEL) await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: mode === 'panel' }).catch(quiet);
}

// ทุกครั้งที่ตัวกลางตื่น ตั้งพฤติกรรมไอคอนให้ตรงกับโหมดที่จำไว้
getMode().then((mode) => {
  if (CAN_PANEL) chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: mode === 'panel' }).catch(quiet);
});

/* ══════════ ฉีดกล่องลงหน้าเว็บ ══════════ */

function injectable(url) {
  if (!url || !/^https?:/i.test(url)) return false;
  return !/^https:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com)/i.test(url);
}

async function markBlocked(tabId) {
  await chrome.action.setBadgeBackgroundColor({ tabId, color: '#c2543c' }).catch(quiet);
  await chrome.action.setBadgeText({ tabId, text: '!' }).catch(quiet);
  await chrome.action.setTitle({ tabId, title: BLOCKED_TITLE }).catch(quiet);
}

async function clearBlocked(tabId) {
  await chrome.action.setBadgeText({ tabId, text: '' }).catch(quiet);
  await chrome.action.setTitle({ tabId, title: TITLE }).catch(quiet);
}

/** มีกล่องที่ยังใช้งานได้อยู่ในหน้านี้ไหม · กล่องจากส่วนขยายรุ่นก่อนที่ถูกรีโหลดไปแล้วนับว่าไม่มี และเก็บทิ้ง */
async function hasApp(tabId) {
  const [res] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const a = globalThis.__crclApp;
      if (!a) return false;
      if (a.alive && a.alive()) return true;
      try { if (a.destroy) a.destroy(); } catch (_) { /* กล่องเก่าพังไปแล้ว ไม่ต้องทำอะไร */ }
      globalThis.__crclApp = null;
      return false;
    },
  });
  return !!(res && res.result);
}

/** intent 'open' = ผู้ใช้กดไอคอน กางกล่องขึ้นมา · 'restore' = เปลี่ยนหน้า แสดงตามสภาพเดิม */
async function inject(tabId, intent) {
  await chrome.scripting.insertCSS({
    target: { tabId },
    origin: 'USER',
    css: CrCl.fontCSS((p) => chrome.runtime.getURL(p)) + '\n' + CrCl.printCSS,
  });
  await chrome.scripting.executeScript({ target: { tabId }, func: (i) => { globalThis.__crclIntent = i; }, args: [intent] });
  await chrome.scripting.executeScript({ target: { tabId }, files: FILES });
}

/** ปิดกล่องลอยทุกแท็บ ใช้ตอนย้ายไปแผงข้าง ค่าที่กรอกยังอยู่ */
async function hideAllBoxes() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((t) => chrome.tabs.sendMessage(t.id, { type: 'hide' }).catch(quiet)));
}

// กดไอคอน (มาที่นี่เฉพาะโหมดกล่องลอย โหมดแผงข้างโครมเปิดแผงให้เอง)
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || tab.id == null) return;
  if (!injectable(tab.url)) { await markBlocked(tab.id); return; }
  try {
    if (await hasApp(tab.id)) await chrome.tabs.sendMessage(tab.id, { type: 'icon' });
    else await inject(tab.id, 'open');
  } catch (_) {
    await markBlocked(tab.id);
  }
});

// เปลี่ยนหน้าในแท็บเดิม ถ้าแท็บนั้นเปิดกล่องค้างไว้ ฉีดให้ใหม่เมื่อหน้าใหม่โหลดเสร็จ
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status === 'loading') { await clearBlocked(tabId); return; }
  if (info.status !== 'complete') return;
  if ((await getMode()) !== 'float' || !injectable(tab.url)) return;
  const got = await chrome.storage.session.get(UI_KEY(tabId));
  const ui = got[UI_KEY(tabId)];
  if (!ui || !ui.open) return;
  try {
    if (!(await hasApp(tabId))) await inject(tabId, 'restore');
  } catch (_) { /* หน้านั้นฉีดไม่ได้ ไม่ต้องขึ้นป้ายจนกว่าผู้ใช้จะกดไอคอนเอง */ }
});

// ปิดแท็บ ค่าของแท็บนั้นหายตามที่พี่กันเลือก
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove([KEY(tabId), UI_KEY(tabId)]).catch(quiet);
});

/* ══════════ ข้อความจากกล่องลอยและแผงข้าง ══════════ */

async function onMessage(msg, sender) {
  const tabId = sender.tab ? sender.tab.id : null;
  switch (msg && msg.type) {
    case 'load': {
      const [got, local, css] = await Promise.all([
        chrome.storage.session.get([KEY(tabId), UI_KEY(tabId)]),
        chrome.storage.local.get('prefs'),
        boxCSS(),
      ]);
      return {
        state: got[KEY(tabId)] || null,
        ui: got[UI_KEY(tabId)] || null,
        prefs: Object.assign({}, PREFS_DEFAULT, local.prefs || {}),
        css,
        canPanel: CAN_PANEL,
      };
    }
    case 'save':
      if (tabId != null) await chrome.storage.session.set({ [KEY(tabId)]: msg.state });
      return { ok: true };
    case 'saveUi':
      if (tabId != null) await chrome.storage.session.set({ [UI_KEY(tabId)]: msg.ui });
      return { ok: true };
    case 'prefs':
      await chrome.storage.local.set({ prefs: msg.prefs });
      return { ok: true };
    case 'toPanel': {
      if (!CAN_PANEL || tabId == null) return { ok: false };
      // ต้องสั่งเปิดแผงข้างทันทีก่อนทำอย่างอื่น โครมยอมให้เปิดเฉพาะจังหวะที่ผู้ใช้เพิ่งกด
      const opening = chrome.sidePanel.open({ tabId });
      let ok = true;
      try { await opening; } catch (_) { ok = false; }
      // เปิดไม่ได้ก็ยังตั้งให้ไอคอนเปิดแผงข้าง กล่องขึ้นแถบบอกให้กดไอคอน หรือกดยกเลิกเพื่อกลับเหมือนเดิม
      await setMode('panel');
      if (ok) await hideAllBoxes();
      return { ok };
    }
    case 'cancelPanel':
      await setMode('float');
      return { ok: true };
    case 'panelOpened':
      await setMode('panel');
      await hideAllBoxes();
      return { ok: true };
    case 'toFloat': {
      const tab = await chrome.tabs.get(msg.tabId).catch(() => null);
      if (!tab || !injectable(tab.url)) return { ok: false };
      await setMode('float');
      try {
        // กล่องที่ซ่อนอยู่ในหน้านั้นยังถือค่าเก่า ระหว่างอยู่ในแผงข้างค่าอาจเปลี่ยนไปแล้ว ส่งค่าล่าสุดไปด้วย
        const got = await chrome.storage.session.get(KEY(tab.id));
        if (await hasApp(tab.id)) await chrome.tabs.sendMessage(tab.id, { type: 'open', state: got[KEY(tab.id)] || null });
        else await inject(tab.id, 'open');
        return { ok: true };
      } catch (_) {
        await markBlocked(tab.id);
        return { ok: false };
      }
    }
    default:
      return { ok: false };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  onMessage(msg, sender).then(reply, () => reply({ ok: false }));
  return true;
});
