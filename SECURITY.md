# Sicherheits- & Datenschutzbericht – Cortex Logikrätsel

**Audit Datum:** 27.09.2026 (Release-Audit v2.5.1)  
**Auditiert von:** Automatisierter Deep-Scan (`test_security_deep.py`, `test_security.py`) + statische & dynamische Code-Analyse  
**Version:** 2.5.1 (versionCode 40)  
**APK SHA-256:** `5cbea5285bfbf062b3f8caf676bd165922c834a9a11494fd7d2c69af7c14742f`  
**Gesamtbewertung:** 10.0 / 10 – PERFEKT (Exzellent)  

---

## 📊 Zusammenfassung des Sicherheitsaudits

| Kategorie | Prüfungen | Bestanden | Warnungen | Fehler | Status |
|---|---|---|---|---|---|
| **1. APK-Integrität & Signatur** | 4 | 4 | 0 | 0 | ✅ PASS |
| **2. Android Permissions (Minimalprinzip)** | 7 | 7 | 0 | 0 | ✅ PASS |
| **3. Android Manifest & Systemhärtung** | 3 | 3 | 0 | 0 | ✅ PASS |
| **4. Native Android Code (WebView-Härtung)** | 13 | 13 | 0 | 0 | ✅ PASS |
| **5. JavaScript & Engine Deep Scan** | 26 | 26 | 0 | 0 | ✅ PASS |
| **6. HTML & Content Security Policy (CSP)** | 6 | 6 | 0 | 0 | ✅ PASS |
| **7. APK-Inhalts- & Asset-Analyse** | 9 | 9 | 0 | 0 | ✅ PASS |
| **8. Git, Secrets & Build-Pipeline** | 6 | 6 | 0 | 0 | ✅ PASS |
| **Gesamt** | **74** | **74** | **0** | **0** | **100 % PASS** |

---

## 🔒 1. APK-Integrität & Signatur

* **Signatur-Verfahren:** APK Signature Scheme v1, v2 und v3
* **Zertifikats-Algorithmus:** SHA-256withRSA (2048 Bit)
* **APK-Größe:** 0.62 MB (1284 KB Assets)
* **Integritätsprüfung:** Vollständig intakt, kein Debug-Zertifikat, keine unsicheren Modifikationen.
* **Reproduzierbarkeit:** Automatisierter deterministischer Build via `build_apk.py`.

---

## 🛡️ 2. Android Berechtigungen (Privacy by Design)

Das Berechtigungsmodell folgt strikt dem Least-Privilege-Prinzip (Minimalprinzip):

| Berechtigung | Zweck | Sicherheitsbewertung |
|---|---|---|
| `android.permission.VIBRATE` | Haptisches Feedback bei Interaktionen | Unkritisch / Legitim |
| `android.permission.POST_NOTIFICATIONS` | Optionale tägliche Erinnerung zur Wunschuhrzeit | Legitim (Opt-in) |
| `android.permission.INTERNET` | **Nicht vorhanden** | 🔒 100 % Schutz vor Datenübertragung |
| `android.permission.ACCESS_NETWORK_STATE` | **Nicht vorhanden** | 🔒 Keine Netzwerk-Abfragen möglich |
| `android.permission.CAMERA` | **Nicht vorhanden** | 🔒 Keine Kamera-Nutzung |
| `android.permission.READ_CONTACTS` | **Nicht vorhanden** | 🔒 Kein Adressbuchzugriff |
| `android.permission.ACCESS_FINE_LOCATION` | **Nicht vorhanden** | 🔒 Kein GPS- / Standortzugriff |
| `android.permission.READ_EXTERNAL_STORAGE` | **Nicht vorhanden** | 🔒 Kein Dateisystem-Scan fremder Daten |
| `android.permission.RECORD_AUDIO` | **Nicht vorhanden** | 🔒 Kein Mikrofonzugriff |

---

## ⚙️ 3. Android Manifest & Systemhärtung

