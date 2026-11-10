---
name: deep-research
description: Gründliche, quellenbelegte Recherche zu einer Frage mit Bewertung der Quellenqualität und klarer Trennung von Fakten, Schlussfolgerungen und offenen Punkten. Verwenden, wenn eine Entscheidung belastbare externe Informationen braucht (Markt, Technologie, Regulierung, Wettbewerb).
argument-hint: "<Forschungsfrage> [Tiefe: kurz|standard|tief]"
---

# Deep Research

## 1. Zweck
Eine Frage so beantworten, dass jede Kernaussage auf eine prüfbare Quelle zurückführbar ist.
Ergebnis ist Entscheidungsgrundlage, keine Meinung.

## 2. Einsatz
- Vor Investitions-, Produkt- oder Strategieentscheidungen.
- Wenn Aktualität zählt (Preise, Regulierung, Wettbewerber, Technologien).
- Nicht für Fragen, die aus dem Repository oder vorhandenen Notizen beantwortbar sind.

## 3. Eingaben
- **Pflicht:** Forschungsfrage (`$ARGUMENTS`).
- **Optional:** Tiefe (Standard: `standard`), Zeitraum, Region, Sprache, bekannte Quellen, Entscheidung, die davon abhängt.
- Fehlt der Entscheidungskontext, einmal kurz nachfragen; sonst mit dokumentierter Annahme fortfahren.

## 4. Ablauf
1. **Frage schärfen:** In 3–6 Teilfragen zerlegen; Annahmen notieren.
2. **Suchen:** Teilfragen parallel recherchieren (Websuche/WebFetch). Primärquellen bevorzugen (Behörden, Originalstudien, Geschäftsberichte, offizielle Dokumentation).
3. **Quellen bewerten:** Je Quelle Typ, Datum, Herausgeber, Interessenkonflikt → Stufe A (primär/aktuell), B (seriös sekundär), C (schwach). C-Quellen nie allein tragend.
4. **Abgleichen:** Jede Kernaussage mit ≥ 2 unabhängigen Quellen bestätigen oder als „einfach belegt“ markieren. Widersprüche explizit ausweisen.
5. **Synthese:** Antwort zuerst, dann Begründung. Fakten, Schlussfolgerungen und Schätzungen sprachlich trennen.
6. **Lücken:** Was ungeklärt bleibt und wie es geklärt werden könnte.
7. **Optional ablegen:** Auf Wunsch als Eintrag im Research-Verzeichnis des Command Centers (Titel, Zusammenfassung, Quelle, Tags, Konfidenz).

## 5. Spezialagenten
- `Explore` — nur wenn interne Dateien/Repos durchsucht werden müssen.
- `general-purpose` — bei Tiefe `tief`: je Teilfrage ein Agent parallel, Auftrag: „Belege sammeln, Quelle + Zitat + Datum liefern, nicht bewerten“. Synthese bleibt beim Hauptagenten.

## 6. Qualitätskontrolle
- [ ] Jede Zahl und jedes Zitat hat eine Quelle mit Datum.
- [ ] Keine Kernaussage stützt sich allein auf C-Quellen.
- [ ] Widersprüche und Unsicherheiten sind benannt, nicht geglättet.
- [ ] Quellen tatsächlich geöffnet, nicht nur aus Suchtreffern übernommen.
- [ ] Antwort beantwortet die ursprüngliche Frage in den ersten drei Sätzen.

## 7. Ausgabeformat
```markdown
# Recherche: <Frage>
**Kurzantwort:** <2–3 Sätze> · **Konfidenz:** hoch | mittel | niedrig

## Kernerkenntnisse
1. <Aussage> — [Quelle, Datum] (A/B/C)

## Widersprüche & Unsicherheiten
## Offene Fragen / nächste Schritte
## Quellen
| # | Titel | Herausgeber | Datum | Stufe | URL |
```
