"""
Sicherheitsaudit der kompilierten Tango.apk
Prüft Permissions, Manifest-Flags und APK-Signatur.
"""
import os
import sys
import subprocess
import zipfile
import xml.etree.ElementTree as ET

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
APK_PATH = os.path.join(BASE_DIR, "Tango.apk")
JAVA_HOME = r"C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
BUILD_TOOLS = os.path.join(BASE_DIR, "android-sdk", "build-tools", "34.0.0")
AAPT = os.path.join(BUILD_TOOLS, "aapt.exe")
APKSIGNER = os.path.join(BUILD_TOOLS, "apksigner.bat")

os.environ["JAVA_HOME"] = JAVA_HOME

errors = []
passes = []

def check(name, condition, detail=""):
    if condition:
        passes.append(f"  [PASS] {name}")
    else:
        errors.append(f"  [FAIL] {name}: {detail}")

print("=" * 60)
print("SICHERHEITSAUDIT: Tango.apk")
print("=" * 60)

# 1. APK existiert
check("APK-Datei existiert", os.path.exists(APK_PATH), "Tango.apk nicht gefunden")

# 2. APK-Signatur pruefen
if os.path.exists(APK_PATH):
    res = subprocess.run(
        f'"{APKSIGNER}" verify "{APK_PATH}"',
        shell=True, capture_output=True, text=True
    )
    check("APK-Signatur gueltig", res.returncode == 0, res.stderr.strip())

# 3. Permissions pruefen (muss 0 sein)
if os.path.exists(APK_PATH):
    res = subprocess.run(
        f'"{AAPT}" dump permissions "{APK_PATH}"',
        shell=True, capture_output=True, text=True
    )
    lines = [l for l in res.stdout.strip().split('\n') if 'uses-permission' in l.lower()]
    dangerous = [l for l in lines if 'vibrate' not in l.lower() and 'post_notifications' not in l.lower()]
    check("Keine gefaehrlichen Android-Permissions (nur VIBRATE und POST_NOTIFICATIONS erlaubt)", len(dangerous) == 0,
          f"Gefundene Permissions: {dangerous}")

# 4. allowBackup pruefen
if os.path.exists(APK_PATH):
    res = subprocess.run(
        f'"{AAPT}" dump xmltree "{APK_PATH}" AndroidManifest.xml',
        shell=True, capture_output=True, text=True
    )
    manifest_dump = res.stdout
    check("allowBackup=false", 'allowBackup' not in manifest_dump or '0x0' in manifest_dump.split('allowBackup')[1][:30],
          "allowBackup ist nicht auf false gesetzt")

# 5. Quellcode-Checks
print("\n--- Quellcode-Sicherheit ---")

java_path = os.path.join(BASE_DIR, "android", "app", "src", "main", "java",
                         "com", "tango", "game", "MainActivity.java")
if os.path.exists(java_path):
    java_code = open(java_path, 'r', encoding='utf-8').read()
    check("AllowFileAccessFromFileURLs = false",
          "setAllowFileAccessFromFileURLs(false)" in java_code,
          "AllowFileAccessFromFileURLs ist nicht auf false gesetzt")
    check("AllowUniversalAccessFromFileURLs = false",
          "setAllowUniversalAccessFromFileURLs(false)" in java_code,
          "AllowUniversalAccessFromFileURLs ist nicht auf false gesetzt")
    check("AllowFileAccess = false",
          "setAllowFileAccess(false)" in java_code,
          "AllowFileAccess ist nicht auf false gesetzt")
    check("BlockNetworkLoads = true",
          "setBlockNetworkLoads(true)" in java_code,
          "BlockNetworkLoads ist nicht auf true gesetzt")
    check("BlockNetworkImage = true",
          "setBlockNetworkImage(true)" in java_code,
          "BlockNetworkImage ist nicht auf true gesetzt")
    check("Sichere NotificationBridge (nur Notification-Methoden)",
          "NotificationBridge" in java_code and "Runtime.getRuntime" not in java_code,
          "Unsichere Bridge-Methoden in MainActivity")

# 6. JS-Quellcode-Checks
print("\n--- JavaScript-Sicherheit ---")
bundle_path = os.path.join(BASE_DIR, "js", "bundle.js")
if os.path.exists(bundle_path):
    js_code = open(bundle_path, 'r', encoding='utf-8').read()
    check("Kein eval()", "eval(" not in js_code, "eval() gefunden")
    check("Kein document.write()", "document.write(" not in js_code, "document.write() gefunden")
    check("Kein fetch()", "fetch(" not in js_code.replace("event.respondWith", "").replace("caches", ""),
          "fetch() Aufruf gefunden")
    check("Kein XMLHttpRequest", "XMLHttpRequest" not in js_code, "XMLHttpRequest gefunden")
    check("Keine externen URLs",
          "http://" not in js_code and "https://" not in js_code,
          "Externe URL im Bundle gefunden")

# 7. APK-Inhalt pruefen
print("\n--- APK-Inhaltsanalyse ---")
if os.path.exists(APK_PATH):
    with zipfile.ZipFile(APK_PATH, 'r') as z:
        names = z.namelist()
        check("classes.dex vorhanden", "classes.dex" in names, "Kein classes.dex in APK")
        check("assets/index.html vorhanden", "assets/index.html" in names, "index.html fehlt")
        check("assets/js/bundle.js vorhanden", "assets/js/bundle.js" in names, "bundle.js fehlt")
        check("assets/css/main.css vorhanden", "assets/css/main.css" in names, "main.css fehlt")
        # Keine verdaechtigen Dateien
        suspicious = [n for n in names if n.endswith(('.so', '.dex') ) and n != 'classes.dex']
        check("Keine verdaechtigen nativen Bibliotheken",
              len(suspicious) == 0, f"Verdaechtig: {suspicious}")

# 8. Keystore nicht in Git
print("\n--- Git-Sicherheit ---")
res = subprocess.run("git ls-files tango.keystore", shell=True, capture_output=True, text=True, cwd=BASE_DIR)
check("Keystore nicht in Git versioniert",
      res.stdout.strip() == "", "tango.keystore ist in Git tracked!")

res = subprocess.run("git ls-files Tango.apk", shell=True, capture_output=True, text=True, cwd=BASE_DIR)
check("APK nicht in Git versioniert",
      res.stdout.strip() == "", "Tango.apk ist in Git tracked!")

# Ergebnis
print("\n" + "=" * 60)
print("ERGEBNIS")
print("=" * 60)
for p in passes:
    print(p)
if errors:
    print()
    for e in errors:
        print(e)
    print(f"\n[FEHLER] {len(errors)} Problem(e) gefunden!")
    sys.exit(1)
else:
    print(f"\n[OK] Alle {len(passes)} Sicherheitschecks bestanden!")
    sys.exit(0)
