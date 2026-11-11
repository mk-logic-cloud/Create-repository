---
name: fitness-review
description: Auswertung von Trainings-, Schlaf- und Ernährungsdaten mit Trend, Belastungssteuerung und einem realistischen Plan für die nächste Woche. Verwenden für den wöchentlichen oder monatlichen Fitness-Check. Ersetzt keine ärztliche Beratung.
argument-hint: "<Datenquelle/Zeitraum> [Ziel: Kraft|Ausdauer|Gewicht|Gesundheit]"
---

# Fitness Review

## 1. Zweck
Training datenbasiert steuern: Fortschritt erkennen, Überlastung vermeiden, nächste Woche planen.
**Keine medizinische Beratung.**

## 2. Einsatz
- Wöchentlicher/monatlicher Rückblick.
- Plateau, Leistungseinbruch, Wiedereinstieg nach Pause.

## 3. Eingaben
- **Pflicht:** Daten (Export aus Uhr/App als CSV/JSON, Trainingslog oder Notizen) und Zeitraum.
- **Hilfreich:** Ziel, Trainingstage/Woche, Einschränkungen/Verletzungen, Körpergewicht-Verlauf, Schlafdauer, Ruhepuls/HRV.
- Fehlende Daten nicht schätzen, sondern als Lücke ausweisen.

## 4. Ablauf
1. **Daten prüfen:** Vollständigkeit, Ausreißer, Einheiten.
2. **Volumen & Intensität:** Einheiten, Dauer, Distanz bzw. Sätze×Wdh×Last je Woche; Trend über ≥ 4 Wochen.
3. **Belastung vs. Erholung:** Volumenzuwachs > ~10 %/Woche, sinkende HRV, steigender Ruhepuls, < 7 h Schlaf → Warnsignal.
4. **Zielabgleich:** Fortschritt gegenüber Ziel (z. B. Bestleistung, Pace, Gewichtstrend).
5. **Plan:** Nächste Woche mit konkreten Einheiten, progressiver Steigerung oder Deload.
6. **Warnhinweise:** Schmerzen, Brustdruck, Schwindel, ungewöhnliche Werte → ärztlich abklären, Plan pausieren.

## 5. Spezialagenten
- **Wayne Core führt diesen Skill direkt aus.** Ein Spezialagent ist nicht erforderlich.
- Große Datenexporte (CSV → Wochentabelle) bereitet Wayne Core selbst per Skript auf. Es gibt keinen Fachagenten für Gesundheit, und der `financial-analyst` wird hierfür bewusst nicht zweckentfremdet.

## 6. Qualitätskontrolle
- [ ] Trends basieren auf ≥ 2 Wochen Daten, sonst als vorläufig markiert.
- [ ] Steigerung nächste Woche ≤ ~10 % ohne Begründung.
- [ ] Mindestens ein Ruhetag eingeplant.
- [ ] Medizinischer Hinweis enthalten.

## 7. Ausgabeformat
```markdown
# Fitness Review <Zeitraum> · Ziel: <Ziel>
**Status:** Fortschritt | Plateau | Überlastungsrisiko
## Kennzahlen (Tabelle Woche für Woche)
## Beobachtungen
## Plan nächste Woche
| Tag | Einheit | Umfang/Intensität | Zweck |
## Warnsignale & Hinweise
> Keine medizinische Beratung.
```
