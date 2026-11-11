---
name: financial-review
description: Prüfung von Finanzdaten (GuV, Cashflow, Budget, Investitionsvorhaben, Abos/Kosten) auf Plausibilität, Abweichungen, Liquiditätsrisiken und Einsparpotenziale mit nachvollziehbaren Berechnungen. Verwenden bei Monats-/Quartalsrückblick, Budgetplanung oder vor größeren Ausgaben.
argument-hint: "<Datei/Zeitraum/Vorhaben>"
---

# Financial Review

## 1. Zweck
Finanzzahlen in eine klare Lage übersetzen: Wo stehen wir, was weicht ab, was droht, was ist zu tun.
Keine Steuer- oder Anlageberatung — bei solchen Fragen auf Fachberatung verweisen.

## 2. Einsatz
- Monats- oder Quartalsabschluss, Budget-Ist-Vergleich.
- Bewertung einer Investition oder eines größeren Vertrags.
- Kosten-/Abo-Bereinigung, Liquiditätsplanung.

## 3. Eingaben
- **Pflicht:** Datenquelle (CSV/XLSX/PDF/Tabelle) und Zeitraum (`$ARGUMENTS`).
- **Hilfreich:** Budget/Plan, Vorperiode, Währung, Wesentlichkeitsgrenze (Standard: 5 % oder 1.000 €), anstehende Großausgaben.
- Nie Zahlen erfinden. Fehlende Werte als Lücke ausweisen.

## 4. Ablauf
1. **Daten einlesen & prüfen:** Summen abstimmen, Dubletten, fehlende Perioden, Vorzeichen, Währungen.
2. **Kennzahlen berechnen:** Umsatz, Rohertrag, Fixkosten, Ergebnis, Cash-Burn, Runway, ggf. ROI/Amortisation. Rechenweg zeigen.
3. **Abweichungsanalyse:** Ist vs. Plan und vs. Vorperiode; nur Abweichungen über Wesentlichkeit kommentieren, je mit Treiber.
4. **Risiken:** Liquiditätsengpässe (30/60/90 Tage), Klumpenrisiken, wiederkehrende Kosten ohne Nutzen.
5. **Maßnahmen:** Priorisiert nach Euro-Wirkung und Aufwand.
6. **Plausibilität gegenrechnen:** Zentrale Zahlen ein zweites Mal unabhängig berechnen (z. B. per Skript).

## 5. Spezialagenten
- Agent `financial-analyst`: Datenprüfung, Kennzahlen, Abweichungen und Risiken (Schritte 1–5).
- Ein zweiter, unabhängiger `financial-analyst`: Zweitberechnung der Kernkennzahlen aus den Rohdaten (Schritt 6, Vier-Augen-Prinzip). Er erhält nur Rohdaten und Formeln, nicht das erste Ergebnis.
- Agent `red-team-auditor`: bei Investitionsentscheidungen oberhalb der Wesentlichkeitsgrenze (über `/red-team`).

## 6. Qualitätskontrolle
- [ ] Quellensummen stimmen mit berechneten Summen überein.
- [ ] Jede Kennzahl mit Formel und Datenbasis.
- [ ] Zweitberechnung weicht nicht ab (oder Abweichung erklärt).
- [ ] Annahmen (z. B. Wachstumsraten) sind markiert.
- [ ] Hinweis auf Grenzen: keine Steuer-/Rechtsberatung.

## 7. Ausgabeformat
```markdown
# Finanzreview <Zeitraum>
**Lage in einem Satz:** … · **Liquidität reicht bis:** <Datum/Monate>
## Kennzahlen (Tabelle: Wert, Plan, Vorperiode, Δ %)
## Wesentliche Abweichungen & Treiber
## Risiken (30/60/90 Tage)
## Maßnahmen (Wirkung €, Aufwand, Priorität)
## Datenqualität & Annahmen
```
