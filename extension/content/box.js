/* ตัวกล่องคำนวณ CrCl — กล่อง ลำต้น และพฤติกรรมทั้งหมด
 *
 * ยกคลาส CrClBox จากมอคอัปที่พี่กันเคาะ docs/mockups/crcl-box-narrow-wide-2026-10-02.html
 * กับกลไกลำต้นจาก docs/mockups/crcl-box-tree-2026-10-02.html แล้วใช้กฎรอยต่อแบบต้นไม้ รวมแถว 3+4 (CLAUDE.md)
 *   1. ลำต้นอยู่ตรงที่วางแถบไว้ บน กลาง หรือล่างของขอบ
 *   2. ตอนกาง กล่องห้อยลงจากลำต้นก่อน
 *   3. ใต้แถบที่ไม่พอ กล่องเลื่อนขึ้นเท่าที่จำเป็น ลำต้นไปต่อข้างกล่อง
 *   4. กล่องสูงกว่าจอ กล่องเต็มจอจากบนถึงล่าง เลื่อนดูในกล่อง
 *   5. โค้งเว้าขึ้นเองตามด้านที่กล่องยื่นเกินลำต้น
 *   6. ตัดสินจากที่ว่างในหน้าเว็บของ Chrome ตอนนั้น ไม่ใช่ตัวเลขความละเอียดจอ
 *
 * ติดได้ 4 ขอบ ขอบบนล่างใช้กฎเดียวกันแต่หมุนแกน · ลากแบบหยิบไปวาง · ปุ่มเลือกขอบ
 * (docs/mockups/crcl-box-drag-2026-10-03.html กับ crcl-box-edge-button-2026-10-03.html แบบ ข เคาะ 3 ต.ค. 2569)
 *
 * ใช้สองแบบ
 * - float  กล่องลอยติดขอบจอบนหน้าเว็บ มีลำต้น พับกาง ลาก ย้ายขอบ
 * - panel  อยู่ในแผงข้างของ Chrome เต็มแผง ไม่มีลำต้น ไม่มีการลาก แผงกว้างตั้งแต่ 620 จุดสลับเป็นแบบกว้างเอง
 *
 * ข้อความที่แทรกลงจอมีแต่ข้อความตายตัวกับตัวเลขที่คิดเอง ค่าที่ผู้ใช้พิมพ์ใส่กลับเข้าช่องกรอกด้วย .value เท่านั้น
 * ตำแหน่งและสีที่เปลี่ยนตามสถานะ ส่งเป็นตัวแปร CSS หรือ data- ให้ box.css ตัดสิน ไม่ฝังสีในแท็ก
 */
