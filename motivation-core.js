// ============================================================
//  MOTIVATION CORE – gemeinsame Logik für App (Browser) und Server
//  Ein Spruch pro Kalendertag in Europe/Berlin, rein deterministisch.
//  Wird von index.html per <script> und von den Serverfunktionen
//  per require() geladen, damit die Push-Nachricht um 06:30 Uhr exakt
//  denselben Spruch trägt wie die Karte im Dashboard.
//
//  Auswahl: Jeder Zyklus von QUOTES.length Tagen ist eine eigene
//  Zufallsreihenfolge mit festem Seed. Jeder Spruch kommt pro Zyklus
//  genau einmal vor, nie derselbe an zwei Tagen hintereinander.
//
//  Pflege: Einträge {t:'Text'} oder {t:'Text', a:'Autor'}.
//  Autor NUR angeben, wenn das Zitat belegt ist (deutsche Fassung ist
//  dann eine Übersetzung). Alles ohne `a` sind Eigenformulierungen.
// ============================================================
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MotivationCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const TZ = 'Europe/Berlin';
  const SEND_HOUR = 6, SEND_MINUTE = 30;      // tägliche Zustellung 06:30 Uhr
  const WINDOW_END_MINUTES = 9 * 60;          // Nachhol-Fenster bis 09:00 Uhr

  const QUOTES = [
  // ── Disziplin statt Motivation ──
  {t:'Motivation ist ein Gefühl, Disziplin ist eine Entscheidung. Triff sie vor dem ersten Kaffee.'},
  {t:'Du brauchst keine Lust. Du brauchst einen Plan und die Bereitschaft, ihn auch dann zu befolgen, wenn es unbequem ist.'},
  {t:'Wer auf Motivation wartet, überlässt seine Ergebnisse der Tagesstimmung.'},
  {t:'Disziplin heißt, das Richtige zu tun, obwohl das Bequeme gerade lauter ruft.'},
  {t:'Der Wecker klingelt einmal. Die Entscheidung fällt in den ersten fünf Sekunden.'},
  {t:'Gewohnheiten schlagen Vorsätze. Baue Abläufe, die auch an schlechten Tagen funktionieren.'},
  {t:'Lust ist unzuverlässig. Struktur nicht.'},
  {t:'Eine Verpflichtung, die du nur bei guter Laune einhältst, ist keine Verpflichtung, sondern eine Laune.'},
  {t:'Mach es zur Regel, nicht zur Verhandlung. Wer täglich neu verhandelt, verliert irgendwann.'},
  {t:'Der erste Handgriff des Tages gibt den Ton an. Mach ihn zu einem, auf den du stolz bist.'},
  {t:'Disziplin ist die leiseste Form von Selbstachtung.'},
  {t:'Fang an, bevor du bereit bist. Bereit fühlst du dich ohnehin erst danach.'},
  {t:'Wer sich morgens selbst besiegt, muss tagsüber nur noch gegen die Aufgaben antreten.'},
  {t:'Wenn du am Morgen nur schwer aus dem Bett kommst, denk daran: Ich stehe auf, um die Arbeit eines Menschen zu tun.', a:'Marc Aurel'},

  // ── Konsequenz & Durchhaltevermögen ──
  {t:'Ergebnisse sind die Zinsen auf Wiederholung.'},
  {t:'Der Unterschied zwischen gut und außergewöhnlich ist oft nur die Zahl der Tage, an denen jemand weitergemacht hat.'},
  {t:'Nicht Tempo entscheidet, sondern die Weigerung, stehen zu bleiben.'},
  {t:'Tag 1 ist Begeisterung. Tag 30 ist Charakter.'},
  {t:'Ein schlechter Tag ist kein Grund, einen Plan aufzugeben. Er ist der Moment, in dem er sich bewährt.'},
  {t:'Zäh ist die Stelle, an der die meisten umkehren. Genau dort entscheidet sich, wer ankommt.'},
  {t:'Wer jeden Tag ein kleines Stück liefert, überholt den, der einmal im Monat alles will.'},
  {t:'Durchhalten ist keine Eigenschaft, sondern eine Serie von Entscheidungen.'},
  {t:'Man gewinnt nicht durch den einen großen Tag, sondern durch die vielen unspektakulären.'},
  {t:'Wer nur an guten Tagen liefert, hat keine Konstanz, sondern Glück.'},
  {t:'Beharrlichkeit sieht von außen langweilig aus. Von innen heißt sie Fortschritt.'},
  {t:'Der Widerstand wächst kurz vor dem Durchbruch. Bleib genau dann dran.'},
  {t:'Nimm das Versprechen an dich selbst so ernst wie ein Versprechen an einen Kunden.'},
  {t:'Kein großes Ding entsteht plötzlich.', a:'Epiktet'},
  {t:'Eine Reise von tausend Meilen beginnt mit dem ersten Schritt.', a:'Laozi'},

  // ── Erfolg & unternehmerisches Denken ──
  {t:'Ein Unternehmer löst Probleme, für die andere noch keinen Namen haben.'},
  {t:'Der Markt bezahlt nicht für Mühe, sondern für gelöste Probleme.'},
  {t:'Denke in Jahren, handle in Tagen.'},
  {t:'Qualität, die sich herumspricht, ist das beste Marketing, das man nicht bezahlen muss.'},
  {t:'Kunden erinnern sich an das Problem, das du gelöst hast, nicht an den Aufwand, den du dafür hattest.'},
  {t:'Verlass dich nicht auf Glück. Baue ein System, in dem Glück nur noch ein Bonus ist.'},
  {t:'Ein Angebot ist nur so stark wie das Vertrauen dahinter.'},
  {t:'Wachstum beginnt dort, wo du aufhörst, alles selbst zu machen, und anfängst, es richtig aufzusetzen.'},
  {t:'Jede Absage bringt dich einem Ja näher, sofern du aus ihr lernst.'},
  {t:'Zeit ist das einzige Kapital, das du nicht zurückholen kannst. Investiere es entsprechend.'},
  {t:'Wer seine Zahlen kennt, muss weniger raten. Wer weniger rät, entscheidet schneller.'},
  {t:'Ein Betrieb wächst mit der Qualität seiner Entscheidungen, nicht mit der Länge seiner Arbeitstage.'},
  {t:'Aufträge folgen der Verlässlichkeit: pünktlich, sauber, wie versprochen.'},
  {t:'Nichts ist so nutzlos, wie etwas effizient zu tun, das gar nicht getan werden sollte.', a:'Peter Drucker'},
  {t:'Verschwende keine Zeit, denn aus ihr ist das Leben gemacht.', a:'Benjamin Franklin'},

  // ── Verantwortung & Selbstständigkeit ──
  {t:'Erklärungen ändern nichts. Entscheidungen schon.'},
  {t:'Niemand kommt, um dein Leben zu ordnen. Das ist keine schlechte Nachricht, sondern eine Einladung.'},
  {t:'Wer die Verantwortung trägt, trägt auch die Möglichkeit, etwas zu ändern.'},
  {t:'Schuld zu suchen kostet Zeit. Verantwortung zu übernehmen spart sie.'},
  {t:'Eigenständigkeit beginnt mit dem Satz: Das liegt an mir, also kann ich es lösen.'},
  {t:'Erwarte nicht, dass es jemand für dich tut. Erwarte, dass du es hinbekommst.'},
  {t:'Wer sein Wort hält, braucht selten viele Verträge.'},
  {t:'Verlässlichkeit ist ein Versprechen, das du jeden Tag neu einlöst.'},
  {t:'Zuständigkeit ist keine Last, sondern der Beweis, dass man dir etwas zutraut.'},
  {t:'Wenn etwas schiefgeht: erst die Lage, dann die Lösung. Die Schuldfrage hat Zeit bis nach der Reparatur.'},
  {t:'Wer sich selbst führt, muss anderen weniger erklären.'},
  {t:'Freiheit ist das Ergebnis von Pflichten, die du freiwillig und gründlich erfüllst.'},
  {t:'Dein Kalender ist deine Prioritätenliste in ehrlicher Form.'},
  {t:'Habe Mut, dich deines eigenen Verstandes zu bedienen.', a:'Immanuel Kant'},
  {t:'Es ist nicht genug zu wissen, man muss auch anwenden; es ist nicht genug zu wollen, man muss auch tun.', a:'Johann Wolfgang von Goethe'},

  // ── Fokus & Produktivität ──
  {t:'Eine Sache zuerst, dann die nächste. Mehr kann kein Mensch gut.'},
  {t:'Beschäftigt sein ist nicht dasselbe wie wirken.'},
  {t:'Die wichtigste Aufgabe des Tages gehört in die erste Stunde, nicht in die letzte.'},
  {t:'Fokus ist die Kunst, zu den meisten Dingen Nein zu sagen.'},
  {t:'Ablenkung fragt nicht um Erlaubnis. Schütze deine Konzentration wie dein Werkzeug.'},
  {t:'Zwei Stunden ungestörte Arbeit schlagen acht Stunden Erreichbarkeit.'},
  {t:'Was du nicht planst, plant jemand anderes für dich.'},
  {t:'Ein klares Ziel für heute ist mehr wert als zehn vage für dieses Jahr.'},
  {t:'Fang mit dem Unangenehmen an. Der Rest des Tages wird leichter.'},
  {t:'Multitasking ist nur ein anderes Wort dafür, mehrere Dinge schlecht zu tun.'},
  {t:'Was sich in zehn Minuten erledigen lässt, gehört nicht auf die Liste, sondern in die nächste Viertelstunde.'},
  {t:'Wer jede Nachricht sofort beantwortet, arbeitet für die Prioritäten anderer.'},
  {t:'Tiefe Arbeit entsteht dort, wo das Telefon in der Schublade liegt.'},
  {t:'Tempo kommt aus Klarheit. Kläre zuerst, was „fertig“ bedeuten soll.'},

  // ── Qualität & Leistungsbereitschaft ──
  {t:'Arbeite so gut, dass du es jedem zeigen würdest, auch wenn niemand hinsieht.'},
  {t:'Qualität ist das, was bleibt, wenn der Zeitdruck längst vergessen ist.'},
  {t:'Wer sauber arbeitet, muss nicht zweimal arbeiten.'},
  {t:'Das Detail, das keiner bemerkt, ist oft das, das dich ausmacht.'},
  {t:'„Gut genug“ ist ein Anfang. Eine Haltung ist mehr.'},
  {t:'Handwerk heißt: Es wird richtig gemacht, auch wenn es niemand kontrolliert.'},
  {t:'Leistung beginnt mit der Bereitschaft, mehr zu geben, als gerade verlangt wird.'},
  {t:'Ein Auftrag ist erst fertig, wenn der Kunde sagt: Genau so.'},
  {t:'Standards sind keine Obergrenze, sondern der Boden, unter den du nicht fällst.'},
  {t:'Stolz auf die eigene Arbeit ist die beste Qualitätskontrolle.'},
  {t:'Können ist die Summe aus Tausenden kleinen Dingen, die richtig gemacht wurden.'},
  {t:'Wer gründlich arbeitet, hat am Ende mehr Zeit als der, der es eilig hatte.'},
  {t:'Wir sind, was wir wiederholt tun. Vortrefflichkeit ist daher keine Handlung, sondern eine Gewohnheit.', a:'Will Durant'},

  // ── Persönliche Weiterentwicklung ──
  {t:'Wer heute lernt, was er morgen braucht, ist dem Problem einen Tag voraus.'},
  {t:'Wachstum fühlt sich anfangs an wie Unfähigkeit. Halte das aus.'},
  {t:'Du musst nicht besser sein als andere. Nur besser als der, der du gestern warst.'},
  {t:'Jedes Buch, jedes Gespräch, jeder Fehler ist Material, wenn du es auswertest.'},
  {t:'Fehler sind teuer, wenn man sie wiederholt, und billig, wenn man aus ihnen lernt.'},
  {t:'Unbequemlichkeit ist der Preis für alles, was du noch nicht kannst.'},
  {t:'Werte deine Arbeit aus: Was lief gut, was geht besser? Ohne diese Frage wiederholst du nur.'},
  {t:'Ehrliches Feedback ist ein Geschenk, auch wenn es sich nicht so anfühlt.'},
  {t:'Lerne, bis dein Können kein Zufall mehr ist.'},
  {t:'Wer nicht mehr dazulernt, steht nicht still. Er fällt zurück.'},
  {t:'Wende deine Aufmerksamkeit dem zu, was du verbessern kannst, nicht dem, was dich ärgert.'},
  {t:'Zuerst sage dir, was du sein willst; dann tue, was dafür nötig ist.', a:'Epiktet'},
  {t:'Vergeude keine Zeit mehr damit, darüber zu streiten, wie ein guter Mensch sein soll. Sei einer.', a:'Marc Aurel'},

  // ── Zielstrebigkeit & tägliche Verbesserung ──
  {t:'Wer sein Ziel kennt, findet den Weg. Wer es nicht kennt, findet Ausreden.'},
  {t:'Schreibe dein Ziel auf. Danach schreibe auf, was du heute dafür tust.'},
  {t:'Kleine Schritte in die richtige Richtung schlagen große Sprünge ins Ungewisse.'},
  {t:'Jeder Tag, an dem du dich ein Stück verbesserst, ist ein gewonnener Tag.'},
  {t:'Prüfe jeden Abend: Bin ich dem Ziel heute nähergekommen oder nur beschäftigt gewesen?'},
  {t:'Ein Ziel ohne Termin ist ein Wunsch.'},
  {t:'Teile das große Ziel, bis der nächste Schritt lächerlich einfach ist.'},
  {t:'Richtung vor Geschwindigkeit. Wer falsch läuft, kommt nur schneller falsch an.'},
  {t:'Mach den Fortschritt sichtbar. Was du siehst, machst du weiter.'},
  {t:'Der Plan darf sich ändern. Das Ziel nicht.'},
  {t:'Messe, was zählt. Der Rest ist Rauschen.'},
  {t:'Wer nicht weiß, welchen Hafen er ansteuert, für den ist kein Wind günstig.', a:'Seneca'},
  {t:'Nicht weil es schwer ist, wagen wir es nicht; sondern weil wir es nicht wagen, ist es schwer.', a:'Seneca'},
  {t:'Es ist nicht wenig Zeit, die wir haben, sondern viel, die wir nicht nutzen.', a:'Seneca'},

  // ── Selbstbeherrschung & mentale Stärke ──
  {t:'Du kannst nicht kontrollieren, was passiert. Du kannst kontrollieren, was du daraus machst.'},
  {t:'Gelassenheit ist keine Schwäche, sondern Kraft mit Kontrolle.'},
  {t:'Zwischen Impuls und Handlung liegt deine Freiheit. Nutze sie.'},
  {t:'Stärke zeigt sich nicht, wenn alles läuft, sondern wenn nichts läuft und du trotzdem weitermachst.'},
  {t:'Wer sich selbst im Griff hat, den bringt so schnell nichts aus der Fassung.'},
  {t:'Atme, bevor du reagierst. Die besten Antworten brauchen drei Sekunden.'},
  {t:'Unangenehm ist nicht gefährlich. Lerne den Unterschied.'},
  {t:'Mentale Stärke trainiert man wie einen Muskel: durch Widerstand, nicht durch Schonung.'},
  {t:'Unsicherheit zeigt dir oft, wo dein nächster Schritt liegt.'},
  {t:'Du musst dich nicht gut fühlen, um gut zu handeln.'},
  {t:'Frühes Aufstehen, die kalte Dusche, das Nein zum Snack: Kleine Siege trainieren große Stärke.'},
  {t:'Wer seine Stimmung nicht den Umständen überlässt, behält die Führung.'},
  {t:'Wer ein Warum zu leben hat, erträgt fast jedes Wie.', a:'Friedrich Nietzsche'},
  {t:'Nicht die Dinge selbst beunruhigen die Menschen, sondern ihre Urteile über die Dinge.', a:'Epiktet'},
  {t:'Wir leiden öfter in der Einbildung als in der Wirklichkeit.', a:'Seneca'},
];

  // Abschlusszeile der Push-Nachricht, wechselt täglich.
  const CLOSINGS = [
    'Heute ist eine neue Gelegenheit, besser zu werden. Nutze sie.',
    'Steh auf. Der Tag wartet nicht.',
    'Raus aus dem Bett, rein in den Tag.',
    'Training zuerst, dann die Arbeit. Los.',
    'Mach den Anfang. Der Rest folgt.',
    'Heute zählt, was du tust, nicht, was du vorhast.',
    'Fang jetzt an.',
  ];

  const WEEKDAYS = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const pad = n => String(n).padStart(2, '0');

  // Datum und Uhrzeit in Berlin, unabhängig von der Zeitzone des Geräts/Servers.
  // Sommer- und Winterzeit übernimmt die Zeitzonendatenbank der Laufzeit.
  function berlinNow(now = new Date()) {
    const p = {};
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(now).forEach(x => { p[x.type] = +x.value; });
    return { y: p.year, m: p.month, d: p.day, h: p.hour, min: p.minute };
  }

  // Fortlaufende Tageszahl (Tage seit 1970-01-01) des Berliner Kalendertags.
  const dayNumber = ({ y, m, d }) => Math.floor(Date.UTC(y, m - 1, d) / 86400000);

  // Kleiner deterministischer Zufallsgenerator (mulberry32).
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Reihenfolge aller Sprüche für einen Zyklus (Fisher-Yates mit festem Seed).
  function order(cycle, n) {
    const idx = Array.from({ length: n }, (_, i) => i);
    const rand = rng(cycle * 2654435761 + 1013904223);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }

  // Index des Spruchs für eine Tageszahl.
  function indexFor(day, n = QUOTES.length) {
    const cycle = Math.floor(day / n), pos = day - cycle * n;
    const cur = order(cycle, n);
    if (cycle > 0 && n > 1) {
      // Grenze zwischen zwei Zyklen: kein identischer Spruch an zwei Tagen hintereinander.
      const prevLast = order(cycle - 1, n)[n - 1];
      if (cur[0] === prevLast) [cur[0], cur[1]] = [cur[1], cur[0]];
    }
    return cur[pos];
  }

  function greeting(h) {
    if (h >= 5 && h < 11) return 'Guten Morgen';
    if (h >= 11 && h < 17) return 'Guten Tag';
    if (h >= 17 && h < 22) return 'Guten Abend';
    return 'Gute Nacht';
  }

  // Alles, was für einen Zeitpunkt gilt: Berliner Datum, Spruch, Begrüßung.
  function forDate(now = new Date()) {
    const b = berlinNow(now), day = dayNumber(b);
    const wd = WEEKDAYS[new Date(Date.UTC(b.y, b.m - 1, b.d)).getUTCDay()];
    return {
      day, h: b.h, min: b.min,
      dateKey: `${b.y}-${pad(b.m)}-${pad(b.d)}`,
      dateLabel: `${wd}, ${b.d}. ${MONTHS[b.m - 1]} ${b.y}`,
      greeting: greeting(b.h),
      quote: QUOTES[indexFor(day)],
    };
  }

  // Liegt der Zeitpunkt im Zustellfenster (06:30 bis vor 09:00 Uhr Berlin)?
  function inSendWindow(now = new Date()) {
    const b = berlinNow(now), mins = b.h * 60 + b.min;
    return mins >= SEND_HOUR * 60 + SEND_MINUTE && mins < WINDOW_END_MINUTES;
  }

  // Inhalt der Push-Benachrichtigung für den Berliner Tag von `now`.
  function notification(now = new Date(), opts = {}) {
    const t = forDate(now);
    const name = String(opts.name || '').trim().slice(0, 40);
    const quote = t.quote.a ? `${t.quote.t}\n— ${t.quote.a}` : t.quote.t;
    return {
      title: name ? `Guten Morgen, ${name}! ☀️` : 'Guten Morgen! ☀️',
      body: `${quote}\n\n${CLOSINGS[t.day % CLOSINGS.length]}`,
      tag: `dm-${t.dateKey}`,
      date: t.dateKey,
      url: './?motivation=1#/dashboard',
    };
  }

  return { TZ, SEND_HOUR, SEND_MINUTE, QUOTES, CLOSINGS, berlinNow, dayNumber, indexFor, greeting, forDate, inSendWindow, notification };
});
