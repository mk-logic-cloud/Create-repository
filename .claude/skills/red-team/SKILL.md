---
name: red-team
description: Gezielte Gegenprüfung eines Plans, einer Entscheidung, eines Textes oder eines Systems aus Angreifer- und Skeptikerperspektive — findet Schwachstellen, falsche Annahmen und Fehlerszenarien, bevor sie teuer werden. Verwenden vor wichtigen, schwer umkehrbaren Entscheidungen oder Releases.
argument-hint: "<Plan/Dokument/System> [Fokus: strategie|sicherheit|finanzen|recht]"
---

# Red Team

## 1. Zweck
Das Ergebnis soll scheitern dürfen — auf dem Papier, nicht in der Realität.
Ziel ist nicht Ablehnung, sondern eine robustere Fassung.

## 2. Einsatz
- Vor Strategie-, Investitions- oder Vertragsentscheidungen.
- Vor Releases (Sicherheit, Datenschutz, Missbrauch).
- Für eigene Ergebnisse anderer Skills (`/business-strategy`, `/build-app`).
- Bei Sicherheitsprüfungen nur eigene bzw. autorisierte Systeme.

## 3. Eingaben
- **Pflicht:** Prüfgegenstand (`$ARGUMENTS`).
- **Hilfreich:** Ziel, Einsatzhöhe, Fokus, bekannte Schwächen, was „Scheitern“ bedeutet.

## 4. Ablauf
1. **Behauptungen extrahieren:** Welche Annahmen müssen wahr sein, damit es funktioniert?
2. **Pre-Mortem:** „Es ist 12 Monate später und es ist gescheitert — warum?“ 5–10 Gründe.
3. **Perspektiven wechseln:** Wettbewerber, Kunde, Angreifer, Regulierer, Finanzierer, eigenes Team.
4. **Je Fokus prüfen:**
   - Strategie: Marktannahmen, Abhängigkeiten, Opportunitätskosten.
   - Sicherheit: Authentifizierung, Autorisierung (fremde IDs!), Eingaben, Geheimnisse, Logging.
   - Finanzen: optimistische Annahmen, Sensitivität ±20 %.
   - Recht: Haftung, Datenschutz, Wettbewerbsrecht.
5. **Bewerten:** Wahrscheinlichkeit × Auswirkung → kritisch/hoch/mittel/niedrig.
6. **Gegenmaßnahmen:** Je Befund konkret, mit Aufwand; plus Frühwarnindikator.
7. **Urteil:** Fortfahren / mit Auflagen / stoppen.

## 5. Spezialagenten
- `general-purpose` — 2–3 unabhängige Gegner-Agenten parallel mit unterschiedlicher Rolle (z. B. Angreifer, skeptischer Investor). Sie erhalten nur den Prüfgegenstand, nicht die eigene Einschätzung.
- `Explore` — bei Code: Angriffsfläche (Routes, Actions, Policies) kartieren.

## 6. Qualitätskontrolle
- [ ] Jeder Befund ist konkret und belegbar (Zitat, Datei:Zeile oder Zahl), nicht generisch.
- [ ] Mindestens ein Befund stellt eine Kernannahme infrage.
- [ ] Gegenmaßnahmen sind umsetzbar, nicht „besser aufpassen“.
- [ ] Ehrliches Urteil, auch wenn es unbequem ist.

## 7. Ausgabeformat
```markdown
# Red Team: <Gegenstand>
**Urteil:** fortfahren | mit Auflagen | stoppen
## Tragende Annahmen (und wie belastbar)
## Befunde
| Schwere | Befund | Beleg | Szenario | Gegenmaßnahme | Frühwarnindikator |
## Pre-Mortem (Top 5)
## Auflagen vor Freigabe
```
