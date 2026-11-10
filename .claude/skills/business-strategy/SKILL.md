---
name: business-strategy
description: Strukturierte Strategieentwicklung für ein Geschäftsfeld, Produkt oder Vorhaben — Lage, Optionen, Bewertung, Empfehlung und Umsetzungsplan mit messbaren Zielen. Verwenden bei Richtungsentscheidungen, Markteintritt, Positionierung oder Priorisierung von Initiativen.
argument-hint: "<Vorhaben oder strategische Frage>"
---

# Business Strategy

## 1. Zweck
Aus einer strategischen Frage eine begründete Empfehlung mit Umsetzungsplan machen — mit
sichtbaren Annahmen und echten Alternativen.

## 2. Einsatz
- Markteintritt, neues Produkt, Preis- oder Positionierungsfrage.
- Priorisierung konkurrierender Initiativen.
- Jahres- oder Quartalsplanung einer Abteilung.

## 3. Eingaben
- **Pflicht:** Frage/Vorhaben (`$ARGUMENTS`), Zielhorizont.
- **Hilfreich:** Ziele & Kennzahlen, Budget/Ressourcen, Zielkunden, bekannte Wettbewerber, Einschränkungen (rechtlich, zeitlich), bisherige Entscheidungen.
- Fehlen Ziel oder Ressourcenrahmen: nachfragen — ohne sie ist keine Empfehlung seriös.

## 4. Ablauf
1. **Ziel klären:** Was muss in welchem Zeitraum messbar erreicht sein?
2. **Lage:** Markt, Kunden, Wettbewerb, eigene Stärken/Schwächen. Externe Fakten über `/deep-research` belegen.
3. **Kernproblem:** Die eine Herausforderung benennen, die die Strategie lösen muss.
4. **Optionen:** 3 echte Alternativen inkl. „Status quo“. Je Option: Logik, Aufwand, Risiko, Zeit bis Wirkung.
5. **Bewertung:** Gewichtete Matrix (Wirkung, Aufwand, Risiko, Passung, Reversibilität). Gewichte offenlegen.
6. **Empfehlung:** Eine Option, Begründung, was wir bewusst *nicht* tun.
7. **Umsetzung:** 3–5 Initiativen mit Verantwortlichen, Meilensteinen, KPIs, Abbruchkriterien.
8. **Stresstest:** Empfehlung mit `/red-team` prüfen, wenn Einsatz hoch oder schwer umkehrbar.
9. **Dokumentieren:** Entscheidung im Entscheidungsprotokoll, Initiativen als Projekte/Meilensteine anlegen (auf Wunsch).

## 5. Spezialagenten
- `general-purpose` — parallele Markt- und Wettbewerbsrecherche (je Wettbewerber ein Auftrag).
- `Plan` — Zerlegung der Umsetzung in Phasen und Abhängigkeiten.
- Skill `/red-team` für die Gegenprüfung.

## 6. Qualitätskontrolle
- [ ] Ziel ist messbar und terminiert.
- [ ] Mindestens eine ernsthafte Alternative zur Empfehlung.
- [ ] Annahmen sind als solche markiert und testbar formuliert.
- [ ] Jede Initiative hat KPI und Abbruchkriterium.
- [ ] Ressourcenbedarf passt zum genannten Rahmen.

## 7. Ausgabeformat
```markdown
# Strategie: <Vorhaben>
**Empfehlung:** <1 Satz> · **Horizont:** <Zeitraum>
## Ziel & Erfolgskriterien
## Lage (Fakten mit Quellen) · ## Kernproblem
## Optionen & Bewertung (Tabelle mit Gewichten)
## Empfehlung & bewusster Verzicht
## Umsetzungsplan
| Initiative | Verantwortlich | Meilenstein | KPI | Abbruchkriterium |
## Annahmen & Risiken
```
