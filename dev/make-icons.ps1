# วาดไอคอนของส่วนขยายเป็นไฟล์ PNG ขนาด 16 32 48 128 ลง extension/icons/
# รูปเดียวกับ ICON.calc ใน extension/content/render.js (เครื่องคิดเลขสีเขียวน้ำทะเล กรอบ 24 จุด)
# ขยายให้เต็มความสูงไอคอน ไอคอนเล็ก 16 จุดจะได้ไม่จมหาย
# รัน  powershell -NoProfile -ExecutionPolicy Bypass -File dev/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot '..\extension\icons'
New-Item -ItemType Directory -Force $out | Out-Null
$teal = [System.Drawing.Color]::FromArgb(255, 15, 118, 110)
$white = [System.Drawing.Color]::White

function Fill-RoundRect($g, $brush, $x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  $g.FillPath($brush, $p)
  $p.Dispose()
}

foreach ($n in 16, 32, 48, 128) {
  $bmp = New-Object System.Drawing.Bitmap($n, $n, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  # ตัวเครื่องคิดเลขในกรอบ 24 อยู่ที่ x 4 ถึง 20 และ y 2.5 ถึง 21.5 ขยายให้สูง 94 เปอร์เซ็นต์ของไอคอน แล้ววางกึ่งกลาง
  $s = $n * 0.94 / 19
  $ox = ($n - 16 * $s) / 2 - 4 * $s
  $oy = ($n - 19 * $s) / 2 - 2.5 * $s
  $bt = New-Object System.Drawing.SolidBrush($teal)
  $bw = New-Object System.Drawing.SolidBrush($white)
  Fill-RoundRect $g $bt ($ox + 4 * $s) ($oy + 2.5 * $s) (16 * $s) (19 * $s) (3.2 * $s)
  Fill-RoundRect $g $bw ($ox + 7 * $s) ($oy + 5.5 * $s) (10 * $s) (4.2 * $s) (1.2 * $s)
  $r = 1.25 * $s
  foreach ($c in @(@(8.6, 13.3), @(12, 13.3), @(15.4, 13.3), @(8.6, 17.3), @(12, 17.3), @(15.4, 17.3))) {
    $g.FillEllipse($bw, $ox + $c[0] * $s - $r, $oy + $c[1] * $s - $r, 2 * $r, 2 * $r)
  }
  $file = Join-Path $out "icon-$n.png"
  $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $bt.Dispose(); $bw.Dispose(); $g.Dispose(); $bmp.Dispose()
  Write-Output "icon-$n.png"
}
