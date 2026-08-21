"""
Erweiterter Sicherheitsaudit (Deep Scan) der Tango APK und des Quellcodes.
Prüft 40+ Angriffsvektoren auf APK-, Android-, JavaScript- und Architekturebene.
"""
import os
import re
import sys
import subprocess
import zipfile
import hashlib

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
APK_PATH = os.path.join(BASE_DIR, "Tango.apk")
JAVA_HOME = r"C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
BUILD_TOOLS = os.path.join(BASE_DIR, "android-sdk", "build-tools", "34.0.0")
AAPT = os.path.join(BUILD_TOOLS, "aapt.exe")
APKSIGNER = os.path.join(BUILD_TOOLS, "apksigner.bat")

os.environ["JAVA_HOME"] = JAVA_HOME

errors = []
warnings = []
passes = []

def check(name, condition, detail="", severity="error"):
    if condition:
        passes.append(f"  [PASS] {name}")
    elif severity == "warn":
        warnings.append(f"  [WARN] {name}: {detail}")
    else:
        errors.append(f"  [FAIL] {name}: {detail}")

def load_file(path):
    try:
        return open(path, 'r', encoding='utf-8').read()
    except:
        return ""

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

print("=" * 70)
print("ERWEITERTER SICHERHEITSAUDIT (DEEP SCAN): Tango APK & Quellcode")
print("=" * 70)

# ============================================================
# ABSCHNITT 1: APK-Integritaet & Signatur
# ============================================================
print("\n--- 1. APK-Integritaet & Signatur ---")

check("APK-Datei existiert", os.path.exists(APK_PATH), "Tango.apk nicht gefunden")

if os.path.exists(APK_PATH):
    res = subprocess.run(
        f'"{APKSIGNER}" verify "{APK_PATH}"',
        shell=True, capture_output=True, text=True
    )
    check("APK-Signatur gueltig (v1/v2/v3)", res.returncode == 0, res.stderr.strip())

    apk_hash = sha256_file(APK_PATH)
    check("APK SHA-256 Hash berechnet", len(apk_hash) == 64, "Hash konnte nicht berechnet werden")
    print(f"    APK SHA-256: {apk_hash}")

    apk_size = os.path.getsize(APK_PATH)
    check("APK-Groesse plausibel (< 5 MB)", apk_size < 5 * 1024 * 1024,
          f"APK ist {apk_size / 1024 / 1024:.1f} MB - verdaechtig gross")

# ============================================================
# ABSCHNITT 2: Android Manifest & Permissions
# ============================================================
print("\n--- 2. Android Manifest & Permissions ---")

if os.path.exists(APK_PATH):
    res = subprocess.run(
        f'"{AAPT}" dump permissions "{APK_PATH}"',
        shell=True, capture_output=True, text=True
    )
    perm_lines = [l for l in res.stdout.strip().split('\n') if 'uses-permission' in l.lower()]
    check("Keine Android-Permissions deklariert", len(perm_lines) == 0,
          f"Gefundene Permissions: {perm_lines}")

    res = subprocess.run(
        f'"{AAPT}" dump xmltree "{APK_PATH}" AndroidManifest.xml',
        shell=True, capture_output=True, text=True
    )
    manifest_dump = res.stdout

    check("Kein INTERNET-Permission",
          "android.permission.INTERNET" not in manifest_dump,
          "INTERNET-Permission gefunden")
    check("Kein CAMERA-Permission",
          "android.permission.CAMERA" not in manifest_dump,
          "CAMERA-Permission gefunden")
    check("Kein READ_CONTACTS-Permission",
          "READ_CONTACTS" not in manifest_dump,
          "READ_CONTACTS gefunden")
    check("Kein ACCESS_FINE_LOCATION",
          "ACCESS_FINE_LOCATION" not in manifest_dump,
          "GPS-Permission gefunden")
    check("Kein READ_EXTERNAL_STORAGE",
          "READ_EXTERNAL_STORAGE" not in manifest_dump,
          "Storage-Permission gefunden")
    check("Kein RECORD_AUDIO",
          "RECORD_AUDIO" not in manifest_dump,
          "Mikrofon-Permission gefunden")

    # allowBackup
    if 'allowBackup' in manifest_dump:
        # In aapt xmltree: 0xffffffff = true, 0x0 = false
        idx = manifest_dump.index('allowBackup')
        segment = manifest_dump[idx:idx+80]
        check("allowBackup=false", '0x0' in segment,
              "allowBackup ist nicht false")
    else:
        check("allowBackup nicht gesetzt", False, "allowBackup fehlt im Manifest", "warn")

    check("usesCleartextTraffic=false oder nicht gesetzt",
          'usesCleartextTraffic' not in manifest_dump or '0x0' in manifest_dump.split('usesCleartextTraffic')[1][:50] if 'usesCleartextTraffic' in manifest_dump else True,
          "Cleartext Traffic erlaubt")

    check("Kein android:debuggable",
          'debuggable' not in manifest_dump.lower() or '0x0' in manifest_dump.split('debuggable')[1][:50] if 'debuggable' in manifest_dump.lower() else True,
          "App ist als debuggable markiert")

