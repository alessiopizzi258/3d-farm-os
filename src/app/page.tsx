'use client';

import React, { useState, useEffect } from 'react';
import {
  Server,
  Layers,
  Zap,
  Wrench,
  ShoppingCart,
  Radar,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Flame,
  Thermometer,
  Settings,
  Plus,
  Trash2,
  QrCode,
  Video,
  X,
  Edit3,
} from 'lucide-react';
import { useErpStore, PrinterUnit, PrinterBrand } from '@/store/useErpStore';

type ActiveModule = 'fleet' | 'inventory' | 'energy' | 'maintenance';

export default function EnterpriseMesDashboard() {
  const {
    printers,
    spools,
    orders,
    electricityCostPerKwh,
    sessionKwh,
    sessionCostEur,
    tickRealTimeTelemetry,
    pollRealHardware,
    addPrinter,
    updatePrinter,
    deletePrinter,
    togglePrinterStatus,
    assignSpoolToPrinter,
    addSpool,
    updateSpoolWeight,
    deleteSpool,
    refillSpool,
    resetComponentWear,
    addManualOrder,
    markOrderAsOrdered,
    deleteOrder,
    setElectricityRate,
  } = useErpStore();

  const [activeModule, setActiveModule] = useState<ActiveModule>('fleet');
  const [isScanningLan, setIsScanningLan] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [showCams, setShowCams] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // STATI MODAL: INSERIMENTO BOBINA FILAMENTO
  const [isSpoolModalOpen, setIsSpoolModalOpen] = useState(false);
  const [spoolForm, setSpoolForm] = useState({
    sku: 'FIL-NEW-01',
    brand: 'Anycubic',
    material: 'PLA' as 'PLA' | 'PETG' | 'ASA' | 'ABS' | 'TPU',
    colorName: 'Nero',
    colorHex: '#2563eb',
    initialWeightG: 1000,
    remainingWeightG: 1000,
    costPerKg: 19.0,
    reorderThresholdG: 200,
    nfcUid: 'TAG-NEW',
  });

  // STATI MODAL: CONFIGURA / AGGIUNGI STAMPANTE
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null);
  const [printerForm, setPrinterForm] = useState({
    code: 'ANYCUBIC-04',
    brand: 'Anycubic' as PrinterBrand,
    model: 'Kobra 3',
    ipAddress: '192.168.1.105',
    port: 7125,
    apiType: 'Moonraker' as 'Moonraker' | 'OctoPrint' | 'Manuale',
    smartPlugIp: '',
    printingWattsConfig: 195,
    idleWattsConfig: 12,
    ratedMaxWatts: 400,
    flowRateMm3s: 12.5,
    streamUrl: 'http://192.168.1.105:8080/?action=stream',
  });

  // STATI MODAL: NUOVO ORDINE MANUALE
  const [newOrderDesc, setNewOrderDesc] = useState('');
  const [newOrderCost, setNewOrderCost] = useState(20);

  // Avvio del motore a 1Hz (ogni secondo aggiorna grammi, Watt, kWh e ore usura)
  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      tickRealTimeTelemetry();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickRealTimeTelemetry]);

  if (!isMounted) {
    return <div className="h-[100dvh] w-screen bg-[#09090b]" />;
  }

  // Calcoli aggregati Real-Time
  const totalLiveWatts = printers.reduce((acc, p) => acc + p.currentWatts, 0);
  const hourlyCostEur = (totalLiveWatts / 1000) * electricityCostPerKwh;
  const activePrintersCount = printers.filter((p) => p.status === 'PRINTING').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

  // Scansione reale HTTP verso gli IP configurati
  const handleRealNetworkPoll = async () => {
    setIsScanningLan(true);
    setScanLogs(['Avvio interrogazione HTTP verso gli IP configurati...']);
    const result = await pollRealHardware();
    setScanLogs(result.details);
    setIsScanningLan(false);
  };

  // Apertura Modal Modifica Stampante esistente
  const openEditPrinter = (p: PrinterUnit) => {
    setEditingPrinterId(p.id);
    setPrinterForm({
      code: p.code,
      brand: p.brand,
      model: p.model,
      ipAddress: p.ipAddress,
      port: p.port,
      apiType: p.apiType,
      smartPlugIp: p.smartPlugIp || '',
      printingWattsConfig: p.printingWattsConfig || 190,
      idleWattsConfig: p.idleWattsConfig || 12,
      ratedMaxWatts: p.ratedMaxWatts || 400,
      flowRateMm3s: p.flowRateMm3s > 0 ? p.flowRateMm3s : 12.5,
      streamUrl: p.streamUrl,
    });
    setIsPrinterModalOpen(true);
  };

  // Apertura Modal Nuova Stampante
  const openNewPrinter = () => {
    setEditingPrinterId(null);
    setPrinterForm({
      code: `PRINTER-0${printers.length + 1}`,
      brand: 'Anycubic',
      model: 'Kobra 2 / 3',
      ipAddress: '192.168.1.110',
      port: 7125,
      apiType: 'Moonraker',
      smartPlugIp: '',
      printingWattsConfig: 190,
      idleWattsConfig: 12,
      ratedMaxWatts: 400,
      flowRateMm3s: 12.0,
      streamUrl: 'http://192.168.1.110:8080/?action=stream',
    });
    setIsPrinterModalOpen(true);
  };

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPrinterId) {
      updatePrinter(editingPrinterId, {
        ...printerForm,
      });
    } else {
      addPrinter({
        ...printerForm,
        status: 'IDLE',
        loadedSpoolId: spools[0]?.id || null,
        currentJobName: 'Pronta',
        progress: 0,
        estimatedTotalSeconds: 10800,
        nozzleTemp: 24,
        nozzleTarget: 0,
        bedTemp: 24,
        bedTarget: 0,
      });
    }
    setIsPrinterModalOpen(false);
  };

  const handleSaveSpool = (e: React.FormEvent) => {
    e.preventDefault();
    const densityMap = { PLA: 1.24, PETG: 1.27, ASA: 1.07, ABS: 1.04, TPU: 1.21 };
    addSpool({
      ...spoolForm,
      densityGcm3: densityMap[spoolForm.material] || 1.24,
    });
    setIsSpoolModalOpen(false);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden select-none">
      
      {/* =====================================================================
          TOP BAR ENTERPRISE: CORRENTE IN TEMPO REALE + BOTTONI RAPIDI
      ===================================================================== */}
      <header className="bg-[#121215] border-b border-zinc-800 px-4 lg:px-6 py-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-mono-tech font-bold text-sm">
              ERP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold tracking-tight text-white">
                  3D FARM // SISTEMA GESTIONALE
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {activePrintersCount} ATTIVE SU {printers.length}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono-tech">
                Clicca &quot;Avvia/Pausa&quot; o &quot;Configura&quot; su ogni stampante per allineare lo stato reale
              </p>
            </div>
          </div>

          {/* KPI Elettrici + Azioni Rapide */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1">
            <div className="bg-[#09090b] border border-zinc-800 px-3 py-1.5 rounded flex items-center gap-2">
              <Zap size={15} className="text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase text-zinc-400">Corrente Live</div>
                <div className="text-xs sm:text-sm font-mono-tech font-bold text-amber-400">
                  {totalLiveWatts} W{' '}
                  <span className="text-zinc-400 font-normal">
                    (€ {hourlyCostEur.toFixed(3)}/h)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSpoolModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-2 rounded flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Bobina Filamento</span>
            </button>

            <button
              onClick={openNewPrinter}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-xs font-medium px-3 py-2 rounded flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Settings size={14} />
              <span>+ Stampante</span>
            </button>

            <button
              onClick={handleRealNetworkPoll}
              disabled={isScanningLan}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-2 rounded flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Radar size={14} className={isScanningLan ? 'animate-spin' : ''} />
              <span>{isScanningLan ? 'Verifica IP...' : 'Testa IP LAN'}</span>
            </button>
          </div>
        </div>

        {/* Risultati Test Connessione LAN */}
        {scanLogs.length > 0 && (
          <div className="mt-2.5 p-2.5 bg-zinc-900 border border-zinc-700 rounded text-xs font-mono-tech space-y-1">
            <div className="flex items-center justify-between text-zinc-400 pb-1 border-b border-zinc-800">
              <span>DIAGNOSTICA DI RETE (Moonraker / Prese Smart):</span>
              <button onClick={() => setScanLogs([])} className="text-zinc-400 hover:text-white">
                Chiudi ✕
              </button>
            </div>
            {scanLogs.map((l, idx) => (
              <div key={idx} className="text-[11px] text-blue-300">
                • {l}
              </div>
            ))}
          </div>
        )}
      </header>

      {/* =====================================================================
          CORPO CENTRALE (SIDEBAR + WORKSPACE)
      ===================================================================== */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:flex w-60 bg-[#121215] border-r border-zinc-800 flex-col justify-between p-3 shrink-0">
          <nav className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
              Reparti Operativi
            </div>
            {[
              {
                id: 'fleet',
                label: 'Stampanti & Stato',
                icon: Server,
                badge: `${activePrintersCount}/${printers.length} ON`,
              },
              {
                id: 'inventory',
                label: 'Magazzino Filamenti',
                icon: Layers,
                badge: `${spools.length} Bobine`,
              },
              {
                id: 'energy',
                label: 'Consumo Corrente',
                icon: Zap,
                badge: `${totalLiveWatts}W`,
              },
              {
                id: 'maintenance',
                label: 'Manutenzione & Ordini',
                icon: Wrench,
                badge: `${pendingOrdersCount} Ord.`,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id as ActiveModule)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-white border-l-2 border-blue-500'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-blue-400' : ''} />
                    <span>{item.label}</span>
                  </span>
                  <span className="font-mono-tech text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 bg-[#09090b] border border-zinc-800 rounded space-y-2 text-[11px]">
            <div className="text-zinc-400 font-semibold">Come funziona la Corrente:</div>
            <p className="text-zinc-500 leading-relaxed">
              Ogni stampante in stato <strong className="text-emerald-400">PRINTING</strong> assorbe i Watt impostati nella sua scheda (es. 190W) o letti dalla presa Shelly IP, calcolando kWh ed Euro al secondo.
            </p>
          </div>
        </aside>

        {/* WORKSPACE PRINCIPALE */}
        <main className="flex-grow overflow-y-auto p-4 lg:p-6 space-y-6">
          
          {/* ===============================================================
              MODULO 1: FLOTTA STAMPANTI (CON CONFIGURAZIONE IP E STATO)
          =============================================================== */}
          {activeModule === 'fleet' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Controllo Stampanti ({activePrintersCount} in stampa attiva)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Premi il pulsante <strong className="text-emerald-400">Play / Pausa</strong> su una stampante per attivarla/fermarla subito, oppure clicca l&apos;icona <strong className="text-blue-400">Ingranaggio</strong> per inserire il suo IP reale o i Watt.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCams(!showCams)}
                    className="px-3 py-1.5 rounded text-xs font-medium border bg-[#121215] border-zinc-800 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Video size={14} />
                    <span>{showCams ? 'Nascondi Telecamere' : 'Mostra Telecamere'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {printers.map((printer) => {
                  const loadedSpool = spools.find((s) => s.id === printer.loadedSpoolId);
                  const flow = printer.flowRateMm3s > 0 ? printer.flowRateMm3s : 12.0;
                  const gramsPerMin =
                    printer.status === 'PRINTING' && loadedSpool
                      ? (flow / 1000) * loadedSpool.densityGcm3 * 60
                      : 0;

                  return (
                    <div
                      key={printer.id}
                      className={`bg-[#121215] border rounded-lg p-4 flex flex-col justify-between space-y-4 transition-colors ${
                        printer.status === 'PRINTING'
                          ? 'border-emerald-500/40'
                          : 'border-zinc-800'
                      }`}
                    >
                      {/* Intestazione + Bottoni Azione */}
                      <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono-tech font-semibold uppercase ${
                                printer.brand === 'Anycubic'
                                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {printer.brand}
                            </span>
                            <span className="font-mono-tech text-xs text-zinc-400">
                              {printer.code}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-white mt-1">
                            {printer.model}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] font-mono-tech text-zinc-400 mt-0.5">
                            <Wifi
                              size={12}
                              className={
                                printer.isLiveConnected ? 'text-emerald-400' : 'text-zinc-500'
                              }
                            />
                            <span>
                              IP: {printer.ipAddress}:{printer.port}
                            </span>
                          </div>
                        </div>

                        {/* Controlli rapidi: Avvia/Ferma + Configura */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => togglePrinterStatus(printer.id)}
                            className={`px-3 py-1.5 rounded text-xs font-mono-tech font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              printer.status === 'PRINTING'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                            }`}
                          >
                            {printer.status === 'PRINTING' ? (
                              <>
                                <Pause size={13} />
                                <span>IN STAMPA</span>
                              </>
                            ) : (
                              <>
                                <Play size={13} />
                                <span>AVVIA STAMPA</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => openEditPrinter(printer)}
                            className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                            title="Modifica IP, Modello e Watt"
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Stream Telecamera */}
                      {showCams && (
                        <div className="aspect-video bg-black rounded border border-zinc-800 relative overflow-hidden flex items-center justify-center">
                          <img
                            src={printer.streamUrl}
                            alt={printer.model}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                            <span className="font-mono-tech text-xs text-zinc-400">
                              Flusso Camera: {printer.streamUrl}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Selezione Bobina Caricata e Scorrimento Grammi */}
                      <div className="bg-[#09090b] border border-zinc-800 rounded p-3 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                            Bobina Montata sulla Macchina:
                          </span>
                          <select
                            value={printer.loadedSpoolId || ''}
                            onChange={(e) =>
                              assignSpoolToPrinter(printer.id, e.target.value || null)
                            }
                            className="bg-zinc-900 border border-zinc-700 rounded text-xs px-2.5 py-1 text-white font-mono-tech outline-none cursor-pointer"
                          >
                            <option value="">-- Nessuna Bobina --</option>
                            {spools.map((sp) => (
                              <option key={sp.id} value={sp.id}>
                                {sp.brand} {sp.material} {sp.colorName} ({sp.remainingWeightG.toFixed(1)}g)
                              </option>
                            ))}
                          </select>
                        </div>

                        {loadedSpool ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2 text-zinc-300">
                                <span
                                  className="w-3 h-3 rounded-full border border-white/20"
                                  style={{ backgroundColor: loadedSpool.colorHex }}
                                />
                                Residuo Bobina in tempo reale:
                              </span>
                              <span className="font-mono-tech text-sm font-bold text-amber-400">
                                {loadedSpool.remainingWeightG.toFixed(2)} g
                                <span className="text-xs text-zinc-500 font-normal">
                                  {' '}
                                  / {loadedSpool.initialWeightG}g
                                </span>
                              </span>
                            </div>

                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  loadedSpool.remainingWeightG <= loadedSpool.reorderThresholdG
                                    ? 'bg-red-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (loadedSpool.remainingWeightG / loadedSpool.initialWeightG) * 100
                                  )}%`,
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono-tech text-zinc-400">
                              <span>Velocità estrusione: {printer.flowRateMm3s} mm³/s</span>
                              <span className="text-emerald-400">
                                {printer.status === 'PRINTING'
                                  ? `Scala -${gramsPerMin.toFixed(2)} g/min`
                                  : 'Ferma (0 g/min)'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-amber-400 font-mono-tech py-1">
                            ⚠ Seleziona una bobina dal menu a tendina qui sopra per scalare i grammi.
                          </div>
                        )}
                      </div>

                      {/* Temperature e Corrente Assorbita */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#09090b] border border-zinc-800 rounded p-2.5">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase">
                            <Flame size={12} className="text-orange-400" />
                            <span>Ugello</span>
                          </div>
                          <div className="font-mono-tech text-xs sm:text-sm font-semibold text-white mt-0.5">
                            {printer.nozzleTemp}°C
                          </div>
                        </div>

                        <div className="bg-[#09090b] border border-zinc-800 rounded p-2.5">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase">
                            <Thermometer size={12} className="text-blue-400" />
                            <span>Piatto</span>
                          </div>
                          <div className="font-mono-tech text-xs sm:text-sm font-semibold text-white mt-0.5">
                            {printer.bedTemp}°C
                          </div>
                        </div>

                        <div className="bg-[#09090b] border border-zinc-800 rounded p-2.5">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase">
                            <Zap size={12} className="text-amber-400" />
                            <span>Assorbimento</span>
                          </div>
                          <div className="font-mono-tech text-xs sm:text-sm font-semibold text-amber-400 mt-0.5">
                            {printer.currentWatts} W
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===============================================================
              MODULO 2: MAGAZZINO FILAMENTI (CON AGGIUNTA E MODIFICA GRAMMI)
          =============================================================== */}
          {activeModule === 'inventory' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Magazzino Filamenti ({spools.length} Bobine registrate)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Aggiungi nuove bobine, modifica manualmente i grammi residui o ricarica a 1000g con un clic.
                  </p>
                </div>

                <button
                  onClick={() => setIsSpoolModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Aggiungi Nuova Bobina</span>
                </button>
              </div>

              <div className="bg-[#121215] border border-zinc-800 rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[11px] font-mono-tech uppercase text-zinc-400 bg-[#09090b]">
                      <th className="py-3 px-4">Codice / NFC</th>
                      <th className="py-3 px-4">Marca & Materiale</th>
                      <th className="py-3 px-4">Montata Su</th>
                      <th className="py-3 px-4">Grammi Residui (Modificabili)</th>
                      <th className="py-3 px-4 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-xs">
                    {spools.map((spool) => {
                      const mountedOn = printers.find((p) => p.loadedSpoolId === spool.id);
                      const pct = Math.min(
                        100,
                        (spool.remainingWeightG / spool.initialWeightG) * 100
                      );

                      return (
                        <tr key={spool.id} className="hover:bg-zinc-800/30">
                          <td className="py-3.5 px-4 font-mono-tech">
                            <div className="font-semibold text-white">{spool.sku}</div>
                            <div className="text-[11px] text-zinc-500">NFC: {spool.nfcUid}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-4 h-4 rounded border border-white/20 shrink-0"
                                style={{ backgroundColor: spool.colorHex }}
                              />
                              <div>
                                <div className="font-semibold text-white">
                                  {spool.brand} — {spool.material}
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  Colore: {spool.colorName} (€ {spool.costPerKg}/Kg)
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono-tech">
                            {mountedOn ? (
                              <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px]">
                                {mountedOn.model}
                              </span>
                            ) : (
                              <span className="text-zinc-500">In Magazzino</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 min-w-[240px]">
                            <div className="flex items-center justify-between font-mono-tech mb-1">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={Math.round(spool.remainingWeightG)}
                                  onChange={(e) =>
                                    updateSpoolWeight(spool.id, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-20 bg-[#09090b] border border-zinc-700 rounded px-2 py-0.5 text-sm font-bold text-amber-400 outline-none"
                                />
                                <span className="text-zinc-400">
                                  g / {spool.initialWeightG}g
                                </span>
                              </div>
                              <span className="text-[11px] text-zinc-400">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  spool.remainingWeightG <= spool.reorderThresholdG
                                    ? 'bg-red-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => refillSpool(spool.id)}
                              className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono-tech text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw size={12} />
                              <span>1Kg</span>
                            </button>
                            <button
                              onClick={() => deleteSpool(spool.id)}
                              className="p-1.5 rounded bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400 inline-flex items-center cursor-pointer"
                              title="Elimina bobina"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===============================================================
              MODULO 3: CORRENTE E COSTI ELETTRICI
          =============================================================== */}
          {activeModule === 'energy' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Contabilizzazione Corrente Elettrica in Tempo Reale
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Puoi calibrare i Watt assorbiti da ogni stampante cliccando &quot;Configura&quot; sulla macchina, o collegare l&apos;IP di una presa Shelly.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#121215] border border-zinc-800 px-3 py-1.5 rounded">
                  <span className="text-xs text-zinc-400">Costo Energia (€/kWh):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={electricityCostPerKwh}
                    onChange={(e) => setElectricityRate(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-[#09090b] border border-zinc-700 rounded px-2 py-1 text-xs font-mono-tech text-emerald-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#121215] border border-zinc-800 p-4 rounded-lg">
                  <div className="text-xs text-zinc-400 uppercase font-mono-tech">
                    Assorbimento Attuale
                  </div>
                  <div className="text-2xl font-mono-tech font-bold text-amber-400 mt-1">
                    {totalLiveWatts} Watt
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Somma di {activePrintersCount} macchine in stampa + standby
                  </div>
                </div>

                <div className="bg-[#121215] border border-zinc-800 p-4 rounded-lg">
                  <div className="text-xs text-zinc-400 uppercase font-mono-tech">
                    Spesa Elettrica Oraria
                  </div>
                  <div className="text-2xl font-mono-tech font-bold text-emerald-400 mt-1">
                    € {hourlyCostEur.toFixed(3)} / ora
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Giornata continua (24h): € {(hourlyCostEur * 24).toFixed(2)}
                  </div>
                </div>

                <div className="bg-[#121215] border border-zinc-800 p-4 rounded-lg">
                  <div className="text-xs text-zinc-400 uppercase font-mono-tech">
                    Totale Consumato Storico
                  </div>
                  <div className="text-2xl font-mono-tech font-bold text-white mt-1">
                    {printers.reduce((a, b) => a + b.totalKwhConsumed, 0).toFixed(2)} kWh
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Costo totale maturato: €{' '}
                    {(
                      printers.reduce((a, b) => a + b.totalKwhConsumed, 0) *
                      electricityCostPerKwh
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Dettaglio Consumo per Stampante (Configurabile)
                </h3>
                {printers.map((p) => (
                  <div
                    key={p.id}
                    className="bg-[#09090b] border border-zinc-800 p-3.5 rounded flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono-tech font-bold text-white">{p.model}</span>
                      <span className="text-zinc-500 ml-2">
                        (Tarata a {p.printingWattsConfig}W in stampa / {p.idleWattsConfig}W standby)
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono-tech">
                      <span className="text-amber-400 font-bold">{p.currentWatts} W attuali</span>
                      <span className="text-emerald-400">
                        {p.totalKwhConsumed.toFixed(3)} kWh accumulati
                      </span>
                      <button
                        onClick={() => openEditPrinter(p)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded cursor-pointer"
                      >
                        Calibra Watt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===============================================================
              MODULO 4: MANUTENZIONE & ORDINI DI ACQUISTO
          =============================================================== */}
          {activeModule === 'maintenance' && (
            <div className="space-y-6">
              {/* Form aggiunta ordine manuale */}
              <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShoppingCart size={16} className="text-amber-400" />
                  <span>Aggiungi Ordine / Ricambio alla Lista Acquisti</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Es. 2x Bobine PLA Nero Anycubic + Ugelli 0.4mm..."
                    value={newOrderDesc}
                    onChange={(e) => setNewOrderDesc(e.target.value)}
                    className="flex-grow bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-xs text-white outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Costo €"
                    value={newOrderCost}
                    onChange={(e) => setNewOrderCost(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-xs font-mono-tech text-emerald-400 outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!newOrderDesc.trim()) return;
                      addManualOrder(newOrderDesc.trim(), 'FILAMENT', newOrderCost, 'HIGH');
                      setNewOrderDesc('');
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded cursor-pointer"
                  >
                    + Inserisci in Coda Ordini
                  </button>
                </div>

                {/* Lista Ordini */}
                <div className="divide-y divide-zinc-800 pt-2">
                  {orders.length === 0 ? (
                    <div className="py-4 text-xs text-zinc-500 font-mono-tech">
                      Nessun ordine in coda.
                    </div>
                  ) : (
                    orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">{ord.description}</span>
                          <span className="text-zinc-500 font-mono-tech ml-2">
                            ({ord.createdAt})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tech text-emerald-400 font-bold">
                            € {ord.estimatedCost.toFixed(2)}
                          </span>
                          {ord.status === 'PENDING' ? (
                            <button
                              onClick={() => markOrderAsOrdered(ord.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                            >
                              Segna Ordinato
                            </button>
                          ) : (
                            <span className="px-2 py-1 bg-zinc-800 text-emerald-400 rounded font-mono-tech text-[10px]">
                              ORDINATO ✓
                            </span>
                          )}
                          <button
                            onClick={() => deleteOrder(ord.id)}
                            className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Stato Usura Componenti per ciascuna Stampante */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {printers.map((printer) => (
                  <div
                    key={printer.id}
                    className="bg-[#121215] border border-zinc-800 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <h3 className="text-sm font-semibold text-white">
                        {printer.brand} — {printer.model}
                      </h3>
                      <span className="font-mono-tech text-xs text-zinc-400">
                        Ore Totali: {printer.totalPrintHours.toFixed(1)}h
                      </span>
                    </div>

                    <div className="space-y-2">
                      {printer.components.map((comp) => {
                        const pct = Math.min(100, (comp.currentHours / comp.maxHours) * 100);
                        return (
                          <div
                            key={comp.id}
                            className="bg-[#09090b] border border-zinc-800 p-2.5 rounded space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-200">{comp.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono-tech text-zinc-400">
                                  {comp.currentHours.toFixed(1)} / {comp.maxHours}h
                                </span>
                                <button
                                  onClick={() => resetComponentWear(printer.id, comp.id)}
                                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-mono-tech cursor-pointer"
                                >
                                  Reset Tagliando
                                </button>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  pct > 85 ? 'bg-red-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          MODAL 1: AGGIUNGI NUOVA BOBINA DI FILAMENTO
      ===================================================================== */}
      {isSpoolModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-700 rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white">
                Carica Nuova Bobina in Magazzino
              </h3>
              <button
                onClick={() => setIsSpoolModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSpool} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={spoolForm.brand}
                    onChange={(e) => setSpoolForm({ ...spoolForm, brand: e.target.value })}
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Materiale</label>
                  <select
                    value={spoolForm.material}
                    onChange={(e) =>
                      setSpoolForm({
                        ...spoolForm,
                        material: e.target.value as 'PLA' | 'PETG' | 'ASA' | 'ABS' | 'TPU',
                      })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ASA">ASA</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Nome Colore</label>
                  <input
                    type="text"
                    required
                    value={spoolForm.colorName}
                    onChange={(e) =>
                      setSpoolForm({ ...spoolForm, colorName: e.target.value })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Colore Visivo</label>
                  <input
                    type="color"
                    value={spoolForm.colorHex}
                    onChange={(e) =>
                      setSpoolForm({ ...spoolForm, colorHex: e.target.value })
                    }
                    className="w-full h-9 bg-[#09090b] border border-zinc-700 rounded px-1 py-1 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Peso Iniziale (g)</label>
                  <input
                    type="number"
                    required
                    value={spoolForm.initialWeightG}
                    onChange={(e) =>
                      setSpoolForm({
                        ...spoolForm,
                        initialWeightG: Number(e.target.value),
                        remainingWeightG: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white font-mono-tech"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Prezzo (€/Kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={spoolForm.costPerKg}
                    onChange={(e) =>
                      setSpoolForm({ ...spoolForm, costPerKg: Number(e.target.value) })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white font-mono-tech"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Soglia Ordine (g)</label>
                  <input
                    type="number"
                    required
                    value={spoolForm.reorderThresholdG}
                    onChange={(e) =>
                      setSpoolForm({
                        ...spoolForm,
                        reorderThresholdG: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white font-mono-tech"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Codice SKU</label>
                  <input
                    type="text"
                    value={spoolForm.sku}
                    onChange={(e) => setSpoolForm({ ...spoolForm, sku: e.target.value })}
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white font-mono-tech"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Codice NFC / Barcode</label>
                  <input
                    type="text"
                    value={spoolForm.nfcUid}
                    onChange={(e) => setSpoolForm({ ...spoolForm, nfcUid: e.target.value })}
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white font-mono-tech"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSpoolModalOpen(false)}
                  className="px-4 py-2 rounded bg-zinc-800 text-zinc-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  Salva Bobina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: CONFIGURA STAMPANTE (IP, MODELLO, WATT CORRENTE, VELOCITÀ)
      ===================================================================== */}
      {isPrinterModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-700 rounded-xl w-full max-w-lg p-5 space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingPrinterId ? 'Configura Parametri Stampante' : 'Aggiungi Stampante'}
              </h3>
              <button
                onClick={() => setIsPrinterModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePrinter} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Marca</label>
                  <select
                    value={printerForm.brand}
                    onChange={(e) =>
                      setPrinterForm({ ...printerForm, brand: e.target.value as PrinterBrand })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white"
                  >
                    <option value="Anycubic">Anycubic</option>
                    <option value="Creality">Creality</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Nome / Modello Esatto</label>
                  <input
                    type="text"
                    required
                    value={printerForm.model}
                    onChange={(e) =>
                      setPrinterForm({ ...printerForm, model: e.target.value })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-zinc-400 block mb-1">Indirizzo IP Locale</label>
                  <input
                    type="text"
                    value={printerForm.ipAddress}
                    onChange={(e) =>
                      setPrinterForm({ ...printerForm, ipAddress: e.target.value })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white font-mono-tech"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Porta API</label>
                  <input
                    type="number"
                    value={printerForm.port}
                    onChange={(e) =>
                      setPrinterForm({ ...printerForm, port: Number(e.target.value) })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white font-mono-tech"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Watt in Stampa</label>
                  <input
                    type="number"
                    value={printerForm.printingWattsConfig}
                    onChange={(e) =>
                      setPrinterForm({
                        ...printerForm,
                        printingWattsConfig: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-amber-400 font-mono-tech font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Watt in Standby</label>
                  <input
                    type="number"
                    value={printerForm.idleWattsConfig}
                    onChange={(e) =>
                      setPrinterForm({
                        ...printerForm,
                        idleWattsConfig: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white font-mono-tech"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Flusso (mm³/s)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={printerForm.flowRateMm3s}
                    onChange={(e) =>
                      setPrinterForm({
                        ...printerForm,
                        flowRateMm3s: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-emerald-400 font-mono-tech"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">
                  IP Presa Smart Shelly (Opzionale per lettura Watt via Wi-Fi)
                </label>
                <input
                  type="text"
                  placeholder="Es. 192.168.1.150 (lascia vuoto per calcolo automatico)"
                  value={printerForm.smartPlugIp}
                  onChange={(e) =>
                    setPrinterForm({ ...printerForm, smartPlugIp: e.target.value })
                  }
                  className="w-full bg-[#09090b] border border-zinc-700 rounded px-3 py-2 text-white font-mono-tech"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                {editingPrinterId ? (
                  <button
                    type="button"
                    onClick={() => {
                      deletePrinter(editingPrinterId);
                      setIsPrinterModalOpen(false);
                    }}
                    className="px-3 py-2 rounded bg-red-950/60 text-red-400 hover:bg-red-900/60 cursor-pointer"
                  >
                    Elimina Macchina
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrinterModalOpen(false)}
                    className="px-4 py-2 rounded bg-zinc-800 text-zinc-300"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                  >
                    Salva Configurazione
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARRA INFERIORE PER IPHONE / MOBILE */}
      <nav className="lg:hidden bg-[#121215] border-t border-zinc-800 grid grid-cols-4 py-1.5 px-2 shrink-0 z-30">
        {[
          { id: 'fleet', label: 'Stampanti', icon: Server },
          { id: 'inventory', label: 'Filamenti', icon: Layers },
          { id: 'energy', label: 'Corrente', icon: Zap },
          { id: 'maintenance', label: 'Manutenz.', icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id as ActiveModule)}
              className={`flex flex-col items-center justify-center py-1.5 rounded ${
                isActive ? 'text-blue-400 font-semibold' : 'text-zinc-400'
              }`}
            >
              <Icon size={17} />
              <span className="text-[10px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}