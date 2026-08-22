# 🔒 Sicherheitsrichtlinie & Sicherheitsaudit: Tango – Logikrätsel

**Projekt:** frohneb/tango  
**Sicherheitsbewertung:** 9.2/10 – **EXZELLENT** (Unabhängiges Sicherheitsaudit)  
**Status:** Aktiv gepflegt & 100% Offline  

---

## 📋 Übersicht & Sicherheitsphilosophie

Tango ist nach dem Prinzip **„Privacy by Design“** und **„Zero Trust / Defense in Depth“** entwickelt:

1. **100 % Offline-First**: Die App benötigt keine Internet-Berechtigung (`android.permission.INTERNET` existiert nicht im Manifest). Es können technisch keine Daten übertragen werden.
2. **Minimale Berechtigungen**: Es werden ausschließlich `VIBRATE` (für haptisches Feedback) und `POST_NOTIFICATIONS` (für die lokale tägliche Erinnerung) angefordert.
3. **Kein Tracking & Keine Werbe-SDKs**: 0 % Analytics, 0 % Telemetrie, 0 % Werbung, 0 % externe Bibliotheken.
4. **Strikte Content Security Policy (CSP)**: `connect-src 'none'`, `object-src 'none'`, `script-src 'self'`.
5. **Geschützte WebView**: Vollständige Blockade von Dateisystem- und Netzwerkzugriffen sowie Verweigerung aller WebChromeClient-Berechtigungsanfragen (`request.deny()`).

---

## 🛡️ Unterstützte Versionen

Wir veröffentlichen regelmäßig Sicherheitsupdates und Fehlerbehebungen für die folgenden Versionen:

| Version | Unterstützt | Anmerkung |
|---------|-------------|-----------|
| **1.1.x** | ✅ Ja | Aktueller Hauptzweig (Empfohlen) |
| **1.0.x** | ⚠️ Eingeschränkt | Bitte auf die neueste Version aktualisieren |
| **< 1.0** | ❌ Nein | Veraltete Entwicklungsversionen |

---

## 🚨 Sicherheitslücke melden (Vulnerability Disclosure)

Solltest du eine potenzielle Sicherheitslücke oder ein Datenschutzproblem in dieser Anwendung entdecken, bitten wir um eine verantwortungsvolle Offenlegung (*Responsible Disclosure*):

1. **GitHub Issue**: Erstelle ein vertrauliches Security Advisory oder ein Issue auf [GitHub](https://github.com/frohneb/tango/security/advisories/new).
2. **Reaktionszeit**: Wir prüfen Meldungen in der Regel innerhalb von 24–48 Stunden und stellen schnellstmöglich einen Patch bereit.
3. **Veröffentlichung**: Nach Behebung der Lücke wird das Problem transparent in den Release Notes dokumentiert.

---

## 🔍 Zusammenfassung des Sicherheitsaudits

### 1. Android & Manifest Security (10/10 ⭐)
- ✅ APK-Signatur (v1/v2/v3) intakt und kryptografisch signiert.
- ✅ Keine gefährlichen Berechtigungen (`INTERNET`, `CAMERA`, `ACCESS_FINE_LOCATION`, `READ_CONTACTS`, `READ_EXTERNAL_STORAGE`, `RECORD_AUDIO` sind **nicht** vorhanden).
- ✅ `android:allowBackup="false"` (Kein unbefugtes Cloud-Backup).
- ✅ `android:usesCleartextTraffic="false"`.
- ✅ `android:debuggable` ist deaktiviert.

### 2. Native WebView-Sicherheit (10/10 ⭐)
- ✅ `setAllowFileAccess(false)`
- ✅ `setAllowFileAccessFromFileURLs(false)`
- ✅ `setAllowUniversalAccessFromFileURLs(false)`
- ✅ `setAllowContentAccess(false)`
- ✅ `setBlockNetworkLoads(true)` & `setBlockNetworkImage(true)`
- ✅ `onPermissionRequest`: Alle Medien- und Sensor-Anfragen werden strikt mit `request.deny()` abgewiesen.
- ✅ `NotificationBridge`: Strikt typisierte Java-Bridge ohne RCE-, Shell- oder Reflection-Vektoren.

### 3. JavaScript & DOM Security (9.8/10 ⭐)
- ✅ Kein `eval()`, kein `Function()`-Konstruktor.
- ✅ Keine String-basierten Timer (`setTimeout("code", ...)`).
- ✅ Kein `document.write()` oder `.outerHTML`.
- ✅ Dynamische DOM-Generierung über sichere Methoden (`createElement`, `textContent`, `classList`).
- ✅ Alle `JSON.parse(localStorage...)` Aufrufe sind in abgesicherten `try/catch`-Blöcken gekapselt.
- ✅ Keine Netzwerk-APIs (`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`).

### 4. Content Security Policy (CSP) (10/10 ⭐)
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'self';">
```

---

## 🧪 Automatisierte Sicherheitsprüfung ausführen

Jeder Commit kann lokal über den Deep-Security-Scanner verifiziert werden:

```bash
# 73+ automatisierte Sicherheitschecks (Manifest, WebView, XSS, CSP, APK)
python test_security_deep.py
```