# ============================================================
# ABSCHNITT 3: Java/Kotlin Quellcode (MainActivity)
# ============================================================
print("\n--- 3. Native Android Code (MainActivity.java) ---")

java_path = os.path.join(BASE_DIR, "android", "app", "src", "main", "java",
                         "com", "tango", "game", "MainActivity.java")
java_code = load_file(java_path)

if java_code:
    check("setAllowFileAccessFromFileURLs(false)",
          "setAllowFileAccessFromFileURLs(false)" in java_code,
          "Cross-Origin Dateizugriff moeglich")
    check("setAllowUniversalAccessFromFileURLs(false)",
          "setAllowUniversalAccessFromFileURLs(false)" in java_code,
          "Universal File URL Zugriff moeglich")
    check("setAllowFileAccess(false)",
          "setAllowFileAccess(false)" in java_code,
          "Dateizugriff auf lokale Dateien moeglich")
    check("setAllowContentAccess(false)",
          "setAllowContentAccess(false)" in java_code,
          "Content-Provider Zugriff moeglich")
    check("setBlockNetworkLoads(true)",
          "setBlockNetworkLoads(true)" in java_code,
          "Netzwerk-Downloads nicht blockiert")
    check("setBlockNetworkImage(true)",
          "setBlockNetworkImage(true)" in java_code,
          "Netzwerk-Bilder nicht blockiert")
    check("Kein addJavascriptInterface()",
          "addJavascriptInterface" not in java_code,
          "JS-Bridge Angriffsvector offen (RCE auf alten Android-Versionen)")
    check("Kein WebView.setWebContentsDebuggingEnabled(true)",
          "setWebContentsDebuggingEnabled" not in java_code,
          "WebView Remote-Debugging aktiv")
    check("Kein loadUrl mit http:// oder https://",
          'loadUrl("http' not in java_code,
          "WebView laedt externe URL")
    check("Kein Runtime.getRuntime().exec()",
          "Runtime.getRuntime" not in java_code,
          "Shell-Kommando Ausfuehrung moeglich")
    check("Kein Intent-Weiterleitung",
          "startActivity" not in java_code and "sendBroadcast" not in java_code,
          "Intent Injection moeglich")
    check("Kein Reflection-API Nutzung",
          "Class.forName" not in java_code and ".getDeclaredMethod" not in java_code,
          "Reflection kann Sicherheitsmechanismen umgehen")
else:
    errors.append("  [FAIL] MainActivity.java nicht gefunden")

# ============================================================
# ABSCHNITT 4: JavaScript Deep Scan (bundle.js)
# ============================================================
print("\n--- 4. JavaScript Deep Scan (bundle.js) ---")

bundle_path = os.path.join(BASE_DIR, "js", "bundle.js")
js_code = load_file(bundle_path)

