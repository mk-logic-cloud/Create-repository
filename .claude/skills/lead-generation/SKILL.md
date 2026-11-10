---
name: lead-generation
description: Aufbau einer qualifizierten, rechtskonformen Lead-Liste aus öffentlich verfügbaren Quellen auf Basis eines klaren Zielkundenprofils, inklusive Priorisierung und personalisierter Erstansprache. Verwenden, wenn neue B2B-Kunden oder Partner gesucht werden.
argument-hint: "<Angebot> <Zielkundenprofil/Region> [Anzahl]"
---

# Lead Generation

## 1. Zweck
Wenige, gut passende Kontakte mit belegtem Grund statt langer, kalter Listen.

## 2. Einsatz
- Vertriebsstart für ein Angebot, Partnersuche, Event-Einladungen.
- Nicht für Privatpersonen (B2C-Kaltakquise) — rechtlich in DE/EU stark eingeschränkt.

## 3. Eingaben
- **Pflicht:** Angebot, Zielkundenprofil (Branche, Größe, Region, Entscheiderrolle), gewünschte Anzahl (Standard 20).
- **Hilfreich:** Beste Bestandskunden als Vorbild, Ausschlussliste, Kanal (E-Mail, LinkedIn, Telefon).

## 4. Ablauf
1. **ICP festlegen:** Muss-/Kann-Kriterien und Ausschlüsse schriftlich fixieren.
2. **Quellen:** Nur öffentlich, legal und nutzungsbedingungskonform (Firmenwebsites, Handelsregister, Verbände, Presse, Stellenanzeigen). Kein Scraping gegen AGB, keine gekauften Listen.
3. **Recherche je Lead:** Firma, Website, Größe, Signal („warum jetzt“: Expansion, Stellenanzeige, Finanzierung) mit Quelle.
4. **Scoring:** Passung (0–3) + Signal (0–3) + Erreichbarkeit (0–2) → Priorität A/B/C.
5. **Ansprache:** Je A-Lead eine kurze, individuelle Erstnachricht (Bezug auf Signal, ein konkreter Nutzen, eine einfache Frage).
6. **Rechtscheck:** Werbliche E-Mails an Unternehmen benötigen in DE i. d. R. Einwilligung oder zumindest mutmaßliche Einwilligung (§ 7 UWG); Datenverarbeitung nach DSGVO dokumentieren. Im Zweifel Erstkontakt über Kanal ohne Einwilligungspflicht empfehlen.
7. **Übergabe:** Liste als CSV/Tabelle; auf Wunsch Folgeaufgaben im Command Center anlegen.

## 5. Spezialagenten
- `general-purpose` — parallele Firmenrecherche in Paketen à 5 Leads, Auftrag: „nur belegte Fakten mit URL“.
- Skill `/deep-research` für Markt- oder Branchenüberblick vorab.

## 6. Qualitätskontrolle
- [ ] Jeder Lead erfüllt alle Muss-Kriterien; Signal hat Quelle.
- [ ] Keine erfundenen Namen, E-Mail-Adressen oder Telefonnummern — nur öffentlich belegte Kontaktwege.
- [ ] Keine Dubletten, Ausschlussliste beachtet.
- [ ] Rechtshinweis zur Ansprache enthalten.
- [ ] Nachrichten < 90 Wörter, ohne Floskeln.

## 7. Ausgabeformat
```markdown
# Leads: <Angebot> · <Region> · <Datum>
## Zielkundenprofil
## Leads
| Prio | Firma | Website | Größe | Signal (Quelle) | Rolle | Kontaktweg | Score |
## Erstansprache (A-Leads)
## Rechtliche Hinweise
```
