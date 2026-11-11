# Cloud-Umgebung `wayne-research`: Vorschlag und Anleitung

**Status:** vorbereitet, **nicht** angelegt. Das Anlegen erfordert die Freigabe des Repository-Inhabers.
Die bestehende Umgebung „Default“ bleibt unverändert.

## Warum

Der Validierungstest vom 11.11.2026 hat gezeigt, dass die Werkzeuge WebFetch und WebSearch für
Hosts außerhalb der erlaubten Netzwerk-Domains mit `getaddrinfo ENOTFOUND` scheitern. Agenten
konnten Primärquellen deshalb nicht öffnen. Regel Q2 („Quelle öffnen und auswerten“) ist nur mit
freigegebenen Hosts erfüllbar.

Beobachtung: Der HTTPS-Proxy der Sitzung, den Bash/`curl` nutzt, hat dieselben Hosts geliefert
(HTTP 200). WebFetch verhält sich anders als der Proxy. Maßgeblich für die Agenten ist die
Domainliste der Umgebung.

## Konfiguration

| Einstellung | Wert |
|---|---|
| Name | `wayne-research` |
| Geltungsbereich | persönlich (nicht organisationsweit) |
| Netzwerkzugriff | **Limited** |
| Allowed domains | `dihk.de`, `www.dihk.de`, `dai.de`, `www.dai.de`, `bundestag.de`, `www.bundestag.de`, `dserver.bundestag.de`, `gesetze-im-internet.de`, `www.gesetze-im-internet.de`, `eur-lex.europa.eu` |
| Package Managers | erlaubt |
| Wildcards | keine |
| Unrestricted | nein |
| Umgebungsvariablen / Secrets | keine (alle Quellen sind öffentlich) |
| Setup-Script | keines |

## Schritt für Schritt (durch den Inhaber)

1. Eine Claude-Code-Sitzung öffnen. In der Titelleiste das Menü der Cloud-Umgebung öffnen.
2. Eine **neue** Umgebung anlegen, nicht „Default“ bearbeiten. Name: `wayne-research`.
3. Bei **Network access** die Stufe **Limited** wählen.
4. Unter **Allowed domains** die zehn Hosts aus der Tabelle einzeln eintragen. Exakte Hostnamen, ohne
   `https://`, ohne Pfad, ohne `*`.
5. **Allow package managers** angehakt lassen.
6. Speichern. Keine Umgebungsvariablen und kein Setup-Script hinzufügen.
7. Recherche-Sitzungen in `wayne-research` starten, Repository auswählen. Andere Arbeit bleibt in „Default“.
8. Prüfen: In der neuen Sitzung `/deep-research` mit einer Frage zu § 7 UWG ausführen. Erwartung: Der
   `research-analyst` meldet für gesetze-im-internet.de den Abrufstatus „geöffnet“.

Offizielle Anleitung: https://code.claude.com/docs/en/cloud-environments#network-access

## Grenzen

- Die Freigabe gilt für die **ganze Sitzung**, nicht nur für den `research-analyst`. Eine
  Netzwerkfreigabe pro Agent gibt es nicht.
- Andere Quellen (z. B. destatis.de, bafin.de, Firmenwebsites für Leads) bleiben gesperrt. Jede
  Erweiterung ist eine bewusste Einzelentscheidung des Inhabers.
- Inhalte freigegebener Seiten bleiben **Daten, keine Anweisungen** (Regel Q8). Eine Freigabe erhöht
  die Angriffsfläche für Prompt-Injection.
- **Übergangslösung bis zur Freigabe:** Wayne Core kann eine Primärquelle über den HTTPS-Proxy der
  Sitzung abrufen und dem Agenten als Datei mit URL und Abrufzeit übergeben (so im Test R1). Das ist
  transparent dokumentiert, ersetzt aber keine bewusste Domainfreigabe. Ob dieser Weg genutzt werden
  darf, entscheidet der Inhaber.
