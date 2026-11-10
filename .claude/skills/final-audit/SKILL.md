---
name: final-audit
description: Abschlussprüfung eines Arbeitsergebnisses vor Übergabe oder Release — Vollständigkeit gegen den Auftrag, Korrektheit, Tests, Sicherheit, Dokumentation und offene Punkte, mit klarem Freigabeurteil. Verwenden als letzter Schritt nach build-app, Strategie- oder Rechercheprojekten.
argument-hint: "<Ergebnis/Branch/Dokument> [Auftrag/Anforderungsliste]"
---

# Final Audit

## 1. Zweck
Sicherstellen, dass abgeliefert wird, was zugesagt wurde — geprüft, nicht angenommen.

## 2. Einsatz
- Vor Merge, Release, Übergabe an Dritte oder Präsentation.
- Nach Abschluss eines anderen Skills als Qualitätstor.

## 3. Eingaben
- **Pflicht:** Prüfgegenstand (`$ARGUMENTS`) und ursprünglicher Auftrag/Anforderungsliste.
- Fehlt der Auftrag: aus Verlauf, Issue oder SPEC rekonstruieren und Rekonstruktion offenlegen.

## 4. Ablauf
1. **Anforderungsmatrix:** Jede Anforderung des Auftrags als Zeile → erfüllt / teilweise / fehlt, mit Nachweis (Datei, Test, Screenshot).
2. **Selbst ausführen:** Tests, Build, Lint bzw. Rechenwege tatsächlich laufen lassen — Ergebnisse zitieren, nicht vermuten.
3. **Korrektheit:** Stichproben der kritischsten Teile (Berechnungen, Zugriffsschutz, Kernaussagen mit Quellen).
4. **Sicherheit & Datenschutz:** Geheimnisse im Repo (`git grep -nE "sk_|secret|service_role|password="`), Zugriffskontrollen, personenbezogene Daten.
5. **Dokumentation:** README, manuelle Schritte, bekannte Grenzen vorhanden und aktuell.
6. **Konsistenz:** Keine Platzhalter, TODOs, Fake-Daten oder widersprüchlichen Angaben.
7. **Urteil:** Freigabe / Freigabe mit Auflagen / keine Freigabe — mit Begründung.

## 5. Spezialagenten
- `general-purpose` — unabhängiger Zweitprüfer für die Anforderungsmatrix (bekommt nur Auftrag + Ergebnis).
- Skill `/red-team` bei sicherheits- oder geschäftskritischen Ergebnissen.

## 6. Qualitätskontrolle
- [ ] Jede Anforderung hat einen Nachweis oder ist ehrlich als offen markiert.
- [ ] Alle genannten Prüfbefehle wurden in dieser Sitzung ausgeführt; Ausgabe zitiert.
- [ ] Fehlschläge werden berichtet, nicht umformuliert.
- [ ] Offene Punkte haben Verantwortlichen und nächsten Schritt.

## 7. Ausgabeformat
```markdown
# Final Audit: <Gegenstand> · <Datum>
**Urteil:** Freigabe | mit Auflagen | keine Freigabe
## Anforderungsmatrix
| # | Anforderung | Status | Nachweis |
## Ausgeführte Prüfungen (Befehl → Ergebnis)
## Befunde (kritisch → niedrig)
## Offene Punkte & Auflagen
```