(function (g) {
  'use strict';
  const CrCl = g.CrCl || (g.CrCl = {});
  if (CrCl.Box) return;
  const C = CrCl.calc;
  const R = CrCl.render;
  const ICON = R.ICON;

  // ขนาดที่เคาะแล้วในมอคอัป
  const TAB_W = 52;      // แถบตอนพับที่ขอบซ้ายขวา
  const TAB_HZ = 44;     // แถบตอนพับที่ขอบบนล่าง (มอคอัปลากย้าย 3 ต.ค. 2569)
  const TRUNK_W = 24;    // ลำต้นตอนกาง
  const TRUNK_H = 58;    // ความหนาของลำต้นตอนกาง (ใช้ขนาดเดียวทุกกรณี)
  const RAD = 12;        // รัศมีมุมกล่องกับโค้งเว้า
  const EDGE = 8;        // ระยะกล่องจากขอบจอ
  const ANIM_MS = 230;   // จังหวะพับกาง เร็วตอนต้นแล้วค่อย ๆ ช้าลง (easeOutCubic)
  // ลากย้าย (docs/mockups/crcl-box-drag-2026-10-03.html พี่กันเคาะ "สุดยอด ตามในหัวเราเป๊ะเลย เอาเลย")
  const SNAP = 6;        // ลากจนเมาส์ห่างขอบบนหรือขอบล่างของหน้าต่างไม่เกินเท่านี้ ถึงจะไปติดขอบนั้น
  const GLIDE_MS = 300;  // ปล่อยเมาส์แล้วกล่องไหลเข้าขอบ
  const LIFT_SCALE = 1.025, TILT_MAX = 2.5;   // ระหว่างลาก กล่องขยายนิดหนึ่ง เอียงได้ไม่เกิน 2.5 องศาตามความเร็ว
  // แผงเลือกขอบ ชี้โดนปุ่มแผงขึ้นทันที เลื่อนเมาส์ออกนอกปุ่มกับแผงแล้วรอเท่านี้ก่อนหาย (พี่กันสั่ง "เราขอทันทีตอนเมาส์โดน เเต่พอเอาเมาส์ออกเอา 0.3")
  const POP_LEAVE_MS = 300;
  const EDGES = ['right', 'left', 'top', 'bottom'];
  const EDGE_TH = { left: 'ขอบซ้าย', right: 'ขอบขวา', top: 'ขอบบน', bottom: 'ขอบล่าง' };
  const isSide = (e) => e === 'left' || e === 'right';
  const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const WIDTH = { narrow: 320, wide: 620 };
  const WIDE_MIN = 620;  // แผงข้างกว้างเท่านี้ขึ้นไป สลับเป็นแผงกว้างเอง
  const TYPING_MS = 600; // หน่วงข้อความผิดระหว่างพิมพ์
  // แถบเลื่อนลอย (สกิล web-craft ข้อ 6.23)
  const THUMB_MIN = 24, THUMB_NEAR = 16, THUMB_WAIT = 400, THUMB_FADE = 1300;

  // อายุมีกล่องหน่วย "ปี" ทางขวาเหมือนช่องอื่น ป้ายจึงไม่ต้องมี (ปี) (พี่กันเลือกจากตัวเลือกใต้ภาพที่ 1 ในหน้าเกลาคำ "ชอบอันนี้เเฮะ" 4 ต.ค. 2569)
  // ป้ายภาษาอังกฤษทั้งคอลัมน์ sCr Weight แทน Cr BW (พี่กันสั่ง "แก้ ให้หมด" 4 ต.ค. 2569) · sCr ตัว s เล็กทั้งระบบ (พี่กันสั่ง "เป็น sCr ตัวเอาตัวเล็ก แก้ให้หมดทั้งระบบ")
  const LABEL = { age: 'Age', w: 'Weight', h: 'Height', scr: 'sCr' };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const px = (v) => Math.round(v * 100) / 100 + 'px';
  let uid = 0;

  class Box {
    constructor(o) {
      this.o = o;
      this.mode = o.mode === 'panel' ? 'panel' : 'float';
      this.id = 'cx' + (++uid);
      this.st = Object.assign(C.emptyState(), o.state || {});
      this.layout = o.layout === 'wide' ? 'wide' : 'narrow';
      this.side = EDGES.includes(o.side) ? o.side : 'right';
      this.top = Number.isFinite(o.top) ? o.top : 96;
      this.canPanel = !!o.canPanel;
      this.p = 1;
      this.goal = 1;   // ปลายทางของจังหวะพับกาง (0 = พับ 1 = กาง) ระหว่างขยับ p ยังไม่ถึงปลายทาง
      this.visible = false;
      this.typing = new Set();
      this.timers = {};
      this.geo = null;
      this.build();
      this.bind();
      this.update();
    }

    /* ══════════ วาดโครง ══════════ */

    field(k) {
      const id = `${this.id}-${k}`;
      const unitKey = C.UNIT_OF[k];
      const ph = unitKey ? C.PH[k][this.st[unitKey]] : C.PH[k];
      // ช่องอายุไม่มีหน่วยให้สลับ ใช้กล่องหน่วย "ปี" ที่กดไม่ได้ ทุกช่องจึงกว้างเท่ากัน คำว่า "เช่น" ตรงแนวกัน
      const unit = unitKey ? `<button type="button" class="cx-unit" data-unit="${unitKey}"></button>`
        : `<span class="cx-unit fixed" id="${id}-unit">ปี</span>`;
      const ref = k === 'scr' ? '<div class="cx-msg" data-msg="scrref" hidden></div>' : '';
      return `<div class="cx-row" data-row="${k}"><label class="cx-lab" for="${id}">${LABEL[k]}</label><div class="cx-ctl"><div class="cx-field" data-f="${k}"><input id="${id}" class="cx-in" data-k="${k}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="${ph}"${unitKey ? '' : ` aria-describedby="${id}-unit"`}>${k === 'scr' ? '<span class="cx-mirror" aria-hidden="true"><span class="cx-mirror-t"></span><span class="cx-flag"></span></span>' : ''}${unit}</div><div class="cx-msg" data-msg="${k}" hidden></div>${ref}</div></div>`;
    }

    panelHTML() {
      const sexId = `${this.id}-sex`;
      const float = this.mode === 'float';
      return `
        <!-- หัวกล่องมีแค่ปุ่มกับไอคอน ชื่อเต็มอยู่แถวถัดลงมาบนพื้นขาว · ปุ่มเลือกขอบอยู่ซ้ายสุดของกลุ่มปุ่ม ติดกับปุ่มแผงข้าง
             (พี่กันเลือก "เอาอันนี้" แบบแถวชื่อบนพื้นขาว แล้วสั่ง "ย้ายปุ่ม ตามรูป ไปอยู่ฝั่งซ้ายสุด"
              แล้วบอกเพิ่ม "คำว่าสุดซ้ายของเรา คือต่อจาก รูปนี้" ส่งภาพปุ่มแผงข้าง 5 ต.ค. 2569) -->
        <div class="cx-head">
          ${float ? `<span class="cx-grip" aria-hidden="true">${ICON.grip}</span>` : ''}
          <span class="cx-ic" aria-hidden="true">${ICON.calc}</span>
          <span class="cx-head-gap"></span>
          ${float ? `<button type="button" class="cx-ib" data-act="edge" aria-haspopup="true" aria-expanded="false"></button>` : ''}
          <button type="button" class="cx-ib" data-act="mode"${this.canPanel ? '' : ' hidden'}></button>
          ${float ? `<button type="button" class="cx-ib" data-act="layout"></button>
          <button type="button" class="cx-ib" data-act="fold"></button>
          <button type="button" class="cx-ib" data-act="close" aria-label="ปิดกล่อง ค่าที่กรอกยังอยู่" title="ปิดกล่อง ค่าที่กรอกยังอยู่">${ICON.close}</button>` : ''}
        </div>
        <div class="cx-trow"><h2 class="cx-title">Creatinine Clearance (CrCl)</h2></div>
        ${float ? `<div class="cx-pop" data-pop hidden role="group" aria-label="เลือกขอบที่จะย้ายกล่องไปติด">
          <p class="cx-pop-t">เลือกขอบจอ</p>
          <div class="cx-scr">${EDGES.map((e) => `<button type="button" class="cx-edge" data-edge="${e}"></button>`).join('')}<svg class="cx-scr-gap" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0L37.5 37.5M100 0L62.5 37.5M100 100L62.5 62.5M0 100L37.5 62.5"/></svg><span class="cx-edge-now" aria-hidden="true">ตอนนี้</span>${EDGES.map((e) => `<span class="cx-edge-lab" data-for="${e}" aria-hidden="true">${EDGE_TH[e]}</span>`).join('')}</div>
        </div>` : ''}
        <div class="cx-bar" data-bar hidden>${ICON.alertSm}<span></span><button type="button" class="cx-barbtn" data-act="bar"></button></div>
        <div class="cx-body">
          <div class="cx-inputs">
            <div class="cx-row" data-row="sex">
              <span class="cx-lab" id="${sexId}">Sex</span>
              <div class="cx-ctl">
                <div class="cx-seg" role="group" aria-labelledby="${sexId}">
                  <button type="button" data-sex="male" aria-pressed="false">ชาย</button><button type="button" data-sex="female" aria-pressed="false">หญิง</button>
                </div>
                <div class="cx-msg" data-msg="sex" hidden></div>
              </div>
            </div>
            ${this.field('age')}${this.field('scr')}${this.field('w')}${this.field('h')}
          </div>
          <div class="cx-results" aria-live="polite"></div>
        </div>
        <div class="cx-thumb" aria-hidden="true"></div>
        <div class="cx-foot"><span class="cx-foot-note">เปลี่ยนผู้ป่วย กดล้างค่าก่อนทุกครั้ง</span><button type="button" class="cx-clear" data-act="clear">${ICON.x}ล้างค่า</button></div>`;
    }

    build() {
      const panel = document.createElement('section');
      panel.className = `cx ${this.layout}`;
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'กล่องคำนวณ CrCl');
      panel.innerHTML = this.panelHTML();
      this.panel = panel;
      if (this.mode === 'float') {
        const dock = document.createElement('div');
        dock.className = 'dock';
        dock.hidden = true;
        dock.innerHTML = '<button type="button" class="base"></button>'
          + '<div class="fillet up" aria-hidden="true"></div><div class="fillet down" aria-hidden="true"></div>';
        dock.appendChild(panel);
        this.dock = dock;
        this.base = dock.querySelector('.base');
        this.o.root.appendChild(dock);
        // กรอบเส้นประระหว่างลาก บอกว่าปล่อยตอนนี้กล่องจะไปติดตรงไหน
        const ghost = document.createElement('div');
        ghost.className = 'gh';
        ghost.setAttribute('aria-hidden', 'true');
        ghost.innerHTML = '<div class="gh-trunk"></div><div class="gh-panel"></div>';
        this.ghost = ghost;
        this.o.root.appendChild(ghost);
      } else {
        const pane = document.createElement('div');
        pane.className = 'pane';
        pane.appendChild(panel);
        this.pane = pane;
        this.o.root.appendChild(pane);
      }
      this.head = panel.querySelector('.cx-head');
      this.body = panel.querySelector('.cx-body');
      this.inputs = panel.querySelector('.cx-inputs');
      this.results = panel.querySelector('.cx-results');
      this.thumb = panel.querySelector('.cx-thumb');
      this.bar = panel.querySelector('[data-bar]');
      this.pop = panel.querySelector('[data-pop]');
      this.paintHead();
    }

    paintHead() {
      const el = this.panel;
      el.classList.toggle('narrow', this.layout === 'narrow');
      el.classList.toggle('wide', this.layout === 'wide');
      const say = (b, icon, text) => { if (!b) return; b.innerHTML = icon; b.setAttribute('aria-label', text); b.title = text; };
      say(el.querySelector('[data-act="mode"]'),
        this.mode === 'float' ? ICON.modeFloat : ICON.modePanel,
        this.mode === 'float' ? 'ตอนนี้เป็นกล่องลอยบนหน้าเว็บ กดเพื่อย้ายไปแผงข้างของ Chrome'
          : 'ตอนนี้อยู่ในแผงข้างของ Chrome กดเพื่อกลับเป็นกล่องลอยบนหน้าเว็บ');
      if (this.mode !== 'float') return;
      // ไอคอนสลับแบบวาด "แบบที่เป็นอยู่ตอนนี้" ตามกฎไอคอนสลับสถานะ คำบอกตอนชี้บอกว่ากดแล้วเป็นอะไร
      say(el.querySelector('[data-act="layout"]'),
        this.layout === 'narrow' ? ICON.narrow : ICON.wide,
        this.layout === 'narrow' ? 'ตอนนี้เป็นแผงแคบ กดเพื่อสลับเป็นแผงกว้าง' : 'ตอนนี้เป็นแผงกว้าง กดเพื่อสลับเป็นแผงแคบ');
      // ปุ่มเลือกขอบ ไอคอนบอกขอบที่ติดอยู่ตอนนี้ · ในแผงเลือกขอบ ขอบที่ติดอยู่เป็นสีทึบ
      // ชี้แล้วแผงขึ้นทันที ไม่ใส่ title ให้ป้ายของ Chrome เด้งมาทับแผง (เหลือ aria-label ให้โปรแกรมอ่านจอ)
      const edgeBtn = el.querySelector('[data-act="edge"]');
      say(edgeBtn, ICON.edge[this.side], `ตอนนี้ติด${EDGE_TH[this.side]} กดเพื่อเลือกขอบที่จะย้ายไป`);
      edgeBtn.removeAttribute('title');
      // ชิ้นสีเขียว (ขอบที่ติดอยู่) มีป้าย ตอนนี้ (box.css .cx-edge-now วางตาม data-cur)
      // (พี่กันเลือกแบบ 14-2 ข้อ 3 "งั้น บอกไว้ ว่าเขียวคืออะไร" แล้ว "เอาอันนี้" 7 ต.ค. 2569 · เดิมไม่มีป้าย)
      // ชี้ชิ้นอื่นแล้วชื่อขอบขึ้นกลางชิ้นทันที แบบป้ายของ 14-2 ข้อ 2 เติมคำว่าขอบ (box.css .cx-edge-lab) ไม่ใช้ป้ายของ Chrome ที่ขึ้นช้า
      // (พี่กันสั่ง "ไม่ขึ้นแบบนี้สิ ขึ้นสีเลยสิ มาขึ้นแบบนี้โคตรช้า ภาพสอง เธอก็มีเสนอเเล้วนี่ เเค่ใส่คำว่า ขอบ" 7 ต.ค. 2569
      //  เดิม title ย้ายไปติดขอบบน · ติดขอบขวาอยู่ตอนนี้) · ชื่อสำหรับโปรแกรมอ่านจอยังบอกว่ากดแล้วทำอะไร
      el.querySelector('.cx-scr').dataset.cur = this.side;
      el.querySelectorAll('.cx-edge').forEach((b) => {
        const cur = b.dataset.edge === this.side, name = EDGE_TH[b.dataset.edge];
        b.setAttribute('aria-current', String(cur));
        b.setAttribute('aria-label', cur ? `ติด${name}อยู่ตอนนี้` : `ย้ายไปติด${name}`);
        b.removeAttribute('title');
      });
      // ขอบบนล่าง box.css หมุนลูกศรของปุ่มพับให้ชี้ขึ้นลงเข้าหาขอบ
      say(el.querySelector('[data-act="fold"]'), this.side === 'left' ? ICON.foldL : ICON.foldR, 'พับเก็บไว้ที่ขอบจอ');
      this.dock.dataset.side = this.side;
      this.dock.dataset.axis = isSide(this.side) ? 'v' : 'h';
    }

    setMsg(k, spec) {
      const m = this.panel.querySelector(`[data-msg="${k}"]`);
      if (!m) return;
      if (!spec) { m.hidden = true; m.className = 'cx-msg'; m.innerHTML = ''; return; }
      const [type, text] = spec;
      m.hidden = false;
      m.className = 'cx-msg ' + type;
      m.innerHTML = (type === 'mute' ? '' : ICON.alertSm) + `<span>${text}</span>`;
    }

    /* ══════════ คำนวณใหม่ทุกครั้งที่ค่าเปลี่ยน ══════════ */

    update() {
      const st = this.st, el = this.panel, r = C.compute(st);
      // หน่วยของแต่ละช่อง ให้ตัววาดผลแสดงน้ำหนักตามหน่วยที่กรอก (render.js wOut · 7 ต.ค. 2569) · สูตรใน calc.js ไม่แตะ
      r.units = { wu: st.wu, hu: st.hu, su: st.su };
      this.r = r;
      el.querySelectorAll('[data-sex]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sex === st.sex)));
      el.querySelector('.cx-seg').classList.toggle('is-warn', r.sexWarn);
      this.setMsg('sex', r.sexWarn ? ['warn', 'กรุณาเลือกเพศ'] : null);
      const active = this.o.root.activeElement || document.activeElement;
      for (const k of ['age', 'w', 'h', 'scr']) {
        const inp = el.querySelector(`[data-k="${k}"]`);
        if (active !== inp && inp.value !== st[k]) inp.value = st[k];
        const showErr = r.err[k] && !this.typing.has(k);
        const fld = inp.closest('.cx-field');
        fld.classList.toggle('is-err', !!showErr);
        fld.classList.toggle('is-warn', k === 'age' && r.ageWarn);
        inp.setAttribute('aria-invalid', showErr ? 'true' : 'false');
        if (showErr) this.setMsg(k, ['err', r.err[k]]);
        // บอกตามค่าที่กรอก เกินหรือต่ำกว่าช่วงอายุ ไม่ซ้ำกับหมายเหตุใต้ตัวเลข CrCl (พี่กันเลือกแบบ 7-1 ข้อ 8 "เอาอันนี้ เเต่เอาวงเล้บออก" 5 ต.ค. 2569
        // เดิม CrCl อาจไม่แม่นยำ สูตรนี้ใช้กับอายุ 18–92 ปี) · ช่องอายุกรองให้เหลือแต่ตัวเลข Number อ่านได้ตรง
        else if (k === 'age' && r.ageWarn) this.setMsg(k, ['warn', `${Number(st.age) > 92 ? 'เกิน' : 'ต่ำกว่า'}ช่วงอายุที่สูตรรองรับ 18–92 ปี`]);
        else this.setMsg(k, null);
        // บั้งคู่ต่อท้ายตัวเลข sCr ตอนสูงหรือต่ำกว่าค่าอ้างอิง · สำเนาตัวเลขแบบมองไม่เห็นวางทับช่อง ตัวบั้งจึงอยู่ถัดตัวเลขพอดี ตัวเลขไม่ขยับ
        if (k === 'scr') {
          const mir = fld.querySelector('.cx-mirror');
          const f = showErr ? '' : r.crRef === 'high' ? 'hi' : r.crRef === 'low' ? 'lo' : '';
          mir.className = 'cx-mirror' + (f ? ' ' + f : '');
          mir.firstChild.textContent = inp.value;
          mir.lastChild.innerHTML = f === 'hi' ? ICON.flagUp : f === 'lo' ? ICON.flagDown : '';
        }
      }
      el.querySelectorAll('[data-unit]').forEach((b) => {
        const key = b.dataset.unit, cur = st[key], nxt = C.UNIT[key][cur].next;
        const say = `หน่วยตอนนี้ ${C.UNIT_TXT[cur]} กดเพื่อสลับเป็น ${C.UNIT_TXT[nxt]}`;
        b.innerHTML = `<span>${C.UNIT_TXT[cur]}</span>${ICON.swapSm}`;
        b.setAttribute('aria-label', say); b.title = say;
      });
      this.setMsg('scrref', R.crRefMsg(r, st.sex, st.su));
      this.results.innerHTML = R.resultsHTML(r, this.layout);
      this.paintBase();
    }

    /** ค่าที่ส่งออกไปเก็บ (ทำสำเนาเสมอ กันคนนอกแก้ของในกล่อง) */
    emitState() { if (this.o.onState) this.o.onState(Object.assign({}, this.st)); }
    /** จดสภาพที่กล่องกำลังจะเป็น ไม่ใช่ค่าระหว่างขยับ กดพับแล้วเปลี่ยนหน้าทันที กล่องต้องกลับมาแบบพับ */
    emitUi() { if (this.o.onUi) this.o.onUi({ open: this.visible, folded: this.visible && this.goal === 0 }); }
    emitPrefs() { if (this.o.onPrefs) this.o.onPrefs({ layout: this.layout, side: this.side, top: Math.round(this.top) }); }

    /** ค่าจากข้างนอก เช่น แผงข้างเปลี่ยนแท็บ หรือแท็บอื่นแก้ค่าของแท็บนี้ */
    setState(st) {
      this.st = Object.assign(C.emptyState(), st || {});
      this.typing.clear();
      for (const k of ['age', 'w', 'h', 'scr']) {
        const inp = this.panel.querySelector(`[data-k="${k}"]`);
        inp.value = this.st[k];
        inp.placeholder = k === 'age' ? C.PH.age : C.PH[k][this.st[C.UNIT_OF[k]]];
      }
      this.update();
    }

    toggleUnit(key) {
      const st = this.st, cur = st[key], nxt = C.UNIT[key][cur].next, f = C.FIELD_OF[key];
      st[f] = C.convertUnit(key, cur, st[f]);
      st[key] = nxt;
      this.typing.delete(f);
      const inp = this.panel.querySelector(`[data-k="${f}"]`);
      inp.value = st[f];
      inp.placeholder = C.PH[f][nxt];
      this.update();
      this.emitState();
    }

    /** ล้างทันที ไม่ถามย้ำ เหมือน TB calc (พี่กันเคาะในมอคอัป) */
    clear() {
      this.st = C.emptyState();
      this.typing.clear();
      for (const k of ['age', 'w', 'h', 'scr']) {
        const inp = this.panel.querySelector(`[data-k="${k}"]`);
        inp.value = '';
        inp.placeholder = k === 'age' ? C.PH.age : C.PH[k][this.st[C.UNIT_OF[k]]];
      }
      this.update();
      this.emitState();
    }

    setLayout(layout) {
      if (layout === this.layout) return;
      this.layout = layout;
      this.paintHead();
      this.update();
      if (this.mode === 'float') this.relayout();
    }


    /** แถบข้อความใต้หัวกล่อง เช่นบอกวิธีเปิดแผงข้าง · ข้อความตายตัวจากโค้ด ใส่ด้วย textContent */
    showBar(text, button) {
      this.bar.querySelector('span').textContent = text;
      this.bar.querySelector('button').textContent = button;
      this.bar.hidden = false;
      this.relayout();
    }

    hideBar() {
      if (this.bar.hidden) return;
      this.bar.hidden = true;
      this.relayout();
    }

    /* ══════════ ผูกการใช้งาน ══════════ */

    bind() {
      const el = this.panel;
      el.addEventListener('input', (e) => {
        const inp = e.target.closest && e.target.closest('[data-k]');
        if (!inp) return;
        const k = inp.dataset.k;
        const raw = inp.value;
        const v = C.sanitizeNumber(raw);
        if (v !== raw) {
          const pos = Math.max(0, (inp.selectionStart || 0) - (raw.length - v.length));
          inp.value = v;
          inp.setSelectionRange(pos, pos);
        }
        this.st[k] = v;
        this.typing.add(k);
        clearTimeout(this.timers[k]);
        this.timers[k] = setTimeout(() => { this.typing.delete(k); this.update(); }, TYPING_MS);
        this.update();
        this.emitState();
      });
      el.addEventListener('focusout', (e) => {
        const inp = e.target.closest && e.target.closest('[data-k]');
        if (!inp) return;
        this.typing.delete(inp.dataset.k);
        clearTimeout(this.timers[inp.dataset.k]);
        this.update();
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('button');
        if (!b || !el.contains(b)) return;
        if (b.dataset.sex) { this.st.sex = b.dataset.sex; this.update(); this.emitState(); return; }
        if (b.dataset.unit) { this.toggleUnit(b.dataset.unit); return; }
        if (b.dataset.edge) { this.edgePop(false); this.moveTo(b.dataset.edge); return; }
        const act = b.dataset.act;
        if (act === 'clear') this.clear();
        else if (act === 'mode') { if (this.o.onMode) this.o.onMode(); }
        else if (act === 'bar') { this.hideBar(); if (this.o.onBar) this.o.onBar(); }
        else if (act === 'layout') { this.setLayout(this.layout === 'narrow' ? 'wide' : 'narrow'); this.emitPrefs(); }
        // กดปุ่มเลือกขอบ แผงค้าง · แผงที่ขึ้นเพราะชี้อยู่ กดแล้วกลายเป็นค้าง · ค้างอยู่แล้วกดซ้ำ แผงปิด
        else if (act === 'edge') {
          if (this.pop.hidden) this.edgePop(true);
          else if (this.popHow === 'hover') this.edgePop(true);
          else this.edgePop(false);
        }
        else if (act === 'fold') this.fold(true);
        else if (act === 'close') this.close();
      });
      this.initThumb();
      const ro = new ResizeObserver(() => this.contentResized());
      ro.observe(this.inputs);
      ro.observe(this.results);
      // ฟอนต์โหลดเสร็จทีหลัง ขนาดตัวอักษรเปลี่ยน ความสูงกล่องกับแถบเลื่อนต้องคิดใหม่
      if (document.fonts) {
        if (document.fonts.ready) document.fonts.ready.then(() => this.contentResized());
        document.fonts.addEventListener('loadingdone', () => this.contentResized());
      }

      if (this.mode === 'panel') {
        // แผงข้าง Chrome ให้ผู้ใช้ลากขอบแผงเอง แบบแคบหรือกว้างจึงตามความกว้างแผง ไม่มีปุ่มสลับ
        new ResizeObserver(() => {
          this.setLayout(this.pane.clientWidth >= WIDE_MIN ? 'wide' : 'narrow');
          this.thumbPlace();
        }).observe(this.pane);
        return;
      }

      // กดแป้นในกล่อง ไม่ส่งต่อให้หน้าเว็บ กันคีย์ลัดของ paperless ทำงานตอนพิมพ์ในกล่อง
      // Esc พับกล่องเฉพาะตอนเคอร์เซอร์อยู่ในกล่อง ไม่ไปแย่งปุ่ม Esc ของหน้าเว็บ
      // แผงเลือกขอบเปิดอยู่ Esc ปิดแผงก่อน ไม่พับกล่อง
      const stopKey = (e) => {
        if (e.type === 'keydown' && e.key === 'Escape') {
          if (this.pop && !this.pop.hidden) {
            e.preventDefault();
            this.edgePop(false);
            this.panel.querySelector('[data-act="edge"]').focus({ preventScroll: true });
          } else if (this.p === 1) { e.preventDefault(); this.fold(true); }
        }
        e.stopPropagation();
      };
      for (const t of ['keydown', 'keyup', 'keypress']) this.dock.addEventListener(t, stopKey);

      // กดในกล่องแต่นอกแผงเลือกขอบ แผงปิด (ตัวดักนี้อยู่ใน Shadow DOM เห็นของข้างในครบ ทั้งแบบเปิดและแบบปิด)
      this.dock.addEventListener('pointerdown', (e) => {
        if (!this.pop || this.pop.hidden) return;
        const path = e.composedPath();
        if (!path.includes(this.pop) && !path.includes(this.panel.querySelector('[data-act="edge"]'))) this.edgePop(false);
      });

      // ชี้โดนปุ่มเลือกขอบ แผงขึ้นทันทีโดยไม่ต้องกด · เลื่อนเมาส์ออกนอกปุ่มและแผง รอ 0.3 วินาทีแผงหาย
      // แผงที่ขึ้นเพราะกด ไม่หายตอนเลื่อนเมาส์ออก (พี่กันสั่ง 4 ต.ค. 2569 ดูมอคอัป crcl-box-edge-pop-trap-2026-10-04.html)
      // จอสัมผัสไม่มีการชี้ ใช้การกดอย่างเดียว · ระหว่างลากกล่องไม่เปิด
      const edgeBtn = this.panel.querySelector('[data-act="edge"]');
      const stay = () => clearTimeout(this.popTimer);
      const away = () => {
        if (this.popHow !== 'hover') return;
        clearTimeout(this.popTimer);
        this.popTimer = setTimeout(() => this.edgePop(false), POP_LEAVE_MS);
      };
      edgeBtn.addEventListener('pointerenter', (e) => {
        stay();
        if (e.pointerType === 'mouse' && this.pop.hidden && !this.lifted) this.edgePop(true, 'hover');
      });
      edgeBtn.addEventListener('pointerleave', away);
      this.pop.addEventListener('pointerenter', stay);
      this.pop.addEventListener('pointerleave', away);

      this.base.addEventListener('click', () => {
        if (this.justDragged) { this.justDragged = false; return; }
        if (this.p > 0.5) this.fold(true); else this.unfold(true);
      });
      this.dragOn(this.base, true);
      this.dragOn(this.head, false);
      window.addEventListener('resize', () => this.relayout());
    }

    contentResized() {
      if (this.mode === 'float') this.relayout();
      else this.thumbPlace();
    }

    /* ══════════ ลำต้นกับกล่อง (เฉพาะกล่องลอย) ══════════ */

    /** ขนาดที่ว่างในหน้าเว็บตอนนี้ ไม่นับแถบเลื่อนของหน้า (ชั้นลอยกางเต็มหน้าต่างพอดี) */
    vp() {
      return { w: this.dock.clientWidth || window.innerWidth, h: this.dock.clientHeight || window.innerHeight };
    }

    /**
     * ความยาวของแถบตอนพับตามแนวขอบ วัดจากของจริง (มีค่า CrCl หรือไม่มี ยาวไม่เท่ากัน)
     * ขอบซ้ายขวาเรียงของในแถบลงมาเป็นแนวตั้ง · ขอบบนล่างเรียงเป็นแถวเดียวแนวนอน
     */
    tabLen(edge) {
      const d = this.dock.dataset, s = this.dock.style;
      const axis = d.axis, w = s.getPropertyValue('--bw'), h = s.getPropertyValue('--bh');
      const side = isSide(edge);
      d.axis = side ? 'v' : 'h';
      s.setProperty('--bw', side ? px(TAB_W) : 'auto');
      s.setProperty('--bh', side ? 'auto' : px(TAB_HZ));
      const len = side ? this.base.offsetHeight : this.base.offsetWidth;
      s.setProperty('--bw', w);
      s.setProperty('--bh', h);
      d.axis = axis;
      return len;
    }

    /** ความสูงตามธรรมชาติของกล่อง ถ้าไม่ติดขอบจอ */
    panelNatural() {
      const s = this.panel.style;
      s.height = 'auto';
      const h = this.panel.offsetHeight;
      s.height = '';
      return h;
    }

    /**
     * คิดตำแหน่งตามกฎ 3+4 สำหรับขอบ edge โดยแถบอยู่ที่ along (ระยะตามแนวขอบ) ไม่แตะหน้าจอ
     * ขอบซ้ายขวาไล่ตามแนวตั้ง ขอบบนล่างใช้กฎเดียวกันแต่ไล่ตามแนวนอน
     * nat = ความสูงกล่องที่วัดไว้แล้ว (ส่งมาตอนลาก ไม่ต้องวัดซ้ำทุกจังหวะ)
     */
    calcGeo(edge, along, nat) {
      const { w: vw, h: vh } = this.vp();
      const side = isSide(edge), L = side ? vh : vw;
      // ระหว่างลากใช้ความยาวแถบที่วัดไว้ตอนหยิบ ไม่ต้องวัดซ้ำทุกจังหวะ
      const tabLen = this.dragTab ? this.dragTab[side ? 'v' : 'h'] : this.tabLen(edge);
      if (nat == null) nat = this.panelNatural();
      const pw = WIDTH[this.layout];
      // pa = ขนาดกล่องตามแนวขอบ · pc = ขนาดกล่องที่ยื่นออกจากขอบ
      const pa = Math.max(0, side ? Math.min(nat, vh - 2 * EDGE) : Math.min(pw, vw - 2 * EDGE));
      const pc = side ? pw : Math.max(0, Math.min(nat, vh - TRUNK_W - EDGE));
      const pos = Math.round(clamp(along, EDGE, Math.max(EDGE, L - EDGE - tabLen)));
      // ลำต้นยึดต้นแถบ แล้วค่อย ๆ เลื่อนไปยึดปลายแถบเมื่อแถบอยู่ไกลออกไป ลำต้นจึงไม่ล้นจอ
      const k = clamp((pos - EDGE) / Math.max(1, L - 2 * EDGE - tabLen), 0, 1);
      let tt = Math.round(pos + (tabLen - TRUNK_H) * k);
      // กล่องห้อยจากลำต้นถ้าที่พอ ไม่พอเลื่อนเท่าที่จำเป็น ยาวกว่าจอก็เต็มจอ
      const pt = Math.round(clamp(tt, EDGE, Math.max(EDGE, L - EDGE - pa)));
      // ช่องห่างระหว่างลำต้นกับมุมกล่องที่เล็กกว่ารัศมีโค้ง ใส่โค้งเว้าไม่ได้ ชิดให้สนิทแทน
      if (tt - pt > 0 && tt - pt < RAD) tt = pt;
      if (pt + pa - (tt + TRUNK_H) < RAD) tt = Math.max(pt, Math.round(pt + pa - TRUNK_H));
      return { edge, vw, vh, thick: side ? TAB_W : TAB_HZ, tabLen, nat, pa, pc, pos, tt, pt,
        gapA: tt - pt, gapB: pt + pa - (tt + TRUNK_H), j: tt + TRUNK_H / 2 - pt };
    }

    measure() {
      const g = this.calcGeo(this.side, this.top);
      this.top = g.pos;
      this.geo = g;
    }

    /**
     * ตำแหน่งทุกชิ้นที่จังหวะ p (0 = พับเหลือแถบ 1 = กางเต็ม) เป็นพิกัดในหน้าต่าง
     * corners = มุมกล่อง บนซ้าย บนขวา ล่างขวา ล่างซ้าย · clip = ระยะตัดบน ขวา ล่าง ซ้าย ตอนกล่องค่อย ๆ ออกจากลำต้น
     */
    layoutAt(p, g) {
      const q = 1 - p;
      const thick = g.thick + (TRUNK_W - g.thick) * p;
      const bA = g.pos + (g.tt - g.pos) * p;
      const bL = g.tabLen + (TRUNK_H - g.tabLen) * p;
      const r = px(RAD * q);
      // มุมฝั่งที่ชิดลำต้นเป็นเหลี่ยมเมื่อลำต้นชิดปลายกล่องพอดี
      const sIn = g.gapA > 0 ? RAD : 0, eIn = g.gapB > 0 ? RAD : 0;
      // กล่องค่อย ๆ ออกจากจุดที่ติดกลางลำต้น
      const ca = px(q * g.j), cb = px(q * (g.pa - g.j)), cs = Math.round(q * 10000) / 100 + '%';
      const o = { p, up: g.gapA >= RAD, down: g.gapB >= RAD };
      if (g.edge === 'right') {
        o.base = { x: g.vw - thick, y: bA, w: thick, h: bL, rad: `${r} 0 0 ${r}` };
        o.panel = { x: g.vw - thick - g.pc, y: g.pt, w: g.pc, h: g.pa };
        o.corners = [RAD, sIn, eIn, RAD];
        o.clip = [ca, '0px', cb, cs];
        o.fA = { x: g.vw - thick, y: bA - RAD, at: '100% 0' };
        o.fB = { x: g.vw - thick, y: bA + bL, at: '100% 100%' };
      } else if (g.edge === 'left') {
        o.base = { x: 0, y: bA, w: thick, h: bL, rad: `0 ${r} ${r} 0` };
        o.panel = { x: thick, y: g.pt, w: g.pc, h: g.pa };
        o.corners = [sIn, RAD, RAD, eIn];
        o.clip = [ca, cs, cb, '0px'];
        o.fA = { x: thick - RAD, y: bA - RAD, at: '0 0' };
        o.fB = { x: thick - RAD, y: bA + bL, at: '0 100%' };
      } else if (g.edge === 'top') {
        o.base = { x: bA, y: 0, w: bL, h: thick, rad: `0 0 ${r} ${r}` };
        o.panel = { x: g.pt, y: thick, w: g.pa, h: g.pc };
        o.corners = [sIn, eIn, RAD, RAD];
        o.clip = ['0px', cb, cs, ca];
        o.fA = { x: bA - RAD, y: thick - RAD, at: '0 0' };
        o.fB = { x: bA + bL, y: thick - RAD, at: '100% 0' };
      } else {
        o.base = { x: bA, y: g.vh - thick, w: bL, h: thick, rad: `${r} ${r} 0 0` };
        o.panel = { x: g.pt, y: g.vh - thick - g.pc, w: g.pa, h: g.pc };
        o.corners = [RAD, RAD, eIn, sIn];
        o.clip = [cs, cb, '0px', ca];
        o.fA = { x: bA - RAD, y: g.vh - thick, at: '0 100%' };
        o.fB = { x: bA + bL, y: g.vh - thick, at: '100% 100%' };
      }
      return o;
    }

    /** วางทุกชิ้นตามจังหวะ p (0 = พับเหลือแถบ 1 = กางเต็ม) · ระหว่างลาก กล่องตามมือ ไม่ต้องวาง */
    apply(p) {
      this.p = p;
      if (!this.geo || this.lifted) return;
      const L = this.layoutAt(p, this.geo);
      const s = this.dock.style, set = (k, v) => s.setProperty(k, v);
      set('--bx', px(L.base.x));
      set('--by', px(L.base.y));
      set('--bw', px(L.base.w));
      set('--bh', px(L.base.h));
      set('--brad', L.base.rad);
      set('--bo', String(clamp(1 - p * 1.6, 0, 1)));
      set('--fo', String(clamp((p - 0.75) * 4, 0, 1)));
      set('--px', px(L.panel.x));
      set('--py', px(L.panel.y));
      set('--ph', px(L.panel.h));
      ['--c-tl', '--c-tr', '--c-br', '--c-bl'].forEach((k, i) => set(k, px(L.corners[i])));
      ['--k-t', '--k-r', '--k-b', '--k-l'].forEach((k, i) => set(k, L.clip[i]));
      set('--f1x', px(L.fA.x));
      set('--f1y', px(L.fA.y));
      set('--f1a', L.fA.at);
      set('--f2x', px(L.fB.x));
      set('--f2y', px(L.fB.y));
      set('--f2a', L.fB.at);
      const d = this.dock.dataset;
      d.open = String(p > 0.5);
      d.folded = String(p === 0);
      d.up = String(L.up);
      d.down = String(L.down);
      const say = p > 0.5 ? 'พับกล่องเก็บไว้ที่ขอบจอ' : 'กางกล่องคำนวณ CrCl';
      this.base.setAttribute('aria-label', say);
      this.base.title = say;
    }

    relayout() {
      if (this.mode !== 'float' || !this.visible) { this.thumbPlace(); return; }
      if (this.lifted) return;
      this.measure();
      this.apply(this.p);
      this.thumbPlace();
    }

    animateTo(target, done) {
      cancelAnimationFrame(this.raf);
      this.goal = target;
      // ผู้ใช้ตั้งลดการเคลื่อนไหว หรือแท็บถูกซ่อน (เบราว์เซอร์หยุดวาดจอให้) ไปภาพสุดท้ายทันที
      if (reduceMotion() || document.hidden) { this.apply(target); if (done) done(); return; }
      const from = this.p;
      let t0 = null;
      const step = (ts) => {
        if (t0 === null) t0 = ts;
        const k = Math.min(1, (ts - t0) / ANIM_MS);
        const e = 1 - Math.pow(1 - k, 3);
        this.apply(k === 1 ? target : from + (target - from) * e);
        if (k < 1) this.raf = requestAnimationFrame(step);
        else if (done) done();
      };
      this.raf = requestAnimationFrame(step);
    }

    paintBase() {
      if (this.mode !== 'float') return;
      const v = C.crclValue(this.r);
      this.base.innerHTML = ICON.calc + '<span class="k">CrCl</span>'
        + (v == null ? '' : `<span class="v">${R.f1(v)}</span><span class="u">mL/min</span>`);
    }

    hasFocus() {
      const a = this.o.root.activeElement;
      return !!a && this.dock.contains(a);
    }

    fold(byUser) {
      if (this.mode !== 'float' || !this.visible) return;
      this.edgePop(false);
      const focused = this.hasFocus();
      this.measure();
      this.animateTo(0, () => {
        if (focused) this.base.focus({ preventScroll: true });
        this.thumbHideNow();
      });
      if (byUser) this.emitUi();
    }

    unfold(byUser) {
      if (this.mode !== 'float' || !this.visible) return;
      const focused = this.hasFocus();
      this.measure();
      this.animateTo(1, () => {
        if (focused) this.panel.querySelector('[data-act="fold"]').focus({ preventScroll: true });
        this.thumbPlace();
      });
      if (byUser) this.emitUi();
    }

    /** แสดงกล่อง · folded = แสดงเป็นแถบพับ · animate = ค่อย ๆ กางจากแถบ · focus = ย้ายเคอร์เซอร์เข้ากล่อง */
    show({ folded = false, animate = false, focus = false } = {}) {
      if (this.mode !== 'float') return;
      this.dock.hidden = false;
      this.visible = true;
      this.measure();
      const target = folded ? 0 : 1;
      this.goal = target;
      if (animate && !folded) {
        this.apply(0);
        this.animateTo(1, () => this.thumbPlace());
      } else {
        this.apply(target);
        this.thumbPlace();
      }
      if (focus) {
        const t = folded ? this.base : this.panel.querySelector('[data-act="fold"]');
        t.focus({ preventScroll: true });
      }
      this.emitUi();
    }

    /** ปิดกล่อง กล่องหายไปแต่ค่าที่กรอกยังอยู่ กดไอคอนส่วนขยายอีกครั้งกล่องกลับมาพร้อมค่าเดิม */
    close() {
      if (this.mode !== 'float') return;
      this.edgePop(false);
      cancelAnimationFrame(this.raf);
      this.thumbHideNow();
      this.dock.hidden = true;
      this.visible = false;
      this.emitUi();
    }

    /** กดไอคอนส่วนขยาย · ปิดอยู่ = กางขึ้นมา · พับอยู่ = กาง · กางอยู่ = ปิด */
    iconClick() {
      if (!this.visible) this.show({ animate: true, focus: true });
      else if (this.p < 1) this.unfold(true);
      else this.close();
    }

    /* ══════════ ลากแบบหยิบไปวาง ══════════
       กดค้างที่หัวกล่อง (หรือที่แถบตอนพับ) แล้วลาก กล่องหลุดจากขอบ ลอยขึ้น ตามมือไปทุกจุด
       ระหว่างลากมีเส้นประบอกขอบที่จะไปติด ปล่อยเมาส์แล้วกล่องไหลเข้าไปติดขอบนั้นเอง
       ติดขอบบนหรือล่างต้องลากจนเมาส์ชนขอบหน้าต่าง นอกนั้นดูว่าเมาส์อยู่ครึ่งไหนของจอ */

    /** หยิบขึ้นจากขอบ · gx gy = จุดที่จับ วัดจากมุมบนซ้ายของสิ่งที่ลาก */
    lift(folded, gx, gy) {
      this.dragTab = { v: this.tabLen('left'), h: this.tabLen('top') };
      this.lifted = true;
      this.liftFolded = folded;
      this.tilt = 0;
      const d = this.dock, s = d.style;
      d.dataset.lifted = 'true';
      d.dataset.liftfold = String(folded);
      // ระหว่างลอย มุมโค้งครบทุกมุม และไม่ตัดกล่อง
      if (folded) s.setProperty('--brad', px(RAD));
      else {
        ['--c-tl', '--c-tr', '--c-br', '--c-bl'].forEach((k) => s.setProperty(k, px(RAD)));
        ['--k-t', '--k-r', '--k-b', '--k-l'].forEach((k) => s.setProperty(k, '0px'));
      }
      (folded ? this.base : this.panel).style.transformOrigin = `${px(gx)} ${px(gy)}`;
    }

    /** วางสิ่งที่ลากไว้ที่ fx fy (พิกัดในหน้าต่าง) เอียงตามความเร็วที่ลาก */
    floatAt(fx, fy) {
      this.fx = fx;
      this.fy = fy;
      const s = this.dock.style;
      s.setProperty(this.liftFolded ? '--bx' : '--px', px(fx));
      s.setProperty(this.liftFolded ? '--by' : '--py', px(fy));
      (this.liftFolded ? this.base : this.panel).style.transform =
        reduceMotion() ? '' : `rotate(${this.tilt.toFixed(2)}deg) scale(${LIFT_SCALE})`;
    }

    /**
     * ตำแหน่งแถบที่ทำให้กล่องลงตรง want พอดี (ย้อนสูตรลำต้นใน calcGeo)
     * ปล่อยเมาส์แล้วกล่องอยู่ที่เดิมมากที่สุด เลื่อนเท่าที่จำเป็นให้อยู่ในจอ
     */
    alongFor(edge, want) {
      const { w, h } = this.vp();
      const tabLen = this.dragTab[isSide(edge) ? 'v' : 'h'];
      const c = tabLen - TRUNK_H, D = Math.max(1, (isSide(edge) ? h : w) - 2 * EDGE - tabLen);
      return (want + (c * EDGE) / D) / (1 + c / D);
    }

    /** ขอบที่จะไปติด · บนล่างต้องชนขอบหน้าต่าง จับหัวกล่องลากไปทางข้างจะได้ไม่เผลอไปติดขอบบน */
    pickEdge(x, y) {
      const { w, h } = this.vp();
      if (y <= SNAP) return 'top';
      if (y >= h - SNAP) return 'bottom';
      return x < w / 2 ? 'left' : 'right';
    }

    /** กรอบเส้นประตรงที่จะไปติด ถ้าปล่อยตอนนี้ */
    ghostAt(edge, along, folded) {
      const L = this.layoutAt(folded ? 0 : 1, this.calcGeo(edge, along, this.geo ? this.geo.nat : null));
      const s = this.ghost.style, set = (k, v) => s.setProperty(k, v);
      set('--gbx', px(L.base.x));
      set('--gby', px(L.base.y));
      set('--gbw', px(L.base.w));
      set('--gbh', px(L.base.h));
      set('--gbr', L.base.rad);
      set('--gpx', px(L.panel.x));
      set('--gpy', px(L.panel.y));
      set('--gpw', px(L.panel.w));
      set('--gph', px(L.panel.h));
      set('--gpr', L.corners.map(px).join(' '));
      this.ghost.dataset.folded = String(folded);
      this.ghost.dataset.on = 'true';
    }

    /** ปล่อยเมาส์ ติดขอบใหม่ แล้วไหลจากตรงที่ปล่อยเข้าไปหาที่ใหม่ */
    drop(edge, along) {
      const folded = this.liftFolded, el = folded ? this.base : this.panel;
      const from = { x: this.fx, y: this.fy, tilt: this.tilt, scale: LIFT_SCALE };
      this.lifted = false;
      this.dragTab = null;
      delete this.dock.dataset.lifted;
      delete this.dock.dataset.liftfold;
      this.ghost.dataset.on = 'false';
      el.style.transform = '';
      this.goal = folded ? 0 : 1;
      this.settle(edge, along, from);
    }

    /** ติดขอบ edge ที่ตำแหน่ง along แล้วไหลจาก from (ตำแหน่งก่อนย้ายของกล่องหรือแถบ) เข้าไปหาที่ใหม่ */
    settle(edge, along, from) {
      const folded = this.goal === 0, el = folded ? this.base : this.panel;
      this.side = edge;
      this.top = along;
      this.paintHead();
      this.measure();
      this.apply(this.goal);
      this.thumbPlace();
      this.emitPrefs();
      if (reduceMotion() || document.hidden) { el.style.transformOrigin = ''; return; }
      const to = this.layoutAt(this.goal, this.geo)[folded ? 'base' : 'panel'];
      el.animate([
        { transform: `translate(${px(from.x - to.x)}, ${px(from.y - to.y)}) rotate(${from.tilt}deg) scale(${from.scale})` },
        { transform: 'none' },
      ], { duration: GLIDE_MS, easing: 'cubic-bezier(.2,.8,.25,1)' })
        .finished.then(() => { el.style.transformOrigin = ''; }, () => { el.style.transformOrigin = ''; });
      // ลำต้นกับโค้งเว้าค่อยโผล่ตามมาหลังกล่องเกือบถึงขอบ
      if (!folded) {
        for (const x of [this.base, ...this.dock.querySelectorAll('.fillet')]) {
          x.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: GLIDE_MS + 120, easing: 'ease-out' });
        }
      }
    }

    /* ══════════ ปุ่มเลือกขอบ (พี่กันเลือกแบบ ข 3 ต.ค. 2569) ══════════
       กดปุ่มที่หัวกล่องแล้วมีแผงเล็กเป็นรูปจอ กดขอบไหนกล่องไหลไปติดขอบนั้น · ใช้แป้นพิมพ์ได้ครบทุกขอบ */

    /** เปิดหรือปิดแผงเลือกขอบ · how = 'hover' เปิดเพราะเมาส์ชี้ (เลื่อนออกแล้วหาย) · ไม่ใส่ = เปิดเพราะกด (ค้างไว้)
     *  กดที่อื่นหรือ Esc แผงปิดทั้งสองแบบ */
    edgePop(open, how) {
      const pop = this.pop;
      if (!pop) return;
      clearTimeout(this.popTimer);
      const btn = this.panel.querySelector('[data-act="edge"]');
      // แผงที่ขึ้นเพราะชี้อยู่แล้ว ถูกกดเปิด = เปลี่ยนเป็นค้าง ย้ายเคอร์เซอร์ไปขอบปัจจุบันให้ใช้แป้นพิมพ์ต่อได้
      if (open && !pop.hidden) {
        if (how !== 'hover' && this.popHow === 'hover') {
          this.popHow = 'pin';
          pop.querySelector('[aria-current="true"]').focus({ preventScroll: true });
        }
        return;
      }
      if (!open && pop.hidden) return;
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      if (!open) {
        this.popHow = null;
        window.removeEventListener('pointerdown', this.offPop, true);
        this.offPop = null;
        return;
      }
      this.popHow = how === 'hover' ? 'hover' : 'pin';
      // วางใต้ปุ่ม ไม่ให้ล้นขอบกล่อง
      const x = clamp(btn.offsetLeft + btn.offsetWidth / 2 - pop.offsetWidth / 2, 8, this.panel.clientWidth - pop.offsetWidth - 8);
      pop.style.setProperty('--pop-x', px(x));
      // เปิดเพราะชี้ ไม่แย่งเคอร์เซอร์จากช่องที่กำลังพิมพ์ · เปิดเพราะกด เคอร์เซอร์ไปอยู่ที่ขอบปัจจุบัน
      if (this.popHow === 'pin') pop.querySelector('[aria-current="true"]').focus({ preventScroll: true });
      // กดนอกกล่อง แผงปิด · ส่วนขยายจริงใช้ Shadow DOM แบบปิด ตัวดักที่ window เห็นแค่ crcl-ext-root ไม่เห็นของข้างใน
      // จึงเช็กแค่ว่าไม่ได้กดในกล่อง การกดในกล่องแต่นอกแผง ตัวดักใน Shadow DOM (bind) เป็นคนปิด
      this.offPop = (e) => { if (!e.composedPath().includes(this.o.root.host)) this.edgePop(false); };
      window.addEventListener('pointerdown', this.offPop, true);
    }

    /** ย้ายไปติดขอบอื่นจากแผงเลือกขอบ กล่องไหลจากที่เดิมไปที่ใหม่ ห่างจากที่เดิมน้อยที่สุด */
    moveTo(edge) {
      if (this.mode !== 'float' || !this.visible || !this.geo) return;
      const btn = this.panel.querySelector('[data-act="edge"]');
      if (edge !== this.side) {
        const from = this.layoutAt(this.p, this.geo).panel;
        this.dragTab = { v: this.tabLen('left'), h: this.tabLen('top') };
        const along = this.alongFor(edge, isSide(edge) ? from.y : from.x);
        this.dragTab = null;
        this.settle(edge, along, { x: from.x, y: from.y, tilt: 0, scale: 1 });
      }
      btn.focus({ preventScroll: true });
    }

    /** ลากหัวกล่องตอนกาง หรือแถบตอนพับ (ตอนกาง ลากลำต้นก็ได้) */
    dragOn(handle, isTab) {
      handle.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (!isTab && e.target.closest('button')) return;
        if (this.p > 0 && this.p < 1) return;
        const folded = this.p === 0;
        const o = this.dock.getBoundingClientRect();
        const r0 = (folded ? this.base : this.panel).getBoundingClientRect();
        const gx = e.clientX - r0.left, gy = e.clientY - r0.top;
        const x0 = e.clientX, y0 = e.clientY;
        let moved = false, edge = this.side, along = this.top, lastX = x0, lastT = e.timeStamp, idle = 0;
        try { handle.setPointerCapture(e.pointerId); } catch (_) { /* เบราว์เซอร์ไม่ยอมจับ ลากต่อได้ตามปกติ */ }
        const move = (ev) => {
          if (!moved) {
            if (Math.abs(ev.clientY - y0) < 4 && Math.abs(ev.clientX - x0) < 4) return;
            moved = true;
            handle.classList.add('is-drag');
            this.thumbHideNow();
            this.lift(folded, gx, gy);
          }
          const x = ev.clientX - o.left, y = ev.clientY - o.top;
          const vx = (ev.clientX - lastX) / Math.max(1, ev.timeStamp - lastT);
          lastX = ev.clientX;
          lastT = ev.timeStamp;
          this.tilt = reduceMotion() ? 0 : clamp(this.tilt * 0.55 + vx * 1.4, -TILT_MAX, TILT_MAX);
          this.floatAt(x - gx, y - gy);
          edge = this.pickEdge(x, y);
          const want = isSide(edge) ? y - gy : x - gx;
          along = folded ? want : this.alongFor(edge, want);
          this.ghostAt(edge, along, folded);
          // หยุดมือ กล่องค่อย ๆ กลับมาตรง
          clearTimeout(idle);
          idle = setTimeout(() => { this.tilt = 0; if (this.lifted) this.floatAt(this.fx, this.fy); }, 90);
        };
        const up = () => {
          handle.removeEventListener('pointermove', move);
          handle.removeEventListener('pointerup', up);
          handle.removeEventListener('pointercancel', up);
          handle.classList.remove('is-drag');
          clearTimeout(idle);
          if (isTab) this.justDragged = moved;
          if (moved) this.drop(edge, along);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
      });
    }

    /* ══════════ แถบเลื่อนลอยในกล่อง (สกิล web-craft ข้อ 6.23) ══════════
       เลื่อนแล้วโผล่ · หยุด 0.4 วินาทีแล้วเริ่มจาง · จางหมดใน 1.3 วินาที · ระหว่างจางยังเอาเมาส์ไปโดนได้
       เอาเมาส์เข้าใกล้ขอบขวาของส่วนที่เลื่อนได้ แถบโผล่เอง · ลากแถบได้ */

    initThumb() {
      const body = this.body, t = this.thumb;
      this.th = { k1: 0, k2: 0, hov: false, drag: false };
      body.addEventListener('scroll', () => this.thumbShow(), { passive: true });
      this.panel.addEventListener('mousemove', (e) => {
        if (this.th.drag || e.target === t) return;
        const r = body.getBoundingClientRect();
        if (e.clientX >= r.right - THUMB_NEAR && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) this.thumbShow();
      });
      t.addEventListener('mouseenter', () => {
        this.th.hov = true;
        t.style.transition = 'opacity .6s ease';
        t.style.opacity = '1';
        t.style.pointerEvents = 'auto';
      });
      t.addEventListener('mouseleave', () => { this.th.hov = false; this.thumbShow(); });
      t.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const run = body.scrollHeight - body.clientHeight;
        const track = body.clientHeight - t.offsetHeight;
        if (run <= 0 || track <= 0) return;
        this.th.drag = true;
        t.classList.add('is-drag');
        const y0 = e.clientY, s0 = body.scrollTop;
        const move = (ev) => { body.scrollTop = s0 + ((ev.clientY - y0) / track) * run; };
        const up = () => {
          this.th.drag = false;
          t.classList.remove('is-drag');
          window.removeEventListener('mousemove', move, true);
          window.removeEventListener('mouseup', up, true);
          this.thumbShow();
        };
        window.addEventListener('mousemove', move, true);
        window.addEventListener('mouseup', up, true);
      });
    }

    /** วางแถบให้ตรงกับตำแหน่งที่เลื่อนอยู่ คืนค่าว่ามีของให้เลื่อนไหม */
    thumbPlace() {
      const body = this.body, t = this.thumb;
      const ch = body.clientHeight, sh = body.scrollHeight;
      const can = sh > ch + 1;
      // กันการเลื่อนไหลไปหน้าเว็บข้างหลัง เฉพาะตอนมีของให้เลื่อนจริง
      body.classList.toggle('is-scroll', can);
      if (!can || ch <= 0) { this.thumbHideNow(); return false; }
      const len = Math.max(THUMB_MIN, (ch * ch) / sh);
      const run = sh - ch;
      const at = run > 0 ? (body.scrollTop / run) * (ch - len) : 0;
      t.style.height = px(len);
      t.style.top = px(body.offsetTop + at);
      return true;
    }

    thumbShow() {
      if (!this.thumbPlace()) return;
      const t = this.thumb, th = this.th;
      t.style.transition = 'opacity .6s ease';
      t.style.opacity = '1';
      t.style.pointerEvents = 'auto';
      clearTimeout(th.k1);
      clearTimeout(th.k2);
      th.k1 = setTimeout(() => {
        if (th.drag || th.hov) return;
        t.style.transition = `opacity ${THUMB_FADE / 1000}s ease`;
        t.style.opacity = '0';
        // ตัดการรับเมาส์หลังจางหมดจริงเท่านั้น ระหว่างจางยังเห็นแถบอยู่ ต้องยังเอาเมาส์ไปโดนได้
        th.k2 = setTimeout(() => {
          if (th.drag || th.hov) return;
          t.style.pointerEvents = 'none';
        }, THUMB_FADE + 50);
      }, THUMB_WAIT);
    }

    thumbHideNow() {
      const t = this.thumb, th = this.th;
      if (!th) return;
      clearTimeout(th.k1);
      clearTimeout(th.k2);
      t.style.transition = 'none';
      t.style.opacity = '0';
      t.style.pointerEvents = 'none';
    }
  }

  CrCl.Box = Box;
})(globalThis);
