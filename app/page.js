"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const MATERIALS = {
  pla: {
    label: "PLA",
    density: 1.24,
    pricePerGram: 0.1,
    color: "#f97316",
    priceRange: "0,09–0,11 zł/g",
    usage: "Elementy dekoracyjne, prototypy, zastosowania w niskich temperaturach.",
    notes: "Łatwy w druku, ale ma niską odporność termiczną.",
  },
  plaPlus: {
    label: "PLA+ / PLA Silk / PLA Matte",
    density: 1.24,
    pricePerGram: 0.12,
    color: "#22c55e",
    priceRange: "0,10–0,13 zł/g",
    usage: "Ozdoby, figurki, detale wymagające lepszej estetyki powierzchni.",
    notes: "Różnice głównie wizualne, zachowuje łatwość druku PLA.",
  },
  petg: {
    label: "PETG",
    density: 1.27,
    pricePerGram: 0.12,
    color: "#06b6d4",
    priceRange: "0,10–0,13 zł/g",
    usage: "Części użytkowe, obudowy, uchwyty, elementy na zewnątrz.",
    notes: "Mocny, lekko elastyczny, odporny na UV.",
  },
  abs: {
    label: "ABS",
    density: 1.04,
    pricePerGram: 0.13,
    color: "#64748b",
    priceRange: "0,11–0,14 zł/g",
    usage: "Części techniczne, obudowy, elementy mechaniczne.",
    notes: "Wymaga grzanego stołu i komory, wydziela opary.",
  },
  asa: {
    label: "ASA",
    density: 1.07,
    pricePerGram: 0.14,
    color: "#ef4444",
    priceRange: "0,12–0,15 zł/g",
    usage: "Elementy zewnętrzne narażone na UV i wyższe temperatury.",
    notes: "Lepsza odporność na warunki atmosferyczne niż ABS.",
  },
  tpu: {
    label: "TPU / TPE",
    density: 1.19,
    pricePerGram: 0.16,
    color: "#8b5cf6",
    priceRange: "0,13–0,18 zł/g",
    usage: "Elastyczne elementy, uszczelki, amortyzatory.",
    notes: "Elastyczny, druk wymaga niższych prędkości i odpowiedniego podawania.",
  },
  nylon: {
    label: "Nylon (PA)",
    density: 1.15,
    pricePerGram: 0.2,
    color: "#f8fafc",
    priceRange: "0,17–0,22 zł/g",
    usage: "Wytrzymałe elementy mechaniczne, funkcjonalne prototypy.",
    notes: "Wymaga suszenia i najlepiej zamkniętej komory.",
  },
  cfPetg: {
    label: "CF-PETG / CF-PLA",
    density: 1.2,
    pricePerGram: 0.23,
    color: "#334155",
    priceRange: "0,20–0,25 zł/g",
    usage: "Wzmocnione części techniczne i konstrukcyjne.",
    notes: "Bardzo sztywne; włókna ścierają standardowe dysze.",
  },
  pc: {
    label: "PC (Poliwęglan)",
    density: 1.2,
    pricePerGram: 0.25,
    color: "#60a5fa",
    priceRange: "0,22–0,28 zł/g",
    usage: "Elementy odporne na uderzenia i wysoką temperaturę.",
    notes: "Trudny w druku, wymaga wysokich temperatur i komory.",
  },
  paCf: {
    label: "PA-CF / PA-GF",
    density: 1.25,
    pricePerGram: 0.29,
    color: "#1f2937",
    priceRange: "0,24–0,33 zł/g",
    usage: "Przemysłowe części konstrukcyjne o bardzo wysokiej wytrzymałości.",
    notes: "Wymaga komory, dysz ze stali hartowanej oraz suszenia.",
  },
};

const PRINT_SPEED_MM3_PER_HOUR = 12000;
const HOURLY_RATE = 12;
const SETUP_FEE = 20;
const MIN_PRINT_TIME_HOURS = 0.35;
const MIN_UNIT_PRICE = 4;

