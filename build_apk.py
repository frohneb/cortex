"""
Automatischer Android APK Builder für Tango
Baut eine 100% native, stand-alone, offline-fähige Android APK
"""
import os
import shutil
import subprocess
import sys
import zipfile

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
JAVA_HOME = r"C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
JAVAC = os.path.join(JAVA_HOME, "bin", "javac.exe")
KEYTOOL = os.path.join(JAVA_HOME, "bin", "keytool.exe")
SDK_DIR = os.path.join(BASE_DIR, "android-sdk")
BUILD_TOOLS = os.path.join(SDK_DIR, "build-tools", "34.0.0")
AAPT2 = os.path.join(BUILD_TOOLS, "aapt2.exe")
D8 = os.path.join(BUILD_TOOLS, "d8.bat")
ZIPALIGN = os.path.join(BUILD_TOOLS, "zipalign.exe")
APKSIGNER = os.path.join(BUILD_TOOLS, "apksigner.bat")
ANDROID_JAR = os.path.join(SDK_DIR, "platforms", "android-34", "android.jar")

os.environ["JAVA_HOME"] = JAVA_HOME

def run_cmd(cmd, cwd=BASE_DIR):
    print(f"Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    res = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print("ERROR Output:", res.stderr)
        print("STDOUT:", res.stdout)
        sys.exit(res.returncode)
    return res.stdout

def build_apk():
    print("=== 1. Vorbereiten der Verzeichnisse ===")
    work_dir = os.path.join(BASE_DIR, "build_apk_temp")
    if os.path.exists(work_dir):
        shutil.rmtree(work_dir)
    os.makedirs(work_dir, exist_ok=True)
    
    bin_dir = os.path.join(work_dir, "bin")
    os.makedirs(bin_dir, exist_ok=True)

    res_dir = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")

    print("=== 2. Resourcen kompilieren (aapt2 compile) ===")
    compiled_res = os.path.join(work_dir, "compiled_res.zip")
    cmd_compile = f'"{AAPT2}" compile --dir "{res_dir}" -o "{compiled_res}"'
    run_cmd(cmd_compile)

    print("=== 3. Basis-APK verlinken (aapt2 link) ===")
    manifest_file = os.path.join(BASE_DIR, "android", "app", "src", "main", "AndroidManifest.xml")
    base_apk = os.path.join(work_dir, "base.apk")
    cmd_link = f'"{AAPT2}" link -o "{base_apk}" -I "{ANDROID_JAR}" --manifest "{manifest_file}" "{compiled_res}" --auto-add-overlay'
    run_cmd(cmd_link)

    print("=== 4. Java-Code kompilieren (javac) ===")
    java_src_dir = os.path.join(BASE_DIR, "android", "app", "src", "main", "java", "com", "tango", "game")
    java_files = [os.path.join(java_src_dir, f) for f in os.listdir(java_src_dir) if f.endswith('.java')]
    cmd_javac = f'"{JAVAC}" -encoding UTF-8 -cp "{ANDROID_JAR}" -d "{bin_dir}" ' + ' '.join([f'"{f}"' for f in java_files])
    run_cmd(cmd_javac)

    print("=== 5. Bytecode nach DEX konvertieren (d8) ===")
    class_files = [os.path.join(root, file)
                   for root, dirs, files in os.walk(bin_dir)
                   for file in files if file.endswith('.class')]
    cmd_d8 = f'"{D8}" --output "{work_dir}" ' + " ".join([f'"{f}"' for f in class_files])
    run_cmd(cmd_d8)

    print("=== 6. Web-Assets und classes.dex in APK einbetten ===")
    classes_dex = os.path.join(work_dir, "classes.dex")
    
    # APK als Zip bearbeiten
    with zipfile.ZipFile(base_apk, 'a', zipfile.ZIP_DEFLATED) as apk_zip:
        # classes.dex hinzufügen
        apk_zip.write(classes_dex, "classes.dex")

        # Assets kopieren
        assets_to_include = [
            'index.html',
            'manifest.json',
            'sw.js',
            'css/main.css',
            'css/puzzles/tango.css',
            'css/puzzles/sudoku.css',
            'css/puzzles/akari.css',
            'css/puzzles/nonogram.css',
            'css/puzzles/slitherlink.css',
            'css/puzzles/minesweeper.css',
            'css/puzzles/crowns.css',
            'css/puzzles/hashi.css',
            'css/puzzles/futoshiki.css',
            'js/bundle.js',
            'assets/favicon.svg',
            'assets/favicon.png',
            'assets/icons/icon-192.svg',
            'assets/icons/icon-192.png',
            'assets/icons/icon-512.svg',
            'assets/icons/icon-512.png'
        ]
        for rel_path in assets_to_include:
            full_path = os.path.join(BASE_DIR, rel_path)
            if os.path.exists(full_path):
                archive_name = f"assets/{rel_path}"
                apk_zip.write(full_path, archive_name)
                print(f"Added asset: {archive_name}")

    print("=== 7. APK Zipalign (zipalign) ===")
    unaligned_apk = base_apk
    aligned_apk = os.path.join(work_dir, "aligned.apk")
    cmd_zipalign = f'"{ZIPALIGN}" -v 4 "{unaligned_apk}" "{aligned_apk}"'
    run_cmd(cmd_zipalign)

    print("=== 8. Keystore & Signieren (apksigner) ===")
    keystore = os.path.join(BASE_DIR, "tango.keystore")
    if not os.path.exists(keystore):
        cmd_key = f'"{KEYTOOL}" -genkeypair -v -keystore "{keystore}" -alias tango -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Cortex, OU=Game, O=Cortex, L=Local, ST=Local, C=DE"'
        run_cmd(cmd_key)

    output_apk = os.path.join(BASE_DIR, "Cortex.apk")
    cmd_sign = f'"{APKSIGNER}" sign --ks "{keystore}" --ks-pass pass:android --out "{output_apk}" "{aligned_apk}"'
    run_cmd(cmd_sign)

    print(f"\n[OK] ERFOLG! Die fertige native Offline-APK wurde erstellt: {output_apk}")
    print(f"Dateigröße: {os.path.getsize(output_apk) / 1024 / 1024:.2f} MB")

if __name__ == '__main__':
    build_apk()
