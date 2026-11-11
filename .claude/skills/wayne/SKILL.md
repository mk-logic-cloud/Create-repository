---
name: wayne
description: Zentrale Schnittstelle von Wayne Core für allgemeine oder bereichsübergreifende Aufträge. Analysiert den Auftrag, wählt den passenden Skill-Ablauf oder stellt einen eigenen zusammen, setzt die Spezialagenten aus .claude/agents gezielt parallel oder nacheinander ein, prüft die Ergebnisse und führt sie zu einer freigabefähigen Antwort zusammen. Verwenden, wenn unklar ist, welcher Skill passt, oder wenn mehrere Fachgebiete betroffen sind.
argument-hint: "<Auftrag in eigenen Worten>"
---

# Wayne

## 1. Zweck
Ein Einstieg für jeden Auftrag. Wayne Core entscheidet, *wie* gearbeitet wird, und verantwortet
das Ergebnis. Die Regeln dafür stehen in `CLAUDE.md` (Auswahl, Parallelität, Übergaben,
Freigabe, Sicherheit).

## 2. Einsatz
- Allgemeine Aufträge („Bereite die Entscheidung über X vor“, „Mach Y fertig“).
- Aufträge, die mehrere Fachgebiete berühren (z. B. Strategie + Finanzen + Recht).
- Wenn der passende Spezial-Skill nicht offensichtlich ist.

## 3. Eingaben
- **Pflicht:** Auftrag (`$ARGUMENTS`).
- **Hilfreich:** Ziel, Frist, Entscheidungsträger, vorhandene Dateien/Daten, Einschränkungen.
- Fehlen Angaben, die das Ergebnis wesentlich verändern, stellt Wayne Core **eine** gebündelte Rückfrage.

## 4. Ablauf
1. **Analysieren:** Ziel, gewünschtes Ergebnis, Fachgebiete, Risiko (niedrig/mittel/hoch), Umkehrbarkeit.
2. **Ablauf wählen:**

   | Auftrag | Ablauf |
   |---|---|
   | Recherchefrage | `/deep-research` |
   | Strategie, Positionierung, Priorisierung | `/deep-research` → `/business-strategy` → `/red-team` |
   | Finanzen, Budget, Investition | `/financial-review` (+ `/red-team` ab Wesentlichkeit) |
   | Vertrag | `/contract-review` (+ `financial-analyst` bei Zahlungsklauseln) |
   | Neue Kunden | `/lead-generation` |
   | Software | `/build-app` → `/red-team` (Fokus Sicherheit) → `/final-audit` |
   | Wochenrückblick, Fitness | `/weekly-review`, `/fitness-review`, direkt durch Wayne Core |
   | Passt nichts davon | eigener Plan nach den Auswahlregeln in `CLAUDE.md` |

   Ist es ein einzelner Spezial-Skill, diesen Ablauf direkt befolgen.
3. **Planen:** Teilaufgaben, Reihenfolge, was parallel läuft und welcher Agent welchen Teil übernimmt. Bei mehr als drei Schritten den Plan kurz offenlegen.
4. **Delegieren:** Jeder Agent erhält einen Auftrag im Übergabeformat aus `CLAUDE.md` mit vollständigem Kontext. Unabhängige Teilaufgaben werden in einer Nachricht parallel gestartet.
5. **Prüfen:** Jede Übergabe auf Format, Belege und Widersprüche prüfen. Höchstens einmal gezielt nachbeauftragen.
6. **Zusammenführen:** Ergebnisse integrieren, Widersprüche auflösen oder offen benennen.
7. **Gegenprüfen:** Bei Risiko „hoch“, bei Releases und schwer umkehrbaren Schritten den `red-team-auditor` einsetzen.
8. **Freigabe:** Die Antwort gegen den Auftrag prüfen. Externe Aktionen nur mit Zustimmung des Nutzers.

## 5. Spezialagenten
Alle sieben, je nach Bedarf: `research-analyst`, `business-analyst`, `financial-analyst`,
`legal-analyst`, `growth-analyst`, `software-engineer`, `red-team-auditor`.
Dazu die eingebauten Agenten `Explore` (Codesuche) und `Plan` (Phasenplanung).

## 6. Qualitätskontrolle
- [ ] Der gewählte Ablauf ist begründet. Kein Agent ohne Mehrwert.
- [ ] Parallel liefen nur unabhängige Aufgaben, und nie zwei Schreiber zugleich.
- [ ] Jede übernommene Aussage ist belegt. Annahmen sind markiert.
- [ ] Widersprüche zwischen Agenten sind aufgelöst oder offen benannt.
- [ ] Keine externe Aktion ohne Zustimmung. Keine Secrets in den Ergebnissen.

## 7. Ausgabeformat
```markdown
# <Auftrag>
**Ergebnis:** <Kernaussage / Empfehlung> · **Konfidenz:** hoch | mittel | niedrig
## Vorgehen (Ablauf, eingesetzte Agenten)
## Ergebnis (inhaltlich, im Format des jeweiligen Skills)
## Prüfung (Red Team / Audit, falls durchgeführt)
## Annahmen & offene Punkte
## Benötigte Freigaben / nächste Schritte
```