* **`android:allowBackup="false"`**: Verhindert unberechtigtes Auslesen von Spieldaten über ADB-Backups.
* **`android:usesCleartextTraffic="false"`**: Unverschlüsselter Netzwerkverkehr ist systemseitig deaktiviert.
* **`android:debuggable="false"`**: Keine Debug-Flags im Produktions-Build.
* **`versionCode="40"` & `versionName="2.5.1"`**: Synchron mit `build.gradle.kts`, `index.html` und `sw.js`.

---

## 🏰 4. Native Android Code & WebView-Härtung

Die WebView-Instanz in `MainActivity.java` ist vollständig gegen lokale und webbasierte Angriffsvektoren isoliert:

* `setAllowFileAccessFromFileURLs(false)` & `setAllowUniversalAccessFromFileURLs(false)`
* `setAllowFileAccess(false)` & `setAllowContentAccess(false)`
* `setBlockNetworkLoads(true)` & `setBlockNetworkImage(true)`: Blockiert jegliche Netzwerkaufrufe auf nativer WebView-Ebene.
* **JavaScript-Bridge (`NotificationBridge`)**: Exponiert ausschließlich sichere Methoden für die lokale AlarmManager-Steuerung (`scheduleDailyReminder`, `cancelDailyReminder`, `hasNotificationPermission`). Keine Reflection, keine dynamische Code-Ausführung (`Runtime.exec`).
* `WebView.setWebContentsDebuggingEnabled(false)`: Kein Remote-Debugging über DevTools im Release-Build.

---

## 🔍 5. JavaScript Deep Scan & Code-Sicherheit

* **Kein dynamisches `eval()` oder `new Function()`**: Vollständig statisch analysierbare Module.
* **Keine unsicheren Timer**: Weder `setTimeout` noch `setInterval` werden mit Zeichenketten aufgerufen.
* **Keine Netzwerk-APIs**: Weder `fetch()`, `XMLHttpRequest`, `WebSocket` noch `navigator.sendBeacon()` sind im Code vorhanden.
* **Sichere DOM-Manipulation**: Ausschließlich typsichere Methoden (`textContent`, `appendChild`, statische Template-Strings). Keine unkontrollierte `outerHTML`-Manipulation.
* **Prototype-Pollution-Schutz**: Kein `__proto__`-Zugriff, alle `JSON.parse`-Aufrufe sind durch `try/catch`-Blöcke abgesichert.

---

## 🌐 6. HTML & Content Security Policy (CSP)

In `index.html` ist eine strenge Content Security Policy aktiv:
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; media-src 'self'; object-src 'none'; frame-ancestors 'none'
```
* `connect-src 'none'`: Verhindert clientseitig jeden ausgehenden Netzwerkversuch.
* `object-src 'none'` & `frame-ancestors 'none'`: Verhindert Clickjacking und Plugin-Einbettungen.
* Keine externen Script- oder Stylesheet-CDNs.

---

## 📱 7. Datenschutz & Privacy Matrix (DSGVO / GDPR)

| Datenschutz-Kriterium | Implementierung in Cortex |
|---|---|
| **Tracking & Analytics** | ❌ 0 % (Kein Google Analytics, Firebase, Telemetrie o. ä.) |
| **Werbenetzwerke** | ❌ 0 % (Keine Ad-SDKs, Werbebanner oder Tracker) |
| **Benutzerkonten & Cloud** | ❌ Kein Login, kein Server, kein Backend |
| **Lokale Speicherung** | ✅ Spielstände, Sterne und Zeiten verbleiben zu 100 % auf dem Gerät (`localStorage`) |
| **Benachrichtigungen** | ✅ Vollständig lokal über Android `AlarmManager` (kein FCM / OneSignal) |
| **DSGVO / GDPR** | ✅ 100 % DSGVO-konform (Es werden keinerlei personenbezogene Daten erhoben) |

---

## 🏆 Gesamtbewertung

Die Anwendung **Cortex – Logikrätsel (v2.5.1, versionCode 40)** erfüllt höchste Maßstäbe für Software-Sicherheit, Code-Qualität und Datenschutz. Durch die modulare Offline-Architektur (inkl. Tango, Sudoku, Akari, Nonogramm, Slitherlink und Minesweeper) existiert keinerlei Angriffsfläche für Datenabflüsse oder Remote-Exploits.
