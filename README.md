# Kalkulator wyceny breloczka 3D (Next.js)

Kalkulator pozwalający oszacować koszt wydruku breloczka na drukarce 3D. Aplikacja działa jako projekt Next.js (App Router) i wykonuje całą logikę po stronie klienta.

## Funkcje

- wgrywanie pliku STL z automatycznym obliczaniem objętości modelu (obsługa binarnego oraz ASCII STL),
- obsługa obrazów/logo (PNG, JPG, SVG) z ręcznym podaniem wymiarów breloczka,
- konfiguracja parametrów druku: materiał (PLA, PLA+, PETG, ABS, ASA, TPU, Nylon, CF-mieszanki, PC, PA-CF/PA-GF), wypełnienie (predefiniowane warianty), grubość,
- możliwość doliczenia dodatków takich jak zatopienie tagu NFC, pokrycie żywicą lub dołączenie łańcuszka,
- uwzględnianie liczby sztuk wraz z automatycznym rabatem ilościowym (5% ≥ 30 szt., 7% ≥ 50 szt., 10% ≥ 100 szt., 20% ≥ 200 szt., 28% ≥ 400 szt., 32% ≥ 600 szt., 40% ≥ 1000 szt., min. 4 zł/szt.),
- szacowanie objętości, zużycia filamentu, czasu pracy maszyny oraz łącznego kosztu (materiał + czas + opłata startowa + dodatki).

## Uruchomienie

> Uwaga: instalacja zależności wymaga dostępu do npm/yarn.

```bash
npm install
npm run dev
```

Następnie otwórz w przeglądarce `http://localhost:3000`.

## Założenia i uproszczenia

- Jednostki modeli STL traktowane są jako milimetry.
- 35% objętości odpowiada perymetrom, pozostała część jest skalowana współczynnikiem wypełnienia.
- Prędkość druku przyjęto na poziomie 12 000 mm³/h, stawka maszyny to 12 zł/h, a opłata przygotowawcza (weryfikacja grafiki i przygotowanie projektu) wynosi 20 zł i jest liczona jednorazowo na zamówienie.
- Rabat ilościowy dotyczy kosztu jednostkowego (materiał + czas + dodatki); opłata startowa pozostaje bez zmian.
- Cena jednostkowa jest ograniczona od dołu do 4 zł, aby zachować minimalną marżę przy dużych nakładach.
- Algorytm ma charakter orientacyjny i powinien zostać dostosowany do realnych kosztów konkretnej drukarni.

## Dalszy rozwój

- Walidacja poprawności siatki STL (np. wykrywanie modeli niezamkniętych).
- Wizualizacja podglądu STL (np. z wykorzystaniem Three.js).
- Eksport arkusza PDF lub wysyłka podsumowania mailem.
