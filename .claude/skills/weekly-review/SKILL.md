---
name: weekly-review
description: Wöchentlicher Rückblick und Ausblick — Ergebnisse, Abweichungen, Entscheidungen, Risiken und die drei Prioritäten der nächsten Woche, auf Basis echter Daten (Command Center, Git, Kalender, Notizen). Verwenden einmal pro Woche, idealerweise Freitag oder Montag früh.
argument-hint: "[Woche, z. B. 2026-11-09] [Fokusbereich]"
---

# Weekly Review

## 1. Zweck
In 15 Minuten Klarheit: Was wurde erreicht, was hängt, was zählt nächste Woche.
Nur reale Daten — keine geschätzten Fortschritte.

## 2. Einsatz
- Fester Wochenrhythmus.
- Vor Abstimmungen mit Team oder Partnern.

## 3. Eingaben
- **Optional:** Woche (Standard: aktuelle ISO-Woche), Fokusbereich (`$ARGUMENTS`).
- **Datenquellen (soweit verfügbar):** Wochenbericht im Wayne Command Center (`/reports`, Kennzahlen dort per „Bericht erstellen“ einfrieren), Git-Log der Woche, Kalender, offene Aufgaben, Notizen.
- Ist eine Quelle nicht zugänglich, im Bericht als „nicht geprüft“ vermerken.

## 4. Ablauf
1. **Daten sammeln:** Erledigte und neue Aufgaben, Überfälliges, Blockiertes, Entscheidungen, Meilensteine, Research-Zugänge; ggf. `git log --since` der Woche.
2. **Ziele abgleichen:** Prioritäten der Vorwoche → erreicht / teilweise / verfehlt, mit Grund.
3. **Muster erkennen:** Was hat wiederholt gebremst? Wo floss Zeit ohne Wirkung hin?
4. **Risiken:** Überfällige Projekte, Ampel „Gefährdet/Verzug“ aus der Fortschrittskontrolle.
5. **Nächste Woche:** Genau drei Prioritäten, je mit erstem konkreten Schritt; bewusst Gestrichenes benennen.
6. **Ablegen:** Zusammenfassung, Erfolge, Hindernisse und Fokus in den Wochenbericht übertragen (auf Wunsch).

## 5. Spezialagenten
- `Explore` — Repository-Aktivität der Woche zusammenfassen, falls mehrere Repos betroffen sind.
- Keine weiteren Agenten nötig; der Review soll schnell bleiben.

## 6. Qualitätskontrolle
- [ ] Alle Zahlen stammen aus einer genannten Quelle.
- [ ] Jede verfehlte Priorität hat einen ehrlichen Grund.
- [ ] Maximal drei Prioritäten, jede mit erstem Schritt.
- [ ] Mindestens ein Punkt, der gestrichen oder delegiert wird.

## 7. Ausgabeformat
```markdown
# Weekly Review KW <n> (<Mo>–<So>)
**In einem Satz:** …
## Zahlen (Quelle: …)
## Vorwochen-Prioritäten: Ergebnis
## Erfolge · ## Hindernisse & Muster · ## Risiken
## Fokus nächste Woche
1. <Priorität> → erster Schritt: …
**Gestrichen/Delegiert:** …
```
