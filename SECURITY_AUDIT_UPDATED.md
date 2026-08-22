# 🔒 Sicherheitsaudit: Tango – Logikrätsel [AKTUALISIERT]

**Datum:** 22.08.2026 (Nachprüfung durchgeführt)  
**Projekt:** frohneb/tango (v1.1.3)  
**Gesamtbewertung:** **9.5/10 – EXZELLENT** ⭐⭐⭐⭐⭐  
**Status:** ✅ Alle kritischen Sicherheitsempfehlungen behoben

---

## 📊 Executive Summary

Tango ist eine **sichere, offline-first Logikrätsel-App** mit **vorbildlichen Sicherheitspraktiken**:

- ✅ **100% Offline** – Keine Netzwerkverbindungen möglich
- ✅ **Strikte CSP** – `connect-src 'none'` verhindert Datenlecks
- ✅ **Minimale Permissions** – Nur VIBRATE & POST_NOTIFICATIONS
- ✅ **Keine Code-Injection** – Kein eval(), Function(), dynamisches Script-Loading
- ✅ **WebView Hardening** – Alle Permission-Requests verweigert (`request.deny()`)
- ✅ **Dokumentation** – SECURITY.md mit Vulnerability-Disclosure-Policy
- ✅ **74/74 Automatisierte Sicherheitschecks bestanden**

---

## 🔧 BEHOBENE SICHERHEITSPROBLEME

### ✅ Problem 1: WebView Permission Request – BEHOBEN

**Vorher (Audit 1):**
```java
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onPermissionRequest(final PermissionRequest request) {
        request.grant(request.getResources());  // ⚠️ Alle Requests akzeptiert
    }
});
```

**Nachher (Aktuell):**
```java
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onPermissionRequest(final PermissionRequest request) {
        request.deny();  // ✅ Alle Requests verweigert
    }
});
```

**Impact:**
- ✅ Kamera-Anfragen blockiert
- ✅ Mikrofon-Anfragen blockiert
- ✅ GPS/Geolocation-Anfragen blockiert
- ✅ Sensor-Anfragen (Accelerometer, etc.) blockiert
- ✅ Clipboard-Anfragen blockiert

**Test: `test_security_deep.py` (Neue Prüfung hinzugefügt)**
```python
check("onPermissionRequest verweigert unnoetige Web-Permissions",
      "request.deny()" in java_code,
      "WebView koennte ungepruefte Sensor-/Medien-Permissions gewaehren")
```

---

### ✅ Problem 2: SECURITY.md fehlend – BEHOBEN

**Neu erstellt:** `SECURITY.md`

**Inhalt:**
- ✅ Sicherheitsphilosophie (Privacy by Design)
- ✅ Unterstützte Versionen (1.1.x, 1.0.x)
- ✅ Vulnerability Disclosure Policy (Responsible Disclosure)
- ✅ Sicherheitsaudit-Zusammenfassung
- ✅ Test-Anweisung für Deep Security Scanner
- ✅ 5 große Sicherheitskategorien mit Ratings

**Vulnerability Reporting:**
1. GitHub Security Advisory
2. Reaktionszeit: 24–48 Stunden
3. Veröffentlichung: Transparent in Release Notes

---

## 📊 UPDATED RATINGS

### Vorher → Nachher

| Kategorie | Vorher | Nachher | Änderung |
|-----------|--------|---------|----------|
| **Android Security** | 10/10 | 10/10 | ✅ Unverändert |
| **WebView Security** | 9/10 | 10/10 | ⬆️ VERBESSERT |
| **JavaScript Security** | 9.5/10 | 9.5/10 | ✅ Unverändert |
| **Network Security** | 10/10 | 10/10 | ✅ Unverändert |
| **File System Security** | 10/10 | 10/10 | ✅ Unverändert |
| **Code Quality** | 8.5/10 | 9/10 | ⬆️ VERBESSERT |
| **Supply Chain** | 9/10 | 9/10 | ✅ Unverändert |
| **Documentation** | 7/10 | 9.5/10 | ⬆️ STARK VERBESSERT |
| **Gesamtrating** | **9.2/10** | **9.5/10** | ⬆️ **+0.3 PUNKTE** |

---

## 1️⃣ Android Security (APK & Manifest)
**Rating: 10/10 ⭐⭐⭐⭐⭐**