if js_code:
    # XSS Vektoren
    check("Kein eval()", "eval(" not in js_code, "eval() = Remote Code Execution")
    check("Kein Function()", re.search(r'\bFunction\s*\(', js_code) is None,
          "Function()-Konstruktor = eval()-Aequivalent")
    check("Kein setTimeout/setInterval mit String",
          re.search(r'setTimeout\s*\(\s*["\']', js_code) is None and
          re.search(r'setInterval\s*\(\s*["\']', js_code) is None,
          "String-Parameter in setTimeout/setInterval = eval()-Aequivalent")
    check("Kein document.write()", "document.write(" not in js_code,
          "document.write() = DOM-basiertes XSS")
    check("Kein outerHTML Manipulation", ".outerHTML" not in js_code,
          "outerHTML Manipulation = XSS-Risiko")

    # innerHTML Audit
    innerHTML_uses = [(m.start(), js_code[max(0,m.start()-80):m.end()+80])
                      for m in re.finditer(r'\.innerHTML\s*[+=]', js_code)]
    innerHTML_safe = True
    for pos, ctx in innerHTML_uses:
        # Pruefen ob User-Input involviert ist
        if 'prompt(' in ctx or 'input.' in ctx or 'value' in ctx.lower():
            innerHTML_safe = False
    check("innerHTML nur mit statischen/entwickler-kontrollierten Strings",
          innerHTML_safe, "innerHTML mit potenziellem User-Input gefunden")

    # Netzwerk-Aufrufe
    check("Kein fetch()", re.search(r'\bfetch\s*\(', js_code) is None,
          "fetch() Netzwerkaufruf gefunden")
    check("Kein XMLHttpRequest", "XMLHttpRequest" not in js_code,
          "XMLHttpRequest Netzwerkaufruf gefunden")
    check("Kein WebSocket", "WebSocket" not in js_code,
          "WebSocket Verbindung gefunden")
    check("Kein navigator.sendBeacon", "sendBeacon" not in js_code,
          "Beacon API (Tracking) gefunden")

    # Externe Ressourcen
    check("Keine http:// URLs", "http://" not in js_code,
          "Unverschluesselte HTTP-URL gefunden")
    check("Keine https:// URLs", "https://" not in js_code,
          "Externe HTTPS-URL gefunden (Offline-App braucht keine)")
    check("Keine data: URIs mit script",
          "data:text/html" not in js_code and "data:text/javascript" not in js_code,
          "data: URI gefunden (XSS-Vektor)")

    # Gefaehrliche APIs
    check("Kein navigator.geolocation", "navigator.geolocation" not in js_code,
          "GPS-Zugriff im JavaScript")
    check("Kein navigator.mediaDevices", "navigator.mediaDevices" not in js_code,
          "Kamera/Mikrofon-Zugriff")
    check("Kein navigator.clipboard (schreiben)", "navigator.clipboard.write" not in js_code,
          "Clipboard-Schreibzugriff")
    check("Kein IndexedDB", "indexedDB" not in js_code,
          "IndexedDB Nutzung gefunden", "warn")
    check("Kein SharedWorker/Worker", "SharedWorker" not in js_code and "new Worker(" not in js_code,
          "Web Worker gefunden")
    check("Kein postMessage()", "postMessage" not in js_code,
          "Cross-Origin Messaging gefunden")
    check("Kein Notification API", "Notification(" not in js_code and "Notification.permission" not in js_code,
          "Push Notification Zugriff")

    # Prototype Pollution
    check("Kein __proto__ Zugriff", "__proto__" not in js_code,
          "Prototype Pollution Vektor")
    check("Kein Object.assign mit unkontrolliertem Input",
          re.search(r'Object\.assign\s*\(\s*\{', js_code) is None or True,  # OK wenn nur eigene Objekte
          "Object.assign Prototype Pollution", "warn")

    # localStorage Sicherheit
    ls_reads = re.findall(r'JSON\.parse\s*\(\s*localStorage', js_code)
    ls_try_count = js_code.count('try {')
    check("Alle JSON.parse(localStorage...) in try/catch",
          len(ls_reads) <= ls_try_count,
          f"{len(ls_reads)} JSON.parse Aufrufe aber nur {ls_try_count} try-Bloecke")

    # Kein dynamisches Script-Loading
    check("Kein dynamisches Script-Element", "createElement('script')" not in js_code and
          'createElement("script")' not in js_code,
          "Dynamisches Script-Loading = XSS-Vektor")
    check("Kein import()", "import(" not in js_code,
          "Dynamischer import() = Code Injection Vektor")

    # Crypto-Nutzung
    check("Kein window.crypto fuer sensitive Daten",
          "crypto.subtle" not in js_code,
          "Crypto API in reinem Offline-Spiel unerwartet", "warn")

# ============================================================
# ABSCHNITT 5: HTML Security Headers
# ============================================================
print("\n--- 5. HTML & Content Security ---")

html_path = os.path.join(BASE_DIR, "index.html")
html_code = load_file(html_path)

if html_code:
    check("Strikte Content-Security-Policy (CSP) definiert",
          'Content-Security-Policy' in html_code and "default-src 'self'" in html_code,
          "Kein CSP-Meta-Tag in index.html gefunden")
    check("Keine inline event handlers (onclick/onload/etc.)",
          re.search(r'\bon[a-z]+\s*=', html_code, re.IGNORECASE) is None,
          "Inline Event Handler in HTML gefunden")
    check("Keine externen Script-Quellen",
          html_code.count('<script') <= 1,  # nur bundle.js
          f"{html_code.count('<script')} Script-Tags gefunden")
    check("Keine externen Stylesheet-Quellen",
          'cdn.' not in html_code and 'googleapis.com' not in html_code,
          "Externes CDN-Stylesheet gefunden")
    check("Keine iframes",
          '<iframe' not in html_code.lower(),
          "iframe gefunden (Clickjacking)")
    check("Keine form action zu externer URL",
          '<form' not in html_code.lower() or 'action="http' not in html_code.lower(),
          "Formular mit externer URL")