const ADD_ONS = {
  nfc: {
    label: "Zatapianie tagu NFC",
    price: 2,
    description: "Wymaga wkładania tagu i dodatkowego post-processingu.",
  },
  resin: {
    label: "Pokrycie żywicą UV",
    price: 3,
    description: "Dodaje połysk oraz dodatkową ochronę powierzchni.",
  },
  chain: {
    label: "Dołączenie łańcuszka / kółka",
    price: 1,
    description: "Łańcuszek niklowany z kółkiem montażowym.",
  },
};

const numberFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export default function Page() {
  const [navOpen, setNavOpen] = useState(false);
  const [material, setMaterial] = useState("pla");
  const [inputs, setInputs] = useState({
    width: "50",
    height: "50",
    thickness: "5",
    infill: "15",
    quantity: "1",
    addOns: [],
  });
  const [modelData, setModelData] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [warning, setWarning] = useState(null);
  const [results, setResults] = useState(null);
  const [parsing, setParsing] = useState(false);
  const currentYear = new Date().getFullYear();

  const toggleNav = useCallback(() => {
    setNavOpen((prev) => !prev);
  }, []);

  const closeNav = useCallback(() => {
    setNavOpen(false);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setNavOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAddOnToggle = useCallback((event) => {
    const { value, checked } = event.target;
    setInputs((prev) => {
      const current = new Set(prev.addOns);
      if (checked) {
        current.add(value);
      } else {
        current.delete(value);
      }
      return { ...prev, addOns: Array.from(current) };
    });
  }, []);

  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    setModelData(null);
    setResults(null);
    setFileInfo(null);
    setFileLoaded(false);
    setWarning(null);

    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setWarning("Plik jest zbyt duży. Maksymalny rozmiar to 50 MB.");
      return;
    }

    if (isStlFile(file)) {
      setParsing(true);
      try {
        const parsedModel = await parseStlFile(file);
        setModelData(parsedModel);
        setInputs((prev) => ({
          ...prev,
          width: formatNumber(parsedModel.bbox.x),
          height: formatNumber(parsedModel.bbox.y),
          thickness: formatNumber(parsedModel.bbox.z || 5),
        }));
        setFileInfo(
          `${file.name} • Wymiary modelu: ${numberFormatter.format(
            parsedModel.bbox.x
          )} × ${numberFormatter.format(parsedModel.bbox.y)} × ${numberFormatter.format(
            parsedModel.bbox.z
          )} mm • Objętość: ${numberFormatter.format(parsedModel.volumeMm3)} mm³`
        );
        setFileLoaded(true);
      } catch (error) {
        console.error(error);
        setWarning(
          "Nie udało się odczytać modelu STL. Upewnij się, że plik jest poprawny."
        );
      } finally {
        setParsing(false);
      }
    } else {
      setFileLoaded(true);
      setFileInfo(
        `Wykryto plik graficzny: ${file.name}. Wprowadź docelowe wymiary, aby wyliczyć objętość breloczka.`
      );
    }
  }, []);

  const handleEstimate = useCallback(() => {
    try {
      const estimation = estimateCost(inputs, material, modelData);
      setResults(estimation);
      setWarning(null);
    } catch (error) {
      console.error(error);
      setWarning(
        "Nie udało się wykonać obliczeń. Sprawdź podane wartości lub wybrany plik."
      );
      setResults(null);
    }
  }, [inputs, material, modelData]);

  const selectedMaterial = MATERIALS[material] ?? MATERIALS.pla;
  const liveEstimate = useMemo(() => {
    if (!fileLoaded && !results) {
      return null;
    }
    try {
      return estimateCost(inputs, material, modelData);
    } catch {
      return null;
    }
  }, [fileLoaded, inputs, material, modelData, results]);

  const materialOptions = useMemo(
    () =>
      Object.entries(MATERIALS).map(([value, entry]) => (
        <option value={value} key={value}>
          {entry.label} ({entry.priceRange ?? `${entry.pricePerGram.toFixed(2)} zł/g`})
        </option>
      )),
    []
  );

  return (
    <>
      <header className="site-header" id="start">
        <nav className="top-nav">
          <a className="brand" href="#start" onClick={closeNav}>
            KarPas
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={navOpen}
            aria-controls="primary-navigation"
            onClick={toggleNav}
          >
            <span className="sr-only">
              {navOpen ? "Zamknij menu" : "Pokaż menu"}
            </span>
            <span className="menu-bar" />
            <span className="menu-bar" />
            <span className="menu-bar" />
          </button>
          <ul
            className={`nav-links${navOpen ? " is-open" : ""}`}
            id="primary-navigation"
          >
            <li>
              <a href="#calculator" onClick={closeNav}>
                Kalkulator
              </a>
            </li>
            <li>
              <a href="#materials" onClick={closeNav}>
                Materiały
              </a>
            </li>
            <li>
              <a href="#parameters" onClick={closeNav}>
                Parametry
              </a>
            </li>
            <li>
              <a href="#quote" onClick={closeNav}>
                Wycena
              </a>
            </li>
            <li>
              <a href="#contact" onClick={closeNav}>
                Kontakt
              </a>
            </li>
          </ul>
        </nav>

        <div className="hero">
          <div className="hero-content">
            <span className="eyebrow">KarPas • 3DCalc</span>
            <h1>Kalkulator wyceny druku 3D</h1>
            <p className="lead">
              Prześlij plik STL lub logo, dobierz materiał i poznaj orientacyjny
              koszt wydruku w stylu KarPas. Szybko sprawdzisz, jak wycenić małe
              serie i prototypy.
            </p>
            <div className="hero-actions">
              <a className="btn primary" href="#calculator" onClick={closeNav}>
                Oblicz wycenę
              </a>
              <a className="btn ghost" href="#contact" onClick={closeNav}>
                Kontakt
              </a>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card__title">Jak to działa</div>
            <ul className="hero-card__list">
              <li>
                Zlecenia 3D — idealne na krótkie serie i
                prototypy.
              </li>
              <li>
                Ustalenia robimy bez zbędnej formalności, stawiając na szybkie
                dopracowanie pomysłu.
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main>
        <section className="section accent" id="calculator">
          <div className="section-header">
            <span className="section-eyebrow">Kalkulator</span>
            <h2>Przelicz wycenę swojego breloczka</h2>
            <p>
              Wypełnij kolejne kroki, aby oszacować koszt materiału, czas druku
              oraz cenę jednostkową. Kalkulator bazuje na praktyce KarPas – możesz
              łatwo dostosować założenia do własnej drukarni.
            </p>
          </div>

          <div className="calculator-shell">
            <div className="panel-stack">
              <div className="panel compact" id="materials">
                <div className="panel-heading">
                  <span className="step-badge">01</span>
                  <h3>Materiał</h3>
                </div>
                <label className="field">
                  <span>Typ materiału</span>
                  <select
                    id="material"
                    value={material}
                    onChange={(event) => setMaterial(event.target.value)}
                  >
                    {materialOptions}
                  </select>
                </label>
                <div className="material-meta">
                  <span>
                    <strong>Średnia cena:</strong>{" "}
                    {selectedMaterial.priceRange ??
                      `${selectedMaterial.pricePerGram.toFixed(2)} zł/g`}
                  </span>
                  <span>
                    <strong>Zastosowanie:</strong> {selectedMaterial.usage}
                  </span>
                  <span>
                    <strong>Uwagi:</strong> {selectedMaterial.notes}
                  </span>
                </div>
              </div>

              <div className="panel compact" id="files">
                <div className="panel-heading">
                  <span className="step-badge">02</span>
                  <h3>Plik i geometria</h3>
                </div>
                <label className="field file-field">
                  <span>Plik STL lub logo</span>
                  <input
                    type="file"
                    id="fileInput"
                    accept=".stl,.STL,.svg,.SVG,image/*"
                    onChange={handleFileChange}
                    disabled={parsing}
                  />
                </label>
                {parsing && <p className="hint">Wczytuję plik STL…</p>}
                <p className="hint">
                  STL uzupełni wymiary i objętość automatycznie. Logo lub obraz
                  traktujemy jako płaski brelok według wymiarów poniżej.
                </p>
                <div
                  id="fileInfo"
                  className={fileInfo ? "info-box" : "info-box hidden"}
                >
                  {fileInfo}
                </div>
                <div
                  id="fileWarning"
                  className={warning ? "warning" : "warning hidden"}
                >
                  {warning}
                </div>
              </div>

              <div className="panel compact" id="parameters">
                <div className="panel-heading">
                  <span className="step-badge">03</span>
                  <h3>Wymiary i parametry</h3>
                </div>
                <div className="grid">
                  <label className="field">
                    <span>Szerokość [mm]</span>
                    <input
                      type="number"
                      id="widthInput"
                      name="width"
                      min="1"
                      step="0.1"
                      value={inputs.width}
                      onChange={handleInputChange}
                    />
                  </label>
                  <label className="field">
                    <span>Wysokość [mm]</span>
                    <input
                      type="number"
                      id="heightInput"
                      name="height"
                      min="1"
                      step="0.1"
                      value={inputs.height}
                      onChange={handleInputChange}
                    />
                  </label>
                  <label className="field">
                    <span>Grubość [mm]</span>
                    <input
                      type="number"
                      id="thicknessInput"
                      name="thickness"
                      min="1"
                      step="0.1"
                      value={inputs.thickness}
                      onChange={handleInputChange}
                    />
                  </label>
                  <label className="field">
                    <span>Ilość sztuk</span>
                    <input
                      type="number"
                      id="quantityInput"
                      name="quantity"
                      min="1"
                      step="1"
                      value={inputs.quantity}
                      onChange={handleInputChange}
                    />
                  </label>
                  <label className="field wide-field">
                    <span>Wypełnienie [%]</span>
                    <select
                      id="infillInput"
                      name="infill"
                      value={inputs.infill}
                      onChange={handleInputChange}
                    >
                      <option value="10">
                        10% — ekonomiczny wariant dla lekkich breloczków
                      </option>
                      <option value="15">15% — domyślna równowaga</option>
                      <option value="20">20% — większa sztywność</option>
                      <option value="30">30% — solidne elementy</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="panel compact" id="add-ons">
                <div className="panel-heading">
                  <span className="step-badge">04</span>
                  <h3>Dodatkowe opcje</h3>
                </div>
                <fieldset className="add-ons">
                  {Object.entries(ADD_ONS).map(([value, option]) => (
                    <label key={value} className="add-on">
                      <input
                        type="checkbox"
                        value={value}
                        checked={inputs.addOns.includes(value)}
                        onChange={handleAddOnToggle}
                      />
                      <div>
                        <span className="add-on__name">
                          {option.label} (+{numberFormatter.format(option.price)} zł)
                        </span>
                        <span className="add-on__description">
                          {option.description}
                        </span>
                      </div>
                    </label>
                  ))}
                </fieldset>
              </div>

              <div className="panel quote-panel" id="quote">
                <div className="panel-heading">
                  <span className="step-badge">05</span>
                  <h3>Wycena</h3>
                </div>
                <button
                  id="estimateButton"
                  className="btn primary"
                  type="button"
                  onClick={handleEstimate}
                >
                  Oblicz orientacyjny koszt
                </button>
                <EstimationResults results={results} />
              </div>
            </div>

            <aside className="preview-column" aria-label="Podgląd elementu">
              <PrintPreview
                inputs={inputs}
                material={selectedMaterial}
                modelData={modelData}
                estimate={liveEstimate}
                hasEstimateContext={fileLoaded || Boolean(results)}
              />
            </aside>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="contact-card">
            <div className="contact-info">
              <h3>KarPas</h3>
              <a className="contact-link" href="mailto:app@karpas.pl">
                app@karpas.pl
              </a>
            </div>
            <div className="contact-cta">
              <p className="contact-highlight">
                Masz większy projekt lub chcesz porozmawiać o prototypie?
              </p>
              <a className="btn primary" href="mailto:app@karpas.pl">
                Napisz do nas
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>© {currentYear} KarPas. Wszystkie prawa zastrzeżone.</p>
      </footer>
    </>
  );
}

