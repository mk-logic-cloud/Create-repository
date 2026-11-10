---
name: contract-review
description: Strukturierte Prüfung eines Vertrags (NDA, Dienstleistung, SaaS, Kooperation, Miete) auf Pflichten, Risiken, ungewöhnliche Klauseln und fehlende Regelungen, mit konkreten Änderungsvorschlägen. Verwenden vor Unterzeichnung oder Verlängerung. Ersetzt keine anwaltliche Beratung.
argument-hint: "<Vertragsdatei> [eigene Rolle: Auftraggeber|Auftragnehmer|...]"
---

# Contract Review

## 1. Zweck
Vor der Unterschrift wissen, worauf man sich einlässt: Pflichten, Kosten, Haftung, Ausstieg —
und was verhandelt werden sollte. Ergebnis ist eine Entscheidungshilfe, **keine Rechtsberatung**.

## 2. Einsatz
- Neuer Vertrag, Verlängerung, Vertragsänderung.
- Vergleich eines Entwurfs mit einer früheren Fassung.
- Nicht bei laufenden Streitigkeiten — dann sofort Anwalt.

## 3. Eingaben
- **Pflicht:** Vertragstext (`$ARGUMENTS`), eigene Rolle.
- **Hilfreich:** Ziel des Geschäfts, Verhandlungsmacht, rote Linien (z. B. Haftungsobergrenze), anwendbares Recht, Vorgängerversion.

## 4. Ablauf
1. **Eckdaten erfassen:** Parteien, Gegenstand, Laufzeit, Kündigung, Vergütung, Gerichtsstand, anwendbares Recht.
2. **Pflichtenliste:** Was muss *wir* wann leisten? Fristen und Nachweise.
3. **Risikoprüfung je Klausel:** Haftung & Freistellung, Gewährleistung, Vertragsstrafen, automatische Verlängerung, Preisanpassung, IP/Nutzungsrechte, Vertraulichkeit, Datenschutz (AVV nach Art. 28 DSGVO bei Auftragsverarbeitung), Wettbewerbsverbote, Abtretung, Exklusivität.
4. **Lücken:** Fehlende Regelungen (z. B. Haftungsdeckel, SLA, Exit/Datenrückgabe).
5. **Bewerten:** Ampel je Punkt (🟢 üblich, 🟡 verhandeln, 🔴 kritisch) mit Begründung — nur mit Zitat der Klausel.
6. **Vorschläge:** Konkrete Alternativformulierung für jeden 🔴/🟡-Punkt.
7. **Empfehlung:** Unterschreiben / nach Änderungen / nicht ohne Anwalt.

## 5. Spezialagenten
- `general-purpose` — unabhängige Zweitlesung nur der 🔴-Klauseln („Finde Gründe, warum diese Einschätzung falsch ist“).
- Skill `/deep-research` für Rechtslage oder Marktüblichkeit, mit Quellen.

## 6. Qualitätskontrolle
- [ ] Jede Bewertung zitiert die konkrete Klausel (§/Absatz).
- [ ] Fristen und Beträge exakt übernommen, nicht umschrieben.
- [ ] Datenschutz und Haftung immer geprüft, auch wenn unauffällig.
- [ ] Unklare Formulierungen als unklar markiert, nicht interpretiert.
- [ ] Hinweis: keine Rechtsberatung; bei 🔴 Anwalt empfehlen.

## 7. Ausgabeformat
```markdown
# Vertragsprüfung: <Titel> · Rolle: <Rolle>
**Empfehlung:** … · **Kritische Punkte:** <n>
## Eckdaten (Tabelle)
## Unsere Pflichten & Fristen
## Befunde
| Ampel | Klausel | Zitat | Risiko | Vorschlag |
## Fehlende Regelungen
## Verhandlungsprioritäten (Top 3)
> Keine Rechtsberatung. Bei kritischen Punkten anwaltliche Prüfung einholen.
```
