# เซิร์ฟเวอร์ทดสอบในเครื่องของโปรเจกต์กล่องคำนวณ CrCl (ใช้ตอนพัฒนาเท่านั้น ไม่อยู่ในส่วนขยาย)
#
#   py dev/serve.py            เปิดที่ http://127.0.0.1:3311
#
# - เสิร์ฟทั้งโปรเจกต์ เช่น /dev/harness.html  /extension/...  /docs/mockups/...
# - เสิร์ฟ TB calc ที่ /tb/ (C:/Users/PKH/tb-calculator) ให้หน้าเทียบสูตรเรียก TB calc ได้ในหน้าเดียว
# - POST /devshot { name, data } รับภาพหน้าจอเป็น dataURL แล้วเก็บลง dev/shots/ (โฟลเดอร์นี้อยู่ใน .gitignore)
#   ใช้ตามวิธีส่งภาพในสกิล testing-proof ข้อ 10
# - ไม่ให้เบราว์เซอร์เก็บแคช จะได้เห็นไฟล์ล่าสุดทุกครั้ง

import base64
import json
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TB_ROOT = os.path.abspath(os.path.join(ROOT, '..', 'tb-calculator'))
SHOTS = os.path.join(ROOT, 'dev', 'shots')
PORT = int(os.environ.get('PORT', '3311'))


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript; charset=utf-8',
        '.mjs': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.woff2': 'font/woff2',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
    }

    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        if clean == '/tb' or clean.startswith('/tb/'):
            rest = clean[3:].lstrip('/')
            base = TB_ROOT
        else:
            rest = clean.lstrip('/')
            base = ROOT
        from urllib.parse import unquote
        parts = [p for p in unquote(rest).split('/') if p not in ('', '.', '..')]
        return os.path.join(base, *parts)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        # 🔴 TB calc มี analytics.js ที่เขียนสถิติลงฐาน Supabase ของจริงทุกครั้งที่เปิดหน้า
        # ตอนทดสอบต้องไม่แตะฐานจริง (สกิล working-with-gun 3.5 ข้อ ๑) จึงส่งไฟล์เปล่าแทน
        # ตัวไฟล์ของ TB calc ไม่ถูกแก้ · ตรวจด้วยการดูคำขอในโครมว่าไม่มีอะไรวิ่งไป supabase.co
        if self.path.split('?', 1)[0] == '/tb/analytics.js':
            body = '/* ปิดการเก็บสถิติของ TB calc ตอนทดสอบในเครื่อง (dev/serve.py) */\n'.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/javascript; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        if self.path.split('?', 1)[0] != '/devshot':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            name = re.sub(r'[^0-9A-Za-z._-]', '_', str(body.get('name') or 'shot'))[:80]
            data = str(body.get('data') or '')
            m = re.match(r'^data:image/(png|jpeg|webp);base64,(.+)$', data, re.S)
            if not m:
                raise ValueError('data ต้องเป็น dataURL ของภาพ')
            ext = 'jpg' if m.group(1) == 'jpeg' else m.group(1)
            if not name.lower().endswith('.' + ext):
                name = name + '.' + ext
            os.makedirs(SHOTS, exist_ok=True)
            out = os.path.join(SHOTS, name)
            with open(out, 'wb') as f:
                f.write(base64.b64decode(m.group(2)))
            payload = json.dumps({'ok': True, 'path': out}).encode('utf-8')
            self.send_response(200)
        except Exception as e:  # ส่งข้อผิดพลาดกลับให้เห็น ไม่เงียบ
            payload = json.dumps({'ok': False, 'error': str(e)}).encode('utf-8')
            self.send_response(400)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt, *args):
        sys.stdout.write('[crcl-dev] ' + (fmt % args) + '\n')
        sys.stdout.flush()


if __name__ == '__main__':
    os.chdir(ROOT)
    server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print(f'[crcl-dev] http://127.0.0.1:{PORT}  root={ROOT}  tb={TB_ROOT}', flush=True)
    server.serve_forever()