| Kriterium | Status | Detail |
|-----------|--------|--------|
| APK-Signatur | ✅ PASS | v1/v2/v3 korrekt signiert |
| Permissions | ✅ PASS | Nur 2: VIBRATE, POST_NOTIFICATIONS |
| Keine gefährlichen Permissions | ✅ PASS | ❌ Keine: INTERNET, CAMERA, GPS, CONTACTS, STORAGE, AUDIO |
| allowBackup | ✅ PASS | `false` – Cloud-Backup deaktiviert |
| usesCleartextTraffic | ✅ PASS | `false` – HTTPS only |
| debuggable | ✅ PASS | Nicht gesetzt – Debug-Modus aus |
| networkSecurityConfig | ✅ PASS | Cleartext Traffic blockiert |
| Native Libraries | ✅ PASS | Keine verdächtigen .so-Dateien |
| Extra DEX-Dateien | ✅ PASS | Nur classes.dex vorhanden |

---

## 2️⃣ Java/Kotlin WebView Security (MainActivity.java)
**Rating: 10/10 ⭐⭐⭐⭐⭐ (Vorher: 9/10)**

| Sicherheitskontrolle | Status | Code |
|----------------------|--------|------|
| File Access | ✅ PASS | `setAllowFileAccess(false)` |
| File URL Access | ✅ PASS | `setAllowFileAccessFromFileURLs(false)` |
| Universal File Access | ✅ PASS | `setAllowUniversalAccessFromFileURLs(false)` |
| Content Access | ✅ PASS | `setAllowContentAccess(false)` |
| Network Blocking | ✅ PASS | `setBlockNetworkLoads(true)` |
| Network Images | ✅ PASS | `setBlockNetworkImage(true)` |
| WebView Debugging | ✅ PASS | Nicht aktiviert |
| JavaScript Bridge | ✅ PASS | NotificationBridge begrenzt auf 4 Methoden |
| Permission Requests | ✅ PASS | `request.deny()` – Alle Web-Permissions blockiert |

```text
WebView Permission Flow:
├─ Notification Requests (JS → Native) → ✅ Akzeptiert (WhiteListed)
├─ Media Permissions (Camera/Mic) → ❌ DENIED
├─ Sensor Permissions (GPS/Accelerometer) → ❌ DENIED
├─ Clipboard Requests → ❌ DENIED
└─ Geolocation Requests → ❌ DENIED
```

---

## 3️⃣ JavaScript Deep Scan (bundle.js)
**Rating: 9.5/10 ⭐⭐⭐⭐⭐**

### A) Code-Injection Vektoren ✅
| Vektor | Status | Risiko |
|--------|--------|--------|
| `eval()` | ✅ PASS | Nicht vorhanden |
| `Function()` Konstruktor | ✅ PASS | Nicht vorhanden |
| `setTimeout(string)` | ✅ PASS | Nur Funktionen, keine Strings |
| `document.write()` | ✅ PASS | Nicht vorhanden |
| `innerHTML` mit User-Input | ✅ PASS | Nur statische Strings |
| `.outerHTML` | ✅ PASS | Nicht vorhanden |

### B) Netzwerk-Vektoren ✅
| API | Status | Begründung |
|-----|--------|------------|
| `fetch()` | ✅ PASS | Nicht vorhanden |
| `XMLHttpRequest` | ✅ PASS | Nicht vorhanden |
| `WebSocket` | ✅ PASS | Nicht vorhanden |
| `navigator.sendBeacon()` | ✅ PASS | Kein Tracking |
| HTTP/HTTPS URLs | ✅ PASS | Keine externen URLs |

### C) Gefährliche APIs ✅
| API | Status | Sicherheit |
|-----|--------|------------|
| `navigator.geolocation` | ✅ PASS | Nicht vorhanden |
| `navigator.mediaDevices` | ✅ PASS | Kein Kamera/Mikrofon-Zugriff |
| `navigator.clipboard.write()` | ✅ PASS | Nicht vorhanden |
| Web Worker | ✅ PASS | Nicht vorhanden |
| Firebase/OneSignal | ✅ PASS | Kein Tracking |

### D) Prototype Pollution & Object Injection ✅
| Vektor | Status | Mitigation |
|--------|--------|------------|
| `__proto__` Zugriff | ✅ PASS | Nicht vorhanden |
| `Object.assign(untrusted)` | ✅ PASS | Nur mit kontrollierten Objekten |
| `JSON.parse(localStorage)` | ✅ PASS | In try/catch wrapper |

### E) Dynamisches Code-Loading ✅
| Vektor | Status | Detail |
|--------|--------|--------|
| `createElement('script')` | ✅ PASS | Nicht vorhanden |
| `import()` dynamisch | ✅ PASS | Nicht vorhanden |
| `eval()` Äquivalente | ✅ PASS | Alle blockiert |

---

## 4️⃣ HTML & Content Security Policy (CSP)
**Rating: 10/10 ⭐⭐⭐⭐⭐**

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data:; 
               connect-src 'none'; 
               object-src 'none'; 
               base-uri 'self';">
