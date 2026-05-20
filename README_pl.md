# Ukryj obejrzane filmy YouTube

Dodatek do Firefoksa, który automatycznie ukrywa obejrzane filmy na stronach kanałów YouTube.

> **[English README →](README.md)**

---

## Funkcje

- **Automatyczne ukrywanie** na podstawie wbudowanego paska postępu YouTube — żadnego dodatkowego śledzenia.
- **Konfigurowalny próg** (1–100%): ukryj filmy obejrzane w ≥ 90% (domyślnie) albo każdy zaczęty (ustaw 1%).
- **Włącz/wyłącz** jednym kliknięciem w popupie na pasku narzędzi.
- **Tylko strony kanałów** — nie ingeruje w stronę główną, wyniki wyszukiwania ani odtwarzacz.
- **Nieinwazyjny** — używa wyłącznie `display: none` przez klasę CSS; brak zbierania danych ani zewnętrznych żądań sieciowych.
- **Dwujęzyczny** — język dopasowywany automatycznie (angielski lub polski) na podstawie ustawień przeglądarki.

## Instalacja

### Ładowanie tymczasowe (bez podpisywania)

Dodatek nie jest jeszcze opublikowany na [addons.mozilla.org](https://addons.mozilla.org). Można go załadować tymczasowo — działa do momentu restartu Firefoksa.

1. Pobierz najnowszy [plik `.zip` z Releases](../../releases/latest) i rozpakuj go **lub** sklonuj to repozytorium.
2. W Firefoksie otwórz `about:debugging`.
3. Kliknij **Ten Firefox** po lewej stronie.
4. Kliknij **Załaduj dodatek tymczasowo…** i wskaż plik `manifest.json` z rozpakowanego/sklonowanego folderu.
5. Ikona dodatku pojawi się na pasku narzędzi.

### Budowanie paczki `.zip` samodzielnie

```bash
git clone https://github.com/voitek123/hide-watched-youtube-videos.git
cd hide-watched-youtube-videos
bash build.sh
```

Skrypt tworzy `hide-watched-youtube-videos.zip`, który można załadować przez `about:debugging`.

## Jak to działa

Gdy oglądasz film na YouTube będąc zalogowanym z włączoną historią, YouTube renderuje czerwony pasek postępu pod miniaturką. Dodatek odczytuje szerokość tego elementu (inline style `width` jako procent) i ukrywa kartę wideo, jeśli postęp osiągnie lub przekroczy skonfigurowany próg.

### Dlaczego tylko strony kanałów?

Dodatek celowo nic nie robi poza adresami URL kanałów (`/@handle`, `/channel/…`, `/c/…`, `/user/…`). Ograniczenie zakresu unika skutków ubocznych na stronie głównej, w wynikach wyszukiwania i — co ważne — w samym odtwarzaczu wideo.

### Uwaga o WebGL

`MutationObserver` obserwuje wyłącznie `childList` — **nie obserwuje zmian atrybutów**. Wcześniejsze wersje śledziły mutacje atrybutów `style` i `class` w całym dokumencie, co uruchamiało się przy każdej klatce renderowanej przez WebGL YouTube i powodowało awarie odtwarzacza. Naprawione w v1.2+.

## Wymagania

- Firefox 109 lub nowszy
- Konto YouTube z **włączoną historią oglądania**
  *(Ustawienia YouTube → Twoje dane w YouTube → Historia YouTube)*

## Rozwiązywanie problemów

**Filmy nie są ukrywane:**
1. Upewnij się, że jesteś na zakładce *Wideo* kanału.
2. Sprawdź, czy historia oglądania jest włączona w ustawieniach konta YouTube.
3. Włącz **Tryb diagnostyczny** w popupie, odśwież stronę kanału i otwórz konsolę przeglądarki (F12 → Konsola). Powinien pojawić się wpis:
   ```
   [Hide watched Youtube videos] channel page | total: 24 | with progress: 6 | hidden: 6 (threshold 90%)
   ```
   Jeśli `with progress` wynosi 0, YouTube mógł zmienić strukturę DOM — zgłoś problem jako Issue.

**Dodatek znika po restarcie Firefoksa:**
To normalne zachowanie dla tymczasowo załadowanych dodatków. Aby działał na stałe, musiałby zostać podpisany przez Mozillę przez [addons.mozilla.org](https://addons.mozilla.org).

## Wkład w projekt

Issues i pull requesty są mile widziane!

Zgłaszając błąd, podaj:
- Wersję Firefoksa (dostępna pod `about:support`)
- Wyjście konsoli z trybu diagnostycznego (patrz wyżej)
- Adres URL kanału, gdzie problem występuje (opcjonalnie)

## Licencja

[MIT](LICENSE)