function EstimationResults({ results }) {
  if (!results) {
    return (
      <div id="results" className="results hidden">
        <h3>Szacunkowe parametry wydruku</h3>
      </div>
    );
  }

  const {
    baseVolumeMm3,
    effectiveVolumeMm3,
    massGrams,
    materialCost,
    printTimeHours,
    addOnCost,
    selectedAddOns,
    quantity,
    discountRate,
    unitPrice,
    setupCost,
    priceFloorApplied,
    totalCost,
  } = results;

  const baseVolumeCm3 = baseVolumeMm3 / 1000;
  const effectiveVolumeCm3 = effectiveVolumeMm3 / 1000;

  return (
    <div id="results" className="results">
      <h3>Szacunkowe parametry wydruku</h3>
      <ul>
        <li>
          <strong>Objętość efektywna:</strong>{" "}
          <span>
            {numberFormatter.format(effectiveVolumeCm3)} cm³ (geometryczna:{" "}
            {numberFormatter.format(baseVolumeCm3)} cm³)
          </span>
        </li>
        <li>
          <strong>Zużycie filamentu:</strong>{" "}
          <span>{numberFormatter.format(massGrams)} g</span>
        </li>
        <li>
          <strong>Czas druku:</strong>{" "}
          <span>{numberFormatter.format(printTimeHours)} h</span>
        </li>
        <li>
          <strong>Ilość sztuk:</strong> <span>{quantity}</span>
        </li>
        <li>
          <strong>Rabat ilościowy:</strong>{" "}
          <span>
            {discountRate > 0
              ? `${numberFormatter.format(discountRate * 100)}%`
              : "brak"}
          </span>
        </li>
        {priceFloorApplied && (
          <li>
            <strong>Cena jednostkowa:</strong>{" "}
            <span>
              {numberFormatter.format(MIN_UNIT_PRICE)} zł (zachowana minimalna
              stawka)
            </span>
          </li>
        )}
        <li>
          <strong>Koszt materiału (1 szt.):</strong>{" "}
          <span>{numberFormatter.format(materialCost)} zł</span>
        </li>
        <li>
          <strong>Dodatkowe opcje (1 szt.):</strong>{" "}
          <span>
            {selectedAddOns.length > 0
              ? `${numberFormatter.format(addOnCost)} zł (${selectedAddOns
                  .map((key) => ADD_ONS[key]?.label ?? key)
                  .join(", ")})`
              : "brak"}
          </span>
        </li>
        <li>
          <strong>Koszt przygotowania (jednorazowo):</strong>{" "}
          <span>
            {numberFormatter.format(setupCost)} zł (weryfikacja grafiki i
            przygotowanie projektu)
          </span>
        </li>
        <li>
          <strong>Cena za sztukę (po rabacie):</strong>{" "}
          <span>{numberFormatter.format(unitPrice)} zł</span>
        </li>
        <li>
          <strong>Łączny koszt:</strong>{" "}
          <span>{numberFormatter.format(totalCost)} zł</span>
        </li>
      </ul>
      <p className="hint">
        Wycena ma charakter orientacyjny. W rzeczywistości uwzględnij czas
        przygotowania, ewentualne podpory i poproszenie klienta o akceptację.
      </p>
    </div>
  );
}

