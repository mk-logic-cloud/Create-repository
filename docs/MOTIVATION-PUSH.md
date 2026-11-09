# Tägliche Motivation um 06:30 Uhr (Web Push)

Jeden Morgen um 06:30 Uhr (Europe/Berlin) erhält jedes angemeldete Gerät eine
Push-Benachrichtigung mit Morgengruß, Tagesspruch und, falls belegt, dem Autor.
Das funktioniert auch bei geschlossener Anwendung, weil der Versand auf dem
Server geschieht und der Service Worker des Browsers die Nachricht anzeigt.

## Warum diese Architektur

Die Anwendung war eine rein statische Seite. Eine Website kann von sich aus
nichts auslösen, wenn sie geschlossen ist. Nötig sind deshalb drei Teile:

| Teil | Datei | Aufgabe |
|---|---|---|
| Service Worker | `sw.js` | Empfängt die Push-Nachricht, zeigt sie an, öffnet beim Klick den Motivationsbereich |
| Browser-Steuerung | `motivation-push.js` | Erlaubnis einholen, Gerät an- und abmelden, Test senden |
| Serverfunktionen | `api/motivation/*.js`, `lib/motivation/*.js` | Geräte speichern, um 06:30 Uhr verschlüsselt versenden |
| Gemeinsamer Kern | `motivation-core.js` | Sprüche und Tagesauswahl, identisch für Karte und Push |
| Zeitplan | `vercel.json` (Cron) oder Make.com | Ruft den Versand auf |

## Voraussetzungen (einmalig einzurichten)

Ohne diese Schritte zeigt die Karte „Der Push-Dienst des Servers ist nicht
eingerichtet“ und bietet kein Aktivieren an. Es wird nichts vorgetäuscht.

1. **Hosting mit Serverfunktionen und HTTPS.** Der Code ist für Vercel
   geschrieben (`api/`-Verzeichnis, `vercel.json`). Reines Datei-Hosting
   (z. B. GitHub Pages) genügt nicht.
2. **Redis-Speicher** für Geräte und die Tagessperre: Upstash Redis über den
   Vercel Marketplace verbinden. Benötigt werden `KV_REST_API_URL` und
   `KV_REST_API_TOKEN` (alternativ `UPSTASH_REDIS_REST_URL` und
   `UPSTASH_REDIS_REST_TOKEN`).
3. **VAPID-Schlüssel** erzeugen und als Umgebungsvariablen hinterlegen:

   ```bash
   npm install
   ```

   ```bash
   npm run vapid
   ```

   | Variable | Wert |
   |---|---|
   | `VAPID_PUBLIC_KEY` | öffentlicher Schlüssel aus dem Befehl |
   | `VAPID_PRIVATE_KEY` | privater Schlüssel (geheim halten) |
   | `VAPID_SUBJECT` | `mailto:` plus eine Kontaktadresse |
   | `CRON_SECRET` | langes Zufallsgeheimnis, schützt den Versand-Endpunkt |
   | `MOTIVATION_NAME` | optional, ergibt „Guten Morgen, Name! ☀️“ |

4. **Neu deployen**, danach in der App auf „Täglich um 06:30 Uhr erinnern“
   tippen und mit „Test senden“ prüfen.

## Zeitplan: exakt 06:30 Uhr, Sommer- und Winterzeit

Cron-Dienste rechnen meist in UTC, 06:30 Uhr Berlin ist im Sommer 04:30 UTC
und im Winter 05:30 UTC. Deshalb entscheidet nicht der Zeitplan, sondern der
Endpunkt selbst:

- Er darf beliebig oft aufgerufen werden.
- Vor 06:30 Uhr und ab 09:00 Uhr Berliner Zeit sendet er nichts.
- Pro Berliner Kalendertag sendet er höchstens einmal (atomare Sperre in Redis).

`vercel.json` ruft ihn um 04:30, 05:30 und 06:30 UTC auf. Je nach Jahreszeit
trifft genau einer dieser Aufrufe 06:30 Uhr, die anderen sind wirkungslos oder
dienen als Wiederholung, falls der erste Versuch scheiterte.