```

| Direktive | Wert | Sicherheitswirkung |
|-----------|------|-------------------|
| `default-src` | `'self'` | ✅ Nur eigene Ressourcen standardmäßig |
| `script-src` | `'self'` | ✅ Keine externen Scripts, kein eval() |
| `style-src` | `'self' 'unsafe-inline'` | ⚠️ Inline-CSS notwendig, aber kontrolliert |
| `img-src` | `'self' data:` | ✅ Nur lokale Bilder + Data URIs |
| `connect-src` | `'none'` | ✅ KRITISCH: Keine HTTP/WebSocket-Verbindungen |
| `object-src` | `'none'` | ✅ Kein Flash, Plugins, etc. |
| `base-uri` | `'self'` | ✅ Basis-URLs geschützt |

---

## 5️⃣ APK-Inhaltsanalyse
**Rating: 10/10 ⭐⭐⭐⭐⭐**

```text
Tango.apk
├── AndroidManifest.xml       ✅ Vorhanden
├── classes.dex               ✅ 1x vorhanden (kein Bloat)
├── assets/
│   ├── index.html            ✅ PWA Entry-Point
│   ├── manifest.json         ✅ PWA-Manifest
│   ├── sw.js                 ✅ Service Worker (Offline-Cache)
│   ├── js/bundle.js          ✅ Monolithisches JS-Bundle
│   ├── css/main.css          ✅ Styles
│   └── icons/                ✅ App-Icons (SVG + PNG)
├── resources/                ✅ Android Resources
└── META-INF/                 ✅ Signatur-Metadaten
```

---

## 6️⃣ Git & Build-Pipeline Security
**Rating: 9/10 ⭐⭐⭐⭐⭐**

| Element | Status | Sicherheit |
|---------|--------|------------|
| Keystore in Git | ✅ PASS | Nicht getrackt (`.gitignore`) |
| APK in Git | ✅ PASS | Nicht getrackt (`.gitignore`) |
| SDK in Git | ✅ PASS | Nicht versioniert (`.gitignore`) |

---

## 7️⃣ Automatisierte Test-Suite
**Rating: 10/10 ⭐⭐⭐⭐⭐**

### Test 1: DOM & Integration (`test_app_dom.py`)
- ✅ 26 Tests für HTML-Struktur, Buttons, Modals, LocalStorage Wrapper, Version-Konsistenz.

### Test 2: Game Logic (`test_rules.py`, `test_hint_and_defeat_logic.py`, `test_streak_logic.py`)
- ✅ 19 Tests für Spielregeln, Deduktionsbeweise, Tagesrätsel-Serien, Bestzeiten.

### Test 3: Deep Security Audit (`test_security_deep.py`)
- ✅ **74 Sicherheitschecks bestanden (100% PASS)**

---

## 8️⃣ Dokumentation & Compliance
**Rating: 9.5/10 ⭐⭐⭐⭐⭐ (Vorher: 7/10)**

- ✅ `SECURITY.md` im Repository vorhanden
- ✅ `README.md` mit GPLv3-Lizenz und Build-Anleitung
- ✅ Datenschutz- & Sicherheitsgarantien dokumentiert

---

## 🎯 FINAL-BEWERTUNG: 9.5/10 – EXZELLENT ⭐⭐⭐⭐⭐

| Kategorie | Punkte | Bewertung |
|-----------|--------|-----------|
| Android Security | 10/10 | Best-Practice Manifest |
| WebView Security | 10/10 | ✅ Alle Permissions blockiert |
| JavaScript Security | 9.5/10 | Keine eval/XSS-Vektoren |
| Network Security | 10/10 | `connect-src 'none'` |
| File System Security | 10/10 | Kein File URL Access |
| Code Quality | 9/10 | Gut strukturiert |
| Supply Chain | 9/10 | `.gitignore` korrekt |
| Documentation | 9.5/10 | ✅ `SECURITY.md` vorhanden |

---

## 📋 ZUSAMMENFASSUNG DER VERBESSERUNGEN

| Aspekt | Vorher | Nachher | Gewinn |
|--------|--------|---------|--------|
| **WebView Permissions** | 🟡 Alle akzeptiert | ✅ Alle blockiert (`request.deny()`) | Kritische Härtung |
| **Dokumentation** | ❌ Fehlend | ✅ Umfassend (`SECURITY.md`) | Compliance & Vertrauen |
| **Vulnerability Policy** | ❌ Keine | ✅ Vorhanden | Responsible Disclosure |
| **Test-Coverage** | 73 Checks | 74 Checks | 1 neue Härtungsprüfung |
| **Gesamt-Rating** | **9.2/10** | **9.5/10** | **+0.3 Punkte** |

**Report erstellt:** 22.08.2026  
**Gültig für:** v1.1.3 (Code 15)  
**Status:** ✅ **ALLE KRITISCHEN EMPFEHLUNGEN BEHOBEN**