function PrintPreview({
  inputs,
  material,
  modelData,
  estimate,
  hasEstimateContext,
}) {
  const width = parseDimension(inputs.width, 50);
  const height = parseDimension(inputs.height, 50);
  const thickness = parseDimension(inputs.thickness, 5);
  const quantity = Math.max(1, Number.parseInt(inputs.quantity, 10) || 1);
  const infill = clamp(Number.parseFloat(inputs.infill) || 15, 5, 100);
  const accent = material.color ?? "#f97316";
  const hasStlPreview = modelData?.type === "stl" && modelData.triangles?.length > 0;

  return (
    <div className="preview-card">
      <div className="preview-header">
        <div>
          <span className="section-eyebrow">Podgląd</span>
          <h3>Element do druku</h3>
        </div>
        <span className="preview-pill">
          {modelData?.type === "stl" ? "STL" : "Logo / brelok"}
        </span>
      </div>

      <div className="preview-stage">
        {hasStlPreview ? (
          <ThreeStlViewer modelData={modelData} color={accent} />
        ) : (
          <div className="empty-preview" role="status">
            <div className="empty-preview__icon" aria-hidden="true">
              <span>STL</span>
            </div>
            <div>
              <strong>Brak modelu 3D</strong>
              <p>
                Wgraj plik STL, żeby zobaczyć rzeczywisty podgląd z możliwością
                obracania.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="preview-metrics">
        <PreviewMetric label="Wymiary" value={`${formatNumber(width)} × ${formatNumber(height)} × ${formatNumber(thickness)} mm`} />
        <PreviewMetric label="Materiał" value={material.label} />
        <PreviewMetric label="Wypełnienie" value={`${numberFormatter.format(infill)}%`} />
        <PreviewMetric label="Nakład" value={`${quantity} szt.`} />
      </div>

      <div className="estimate-strip">
        <div>
          <span>Szacunkowo za szt.</span>
          <strong>
            {hasEstimateContext && estimate
              ? `${numberFormatter.format(estimate.unitPrice)} zł`
              : "Po wgraniu pliku"}
          </strong>
        </div>
        <div>
          <span>Całość</span>
          <strong>
            {hasEstimateContext && estimate
              ? `${numberFormatter.format(estimate.totalCost)} zł`
              : "—"}
          </strong>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ label, value }) {
  return (
    <div className="preview-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ThreeStlViewer({ modelData, color }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !modelData?.triangles?.length) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8fafc");

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor("#f8fafc");
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const positions = new Float32Array(modelData.triangles.length * 9);
    let cursor = 0;
    modelData.triangles.forEach((triangle) => {
      triangle.forEach((vertex) => {
        positions[cursor] = vertex[0];
        positions[cursor + 1] = vertex[1];
        positions[cursor + 2] = vertex[2];
        cursor += 3;
      });
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.center();
    geometry.computeBoundingSphere();

    const radius = geometry.boundingSphere?.radius || 1;
    const scale = 120 / radius;
    geometry.scale(scale, scale, scale);
    geometry.computeBoundingSphere();

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.58,
      metalness: 0.05,
      transparent: false,
      opacity: 1,
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    mesh.updateMatrixWorld(true);

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 58),
      new THREE.LineBasicMaterial({
        color: "#1f2937",
        transparent: true,
        opacity: 0.08,
      })
    );
    outline.rotation.copy(mesh.rotation);
    scene.add(outline);

    const grid = new THREE.GridHelper(300, 12, "#94a3b8", "#e2e8f0");
    grid.position.y = -125;
    scene.add(grid);

    scene.add(new THREE.HemisphereLight("#ffffff", "#cbd5e1", 2.4));
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.2);
    keyLight.position.set(180, 220, 260);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight("#f8fafc", 1.1);
    fillLight.position.set(-160, 120, -160);
    scene.add(fillLight);

    camera.position.set(230, 180, 260);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 120;
    controls.maxDistance = 650;
    controls.target.set(0, 0, 0);

    const resize = () => {
      const width = container.clientWidth || 520;
      const height = container.clientHeight || 320;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let frameId;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      geometry.dispose();
      material.dispose();
      outline.geometry.dispose();
      outline.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [color, modelData]);

  return (
    <div className="three-viewer" ref={containerRef}>
      <div className="viewer-hint">Przeciągnij, aby obrócić model</div>
    </div>
  );
}

function estimateCost(inputs, materialKey, modelData) {
  const material = MATERIALS[materialKey] ?? MATERIALS.pla;

  const width = ensurePositive(Number.parseFloat(inputs.width), "szerokość");
  const height = ensurePositive(Number.parseFloat(inputs.height), "wysokość");
  const thickness = ensurePositive(
    Number.parseFloat(inputs.thickness),
    "grubość"
  );
  const quantity = ensurePositiveInteger(
    Number.parseInt(inputs.quantity, 10) || 1,
    "ilość sztuk"
  );
  const addOnIds = Array.isArray(inputs.addOns) ? inputs.addOns : [];
  const addOnCost = addOnIds.reduce((sum, key) => {
    const addOn = ADD_ONS[key];
    return addOn ? sum + addOn.price : sum;
  }, 0);

  const infillPercent = clamp(
    Number.parseFloat(inputs.infill) || 20,
    5,
    100
  );
  const infillRatio = infillPercent / 100;

  const baseVolumeMm3 =
    modelData?.type === "stl"
      ? computeScaledStlVolume(modelData, width, height, thickness)
      : width * height * thickness;

  if (!Number.isFinite(baseVolumeMm3) || baseVolumeMm3 <= 0) {
    throw new Error("Brak poprawnej objętości modelu.");
  }

  const effectiveVolumeMm3 = adjustForInfill(baseVolumeMm3, infillRatio);
  const volumeCm3 = effectiveVolumeMm3 / 1000;
  const massGrams = volumeCm3 * material.density;

  const materialCost = massGrams * material.pricePerGram;
  const printTimeHours = Math.max(
    MIN_PRINT_TIME_HOURS,
    effectiveVolumeMm3 / PRINT_SPEED_MM3_PER_HOUR
  );
  const machineCost = printTimeHours * HOURLY_RATE;
  const targetDiscountRate = getQuantityDiscount(quantity);
  const variableCostPerPiece = materialCost + machineCost + addOnCost;
  const discountedCostPerPiece = variableCostPerPiece * (1 - targetDiscountRate);
  const setupCost = SETUP_FEE;
  const variableTotal = quantity * discountedCostPerPiece;
  const rawTotal = setupCost + variableTotal;
  const rawUnitPrice = rawTotal / quantity;

  let unitPrice = rawUnitPrice;
  let priceFloorApplied = false;

  if (unitPrice < MIN_UNIT_PRICE) {
    priceFloorApplied = true;
    unitPrice = MIN_UNIT_PRICE;
  }

  const totalCost = unitPrice * quantity;

  return {
    baseVolumeMm3,
    effectiveVolumeMm3,
    massGrams,
    materialCost,
    printTimeHours,
    addOnCost,
    selectedAddOns: addOnIds,
    quantity,
    discountRate: targetDiscountRate,
    unitPrice,
    setupCost,
    priceFloorApplied,
    totalCost,
  };
}

function adjustForInfill(volumeMm3, infillRatio) {
  const perimeterFactor = 0.35;
  const boundedInfill = clamp(infillRatio, 0.05, 1);
  return volumeMm3 * (perimeterFactor + boundedInfill * (1 - perimeterFactor));
}

function computeScaledStlVolume(modelData, width, height, thickness) {
  const { bbox } = modelData;
  const scaleX = computeAxisScale(width, bbox?.x);
  const scaleY = computeAxisScale(height, bbox?.y);
  const scaleZ = computeAxisScale(thickness, bbox?.z);
  const scalingFactor = scaleX * scaleY * scaleZ;
  return modelData.volumeMm3 * scalingFactor;
}

function computeAxisScale(target, original) {
  if (!Number.isFinite(target) || target <= 0) {
    return 1;
  }
  if (!Number.isFinite(original) || original <= 0) {
    return 1;
  }
  return target / original;
}

function parseDimension(value, fallback) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function getQuantityDiscount(quantity) {
  if (quantity >= 1000) {
    return 0.4;
  }
  if (quantity >= 600) {
    return 0.32;
  }
  if (quantity >= 400) {
    return 0.28;
  }
  if (quantity >= 200) {
    return 0.2;
  }
  if (quantity >= 100) {
    return 0.1;
  }
  if (quantity >= 50) {
    return 0.07;
  }
  if (quantity >= 30) {
    return 0.05;
  }
  return 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function ensurePositive(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Niepoprawna wartość pola: ${name}.`);
  }
  return value;
}

function ensurePositiveInteger(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Niepoprawna wartość pola: ${name}.`);
  }
  return Math.round(value);
}