**Wichtig zur Genauigkeit:** Nach meinem Kenntnisstand führt Vercel Cron-Jobs
im Hobby-Tarif nur irgendwann innerhalb der geplanten Stunde aus, minutengenau
erst im Pro-Tarif. Bitte im Vercel-Dashboard prüfen. Im Hobby-Tarif käme die
Nachricht dann zwischen 06:30 und etwa 08:00 Uhr, nie früher. Für exakt
06:30 Uhr gibt es zwei Wege:

- Vercel Pro, oder
- ein Make.com-Szenario, täglich 06:30 Uhr mit Zeitzone Europe/Berlin, das
  `POST https://<deine-domain>/api/motivation/send` mit dem Header
  `Authorization: Bearer <CRON_SECRET>` aufruft. Der Vercel-Cron kann als
  Rückfall bestehen bleiben, die Tagessperre verhindert doppelte Nachrichten.

## Schutz vor doppelten Benachrichtigungen

1. Tagessperre auf dem Server (`SET NX` in Redis): ein Versand pro Tag.
2. `Topic`-Header: Der Push-Dienst ersetzt eine noch nicht zugestellte
   Nachricht desselben Tages, statt zwei zuzustellen.
3. `tag` der Benachrichtigung: Käme dieselbe Nachricht doch zweimal an, ersetzt
   sie die erste lautlos.
4. Ein Gerät wird anhand seines Endpunkts nur einmal gespeichert.

## Geräte und Berechtigungen

| Plattform | Unterstützung | Hinweis |
|---|---|---|
| Android, Chrome/Edge/Firefox | ja | Benachrichtigungen für die Seite erlauben |
| Windows/macOS/Linux, Chrome/Edge/Firefox | ja | Der Browser muss laufen (Hintergrund genügt); Systembenachrichtigungen und Fokus-Modus beachten |
| macOS, Safari ab 16 | ja | |
| iPhone/iPad ab iOS 16.4 | ja, mit Bedingung | Nur als App auf dem Home-Bildschirm: Safari → Teilen → „Zum Home-Bildschirm“, dann dort öffnen und aktivieren |
| iPhone/iPad, Browser-Tab | nein | Apple erlaubt Web Push nur für installierte Web-Apps |

Die Erlaubnis muss der Nutzer einmal je Gerät per Tippen erteilen. Blockiert er
sie, erklärt die Karte, wo sie sich wieder erlauben lässt. Ist ein Gerät um
06:30 Uhr aus oder offline, hält der Push-Dienst die Nachricht vier Stunden vor.
Energiesparmodi können die Anzeige verzögern, das liegt außerhalb der App.

## Tests

```bash
npm test
```

Automatisch geprüft (17 Servertests, dazu ein Browserlauf mit echtem Chromium
und echtem Service Worker):

- zwei Jahre Scheduler-Läufe: jeden Tag genau eine Zustellung, immer 06:30 Uhr Berlin
- beide Zeitumstellungen (29.03.2026, 25.10.2026)
- kein Versand vor 06:30 Uhr, Nachholen bei verspätetem Scheduler
- gleichzeitige und wiederholte Aufrufe: keine doppelte Nachricht
- echte Verschlüsselung der Nutzlast (aes128gcm, VAPID), mit Geräteschlüssel lesbar
- abgelaufene Geräte werden entfernt, gescheiterter Versand wird wiederholt
- geschlossene Anwendung: Service Worker zeigt die Benachrichtigung an
- Klickziel: Motivationsbereich im Dashboard

**Nicht automatisch prüfbar** und nach dem Deployment von Hand zu testen: die
tatsächliche Zustellung über die Push-Dienste von Google, Apple und Mozilla auf
echten Geräten. In der Entwicklungsumgebung gibt es keinen Push-Dienst, dort
wurde nur diese Strecke nachgebildet. Checkliste je Gerät:

1. App öffnen, Erinnerung aktivieren, „Test senden“: Benachrichtigung erscheint.
2. App und Tab vollständig schließen und am nächsten Morgen um 06:30 Uhr prüfen,
   ob die Benachrichtigung von selbst erscheint.
3. Auf die Benachrichtigung tippen: Die App öffnet sich im Motivationsbereich.