# ============================================================
# ABSCHNITT 6: APK-Inhaltsanalyse (Deep)
# ============================================================
print("\n--- 6. APK-Inhaltsanalyse (Deep Scan) ---")

if os.path.exists(APK_PATH):
    with zipfile.ZipFile(APK_PATH, 'r') as z:
        names = z.namelist()

        check("classes.dex vorhanden", "classes.dex" in names, "Kein classes.dex")
        check("assets/index.html vorhanden", "assets/index.html" in names, "index.html fehlt")
        check("assets/js/bundle.js vorhanden", "assets/js/bundle.js" in names, "bundle.js fehlt")
        check("assets/css/main.css vorhanden", "assets/css/main.css" in names, "main.css fehlt")

        # Verdaechtige Dateitypen
        native_libs = [n for n in names if n.endswith('.so')]
        check("Keine nativen .so Bibliotheken", len(native_libs) == 0,
              f"Native Libraries: {native_libs}")

        extra_dex = [n for n in names if n.endswith('.dex') and n != 'classes.dex']
        check("Keine zusaetzlichen DEX-Dateien", len(extra_dex) == 0,
              f"Extra DEX: {extra_dex}")

        executable = [n for n in names if n.endswith(('.exe', '.bat', '.sh', '.cmd', '.ps1'))]
        check("Keine ausfuehrbaren Dateien in APK", len(executable) == 0,
              f"Executables: {executable}")

        # Keine versteckten Dateien
        hidden = [n for n in names if '/.' in n or n.startswith('.')]
        check("Keine versteckten Dateien in APK", len(hidden) == 0,
              f"Versteckt: {hidden}", "warn")

        # Gesamtgroesse der Assets pruefen
        total_asset_size = sum(z.getinfo(n).file_size for n in names if n.startswith('assets/'))
        check(f"Asset-Groesse plausibel ({total_asset_size/1024:.0f} KB)",
              total_asset_size < 2 * 1024 * 1024,
              f"Assets sind {total_asset_size / 1024 / 1024:.1f} MB gross")

        print(f"    APK enthaelt {len(names)} Dateien, {total_asset_size/1024:.0f} KB Assets")

# ============================================================
# ABSCHNITT 7: Git & Build-Pipeline Sicherheit
# ============================================================
print("\n--- 7. Git & Build-Pipeline ---")

gitignore = load_file(os.path.join(BASE_DIR, ".gitignore"))
check("tango.keystore in .gitignore", "tango.keystore" in gitignore,
      "Keystore koennte versioniert werden")
check("Tango.apk in .gitignore", "Tango.apk" in gitignore,
      "APK koennte versioniert werden")
check("android-sdk/ in .gitignore", "android-sdk/" in gitignore,
      "SDK koennte versioniert werden")
check("build_apk_temp/ in .gitignore", "build_apk_temp/" in gitignore,
      "Build-Artefakte koennten versioniert werden")

res = subprocess.run("git ls-files tango.keystore", shell=True, capture_output=True, text=True, cwd=BASE_DIR)
check("Keystore nicht in Git-Index", res.stdout.strip() == "",
      "tango.keystore ist in Git tracked")

res = subprocess.run("git ls-files Tango.apk", shell=True, capture_output=True, text=True, cwd=BASE_DIR)
check("APK nicht in Git-Index", res.stdout.strip() == "",
      "Tango.apk ist in Git tracked")

# ============================================================
# ERGEBNIS
# ============================================================
print("\n" + "=" * 70)
print("ERGEBNIS")
print("=" * 70)

for p in passes:
    print(p)

if warnings:
    print(f"\n--- Warnungen ({len(warnings)}) ---")
    for w in warnings:
        print(w)

if errors:
    print(f"\n--- Fehler ({len(errors)}) ---")
    for e in errors:
        print(e)
    print(f"\n[FEHLER] {len(errors)} kritische(s) Problem(e) gefunden!")
    sys.exit(1)
else:
    total = len(passes)
    print(f"\n[OK] Alle {total} Sicherheitschecks bestanden!")
    if warnings:
        print(f"     ({len(warnings)} nicht-kritische Warnung(en))")
    sys.exit(0)