async function parseStlFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength < 84) {
    throw new Error("Plik STL jest zbyt mały.");
  }

  const dataView = new DataView(arrayBuffer);
  const triangleCount = dataView.getUint32(80, true);
  const expectedSize = 84 + triangleCount * 50;

  if (expectedSize === arrayBuffer.byteLength) {
    return parseBinaryStl(dataView, triangleCount);
  }

  const decoder = new TextDecoder("utf-8");
  const text = decoder.decode(arrayBuffer);
  if (!text.trim().startsWith("solid")) {
    return parseBinaryStl(dataView, triangleCount);
  }
  return parseAsciiStl(text);
}

function parseBinaryStl(dataView, triangleCount) {
  let offset = 84;
  let volume = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let reference = null;
  const triangles = [];
  const sampleStep = Math.max(1, Math.ceil(triangleCount / 50000));

  for (let i = 0; i < triangleCount; i += 1) {
    offset += 12;

    const v0 = readVertex(dataView, offset);
    offset += 12;
    const v1 = readVertex(dataView, offset);
    offset += 12;
    const v2 = readVertex(dataView, offset);
    offset += 12;
    offset += 2;

    if (!reference) {
      reference = [...v0];
    }

    updateBounds(min, max, v0);
    updateBounds(min, max, v1);
    updateBounds(min, max, v2);
    if (i % sampleStep === 0) {
      triangles.push([v0, v1, v2]);
    }

    volume += signedVolumeOfTriangle(
      subtract(v0, reference),
      subtract(v1, reference),
      subtract(v2, reference)
    );
  }

  return {
    type: "stl",
    volumeMm3: Math.abs(volume),
    bbox: {
      x: max[0] - min[0],
      y: max[1] - min[1],
      z: max[2] - min[2],
    },
    vertexBounds: { min, max },
    triangles,
  };
}

function parseAsciiStl(text) {
  const vertexRegex =
    /vertex\s+([-\d.+eE]+)\s+([-\d.+eE]+)\s+([-\d.+eE]+)/g;
  const vertices = [];
  let match;

  while ((match = vertexRegex.exec(text)) !== null) {
    vertices.push([
      Number.parseFloat(match[1]),
      Number.parseFloat(match[2]),
      Number.parseFloat(match[3]),
    ]);
  }

  if (vertices.length % 3 !== 0 || vertices.length === 0) {
    throw new Error("Nie udało się sparsować ASCII STL.");
  }

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let volume = 0;
  const reference = [...vertices[0]];
  const triangleCount = vertices.length / 3;
  const sampleStep = Math.max(1, Math.ceil(triangleCount / 50000));
  const triangles = [];

  for (let i = 0; i < vertices.length; i += 3) {
    const v0 = vertices[i];
    const v1 = vertices[i + 1];
    const v2 = vertices[i + 2];

    updateBounds(min, max, v0);
    updateBounds(min, max, v1);
    updateBounds(min, max, v2);
    if (i / 3 % sampleStep === 0) {
      triangles.push([v0, v1, v2]);
    }

    volume += signedVolumeOfTriangle(
      subtract(v0, reference),
      subtract(v1, reference),
      subtract(v2, reference)
    );
  }

  return {
    type: "stl",
    volumeMm3: Math.abs(volume),
    bbox: {
      x: max[0] - min[0],
      y: max[1] - min[1],
      z: max[2] - min[2],
    },
    vertexBounds: { min, max },
    triangles,
  };
}

function signedVolumeOfTriangle(v0, v1, v2) {
  const crossX = v1[1] * v2[2] - v1[2] * v2[1];
  const crossY = v1[2] * v2[0] - v1[0] * v2[2];
  const crossZ = v1[0] * v2[1] - v1[1] * v2[0];
  return (v0[0] * crossX + v0[1] * crossY + v0[2] * crossZ) / 6;
}

function readVertex(dataView, offset) {
  return [
    dataView.getFloat32(offset, true),
    dataView.getFloat32(offset + 4, true),
    dataView.getFloat32(offset + 8, true),
  ];
}

function updateBounds(min, max, vertex) {
  min[0] = Math.min(min[0], vertex[0]);
  min[1] = Math.min(min[1], vertex[1]);
  min[2] = Math.min(min[2], vertex[2]);
  max[0] = Math.max(max[0], vertex[0]);
  max[1] = Math.max(max[1], vertex[1]);
  max[2] = Math.max(max[2], vertex[2]);
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function isStlFile(file) {
  return (
    file.name.toLowerCase().endsWith(".stl") ||
    file.type === "model/stl" ||
    file.type === "application/sla"
  );
}

function formatNumber(value) {
  return String(Number.parseFloat(Number(value).toFixed(2)));
}
