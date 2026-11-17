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
} from 'lucide-react';
import { useErpStore } from '@/store/useErpStore';

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
    togglePrinterStatus,
    assignSpoolToPrinter,
    refillSpool,
    resetComponentWear,
    markOrderAsOrdered,
    deleteOrder,
    setElectricityRate,
  } = useErpStore();

  const [activeModule, setActiveModule] = useState<ActiveModule>('fleet');
  const [isScanningLan, setIsScanningLan] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLog, setScanLog] = useState<string | null>(null);
  const [showCams, setShowCams] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Avvio del motore real-time a 1Hz (ogni secondo aggiorna grammi, Watt, kWh e ore usura)
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

  // Simulazione / Ping Scanner di Rete Locale per Anycubic & Creality
  const handleNetworkDiscovery = () => {
    setIsScanningLan(true);
    setScanProgress(10);
    setScanLog('Scansione subnet 192.168.1.1/24 (Porte 7125 Moonraker / 4408 Creality / 80)...');

    setTimeout(() => {
      setScanProgress(45);
      setScanLog('Trovati 3 nodi Anycubic (192.168.1.101, .102, .103) - Handshake OK');
    }, 900);

    setTimeout(() => {
      setScanProgress(85);
      setScanLog('Trovato 1 nodo Creality K1/Klippper (192.168.1.104:4408) - Telemetria sincronizzata');
    }, 1800);

    setTimeout(() => {
      setScanProgress(100);
      setIsScanningLan(false);
      setTimeout(() => setScanLog(null), 4000);
    }, 2500);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden select-none">
      
      {/* =====================================================================
          TOP BAR ENTERPRISE: TELEMETRIA ELETTRICA & LAN DISCOVERY
      ===================================================================== */}
      <header className="bg-[#121215] border-b border-zinc-800 px-4 lg:px-6 py-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand Aziendale */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-mono-tech font-bold text-sm tracking-tighter">
              MES
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold tracking-tight text-white">
                  ADDITIVE ERP // CONTROL SUITE
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-tech bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE 1Hz
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono-tech">
                Flotta configurata: 3x Anycubic + 1x Creality
              </p>
            </div>
          </div>

          {/* KPI Strip Real-Time (Corrente, Costo Orario, Flotta) */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
            <div className="bg-[#09090b] border border-zinc-800 px-3 py-1.5 rounded flex items-center gap-2.5">
              <Zap size={15} className="text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase text-zinc-400 font-medium">
                  Assorbimento Live
                </div>
                <div className="text-xs sm:text-sm font-mono-tech font-semibold text-white">
                  {totalLiveWatts} W{' '}
                  <span className="text-zinc-400 font-normal">
                    ({(totalLiveWatts / 1000).toFixed(2)} kW)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#09090b] border border-zinc-800 px-3 py-1.5 rounded flex items-center gap-2.5">
              <div className="text-emerald-400 font-mono-tech font-bold text-xs px-1.5 py-0.5 bg-emerald-500/10 rounded">
                €
              </div>
              <div>
                <div className="text-[10px] uppercase text-zinc-400 font-medium">
                  Costo Elettrico Live
                </div>
                <div className="text-xs sm:text-sm font-mono-tech font-semibold text-emerald-400">
                  € {hourlyCostEur.toFixed(3)}/h{' '}
                  <span className="text-zinc-400 text-xs font-normal">
                    (Tot: € {sessionCostEur.toFixed(3)})
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleNetworkDiscovery}
              disabled={isScanningLan}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white text-xs font-medium px-3.5 py-2 rounded flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
            >
              <Radar size={15} className={isScanningLan ? 'animate-spin' : ''} />
              <span>{isScanningLan ? `Scan ${scanProgress}%` : 'Scan Rete LAN'}</span>
            </button>
          </div>
        </div>

        {/* Barra di stato Discovery Rete */}
        {scanLog && (
          <div className="mt-2.5 px-3 py-1.5 bg-blue-950/40 border border-blue-800/50 rounded flex items-center justify-between text-xs font-mono-tech text-blue-300">
            <span>{scanLog}</span>
            <span className="text-[10px] uppercase">TCP/IP Auto-Discovery</span>
          </div>
        )}
      </header>

      {/* =====================================================================
          CORPO CENTRALE (SIDEBAR DESKTOP + WORKSPACE)
      ===================================================================== */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* SIDEBAR DI NAVIGAZIONE (Desktop lg+) */}
        <aside className="hidden lg:flex w-60 bg-[#121215] border-r border-zinc-800 flex-col justify-between p-3 shrink-0">
          <nav className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
              Moduli Operativi
            </div>
            {[
              {
                id: 'fleet',
                label: 'Flotta Stampanti (4)',
                icon: Server,
                badge: `${activePrintersCount}/4`,
              },
              {
                id: 'inventory',
                label: 'Flusso Filamenti Live',
                icon: Layers,
                badge: `${spools.length} SKU`,
              },
              {
                id: 'energy',
                label: 'Telemetria Elettrica',
                icon: Zap,
                badge: `${totalLiveWatts}W`,
              },
              {
                id: 'maintenance',
                label: 'Manutenzione & Ordini',
                icon: Wrench,
                badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} Alert` : 'OK',
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id as ActiveModule)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors ${
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

          {/* Riepilogo Inferiore Sidebar */}
          <div className="p-3 bg-[#09090b] border border-zinc-800 rounded space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Protocollo</span>
              <span className="font-mono-tech text-zinc-200">Moonraker / HTTP</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Consumo Sessione</span>
              <span className="font-mono-tech text-amber-400">
                {sessionKwh.toFixed(3)} kWh
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Tariffa Energia</span>
              <span className="font-mono-tech text-emerald-400">
                € {electricityCostPerKwh.toFixed(2)}/kWh
              </span>
            </div>
          </div>
        </aside>

        {/* WORKSPACE PRINCIPALE SCORREVOLE */}
        <main className="flex-grow overflow-y-auto p-4 lg:p-6 space-y-6">
          
          {/* ===============================================================
              MODULO 1: FLOTTA STAMPANTI (3 ANYCUBIC + 1 CREALITY)
          =============================================================== */}
          {activeModule === 'fleet' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Stato Nodi di Produzione (3 Anycubic, 1 Creality)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Monitoraggio estrusione al secondo, consumo bobina in tempo reale e controllo termico PID.
                  </p>
                </div>

                <button
                  onClick={() => setShowCams(!showCams)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center gap-2 transition-colors ${
                    showCams
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-[#121215] border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Video size={14} />
                  <span>{showCams ? 'Nascondi Stream IP' : 'Mostra Stream Telecamere IP'}</span>
                </button>
              </div>

              {/* Griglia 4 Stampanti */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {printers.map((printer) => {
                  const loadedSpool = spools.find(
                    (s) => s.id === printer.loadedSpoolId
                  );
                  const gramsPerSec = loadedSpool
                    ? ((printer.flowRateMm3s / 1000) * loadedSpool.densityGcm3) * 4
                    : 0;

                  return (
                    <div
                      key={printer.id}
                      className="bg-[#121215] border border-zinc-800 rounded-lg p-4 flex flex-col justify-between space-y-4"
                    >
                      {/* Riga 1: Intestazione Macchina, IP e Stato */}
                      <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
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
                            <Wifi size={12} className="text-emerald-400" />
                            <span>
                              {printer.ipAddress}:{printer.port} ({printer.apiType})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded text-[11px] font-mono-tech font-semibold flex items-center gap-1.5 ${
                              printer.status === 'PRINTING'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                printer.status === 'PRINTING'
                                  ? 'bg-emerald-400 animate-ping'
                                  : 'bg-zinc-400'
                              }`}
                            />
                            {printer.status}
                          </span>

                          <button
                            onClick={() => togglePrinterStatus(printer.id)}
                            className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                            title={
                              printer.status === 'PRINTING'
                                ? 'Metti in Pausa / Idle'
                                : 'Avvia Produzione'
                            }
                          >
                            {printer.status === 'PRINTING' ? (
                              <Pause size={14} />
                            ) : (
                              <Play size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Stream Telecamera Opzionale */}
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
                            <span className="font-mono-tech text-xs text-zinc-500">
                              STREAM MJPEG: {printer.streamUrl}
                            </span>
                            <span className="text-[11px] text-zinc-600 mt-1">
                              (Visibile quando connesso alla stessa rete LAN locale delle stampanti)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Riga 2: Avanzamento G-Code */}
                      <div className="bg-[#09090b] border border-zinc-800/90 rounded p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono-tech text-zinc-300 truncate max-w-[230px] sm:max-w-xs">
                            {printer.currentJobName}
                          </span>
                          <span className="font-mono-tech font-bold text-blue-400">
                            {printer.progress.toFixed(2)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${printer.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Riga 3: SCORRIMENTO FILAMENTO IN TEMPO REALE */}
                      <div className="bg-[#09090b] border border-zinc-800/90 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                            Bobina in Uso & Scorrimento Real-Time
                          </span>
                          <select
                            value={printer.loadedSpoolId || ''}
                            onChange={(e) =>
                              assignSpoolToPrinter(printer.id, e.target.value)
                            }
                            className="bg-zinc-900 border border-zinc-700 rounded text-xs px-2 py-0.5 text-zinc-200 font-mono-tech outline-none"
                          >
                            {spools.map((sp) => (
                              <option key={sp.id} value={sp.id}>
                                {sp.sku} ({sp.remainingWeightG.toFixed(1)}g)
                              </option>
                            ))}
                          </select>
                        </div>

                        {loadedSpool && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2 font-medium text-zinc-200">
                                <span
                                  className="w-3 h-3 rounded-full border border-white/20"
                                  style={{ backgroundColor: loadedSpool.colorHex }}
                                />
                                {loadedSpool.brand} {loadedSpool.material} -{' '}
                                {loadedSpool.colorName}
                              </span>
                              <span className="font-mono-tech text-sm font-bold text-amber-400">
                                {loadedSpool.remainingWeightG.toFixed(2)} g
                                <span className="text-xs text-zinc-500 font-normal">
                                  {' '}
                                  / {loadedSpool.initialWeightG}g
                                </span>
                              </span>
                            </div>

                            {/* Barra progressiva bobina */}
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  loadedSpool.remainingWeightG <
                                  loadedSpool.reorderThresholdG
                                    ? 'bg-red-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${
                                    (loadedSpool.remainingWeightG /
                                      loadedSpool.initialWeightG) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono-tech text-zinc-400 pt-0.5">
                              <span>
                                Flusso Estrusore: {printer.flowRateMm3s.toFixed(1)} mm³/s
                              </span>
                              <span className="text-amber-400">
                                Consumo: -{gramsPerSec.toFixed(3)} g/sec
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Riga 4: Telemetria Termica ed Elettrica */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="bg-[#09090b] border border-zinc-800/80 rounded p-2.5">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase">
                            <Flame size={12} className="text-orange-400" />
                            <span>Hotend</span>
                          </div>
                          <div className="font-mono-tech text-xs sm:text-sm font-semibold text-white mt-0.5">
                            {printer.nozzleTemp}°C{' '}
                            <span className="text-zinc-500 text-[11px]">
                              / {printer.nozzleTarget}°
                            </span>
                          </div>
                        </div>

                        <div className="bg-[#09090b] border border-zinc-800/80 rounded p-2.5">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase">
                            <Thermometer size={12} className="text-blue-400" />
                            <span>Piatto</span>
                          </div>
                          <div className="font-mono-tech text-xs sm:text-sm font-semibold text-white mt-0.5">
                            {printer.bedTemp}°C{' '}
                            <span className="text-zinc-500 text-[11px]">
                              / {printer.bedTarget}°
                            </span>
                          </div>
                        </div>

                        <div className="bg-[#09090b] border border-zinc-800/80 rounded p-2.5">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase">
                            <Zap size={12} className="text-amber-400" />
                            <span>Potenza</span>
                          </div>
                          <div className="font-mono-tech text-xs sm:text-sm font-semibold text-amber-400 mt-0.5">
                            {printer.currentWatts} W{' '}
                            <span className="text-zinc-500 text-[11px]">
                              ({printer.totalKwhConsumed.toFixed(1)}kWh)
                            </span>
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
              MODULO 2: MAGAZZINO FILAMENTI CON SCORRIMENTO LIVE
          =============================================================== */}
          {activeModule === 'inventory' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Inventario Bobine & Tracciamento Scorrimento Grammi
                  </h2>
                  <p className="text-xs text-zinc-400">
                    I grammi residui vengono scalati al secondo dalle stampanti attive. Sotto i 250g scatta l&apos;ordine d&apos;acquisto automatico.
                  </p>
                </div>
              </div>

              <div className="bg-[#121215] border border-zinc-800 rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[11px] font-mono-tech uppercase text-zinc-400 bg-[#09090b]">
                      <th className="py-3 px-4">SKU / Tag NFC</th>
                      <th className="py-3 px-4">Polimero & Brand</th>
                      <th className="py-3 px-4">Macchina Associata</th>
                      <th className="py-3 px-4">Scorrimento Peso Real-Time</th>
                      <th className="py-3 px-4">Valore Residuo</th>
                      <th className="py-3 px-4 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-xs">
                    {spools.map((spool) => {
                      const usedByPrinter = printers.find(
                        (p) => p.loadedSpoolId === spool.id
                      );
                      const isDepleting =
                        usedByPrinter && usedByPrinter.status === 'PRINTING';
                      const pct =
                        (spool.remainingWeightG / spool.initialWeightG) * 100;
                      const residualEur =
                        (spool.remainingWeightG / 1000) * spool.costPerKg;

                      return (
                        <tr
                          key={spool.id}
                          className="hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono-tech">
                            <div className="font-semibold text-white">
                              {spool.sku}
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <QrCode size={11} />
                              <span>NFC: {spool.nfcUid}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-4 h-4 rounded border border-white/20 shrink-0"
                                style={{ backgroundColor: spool.colorHex }}
                              />
                              <div>
                                <div className="font-semibold text-zinc-100">
                                  {spool.brand} — {spool.material}
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  {spool.colorName} ({spool.densityGcm3} g/cm³)
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono-tech">
                            {usedByPrinter ? (
                              <span
                                className={`px-2 py-1 rounded text-[11px] inline-flex items-center gap-1.5 ${
                                  isDepleting
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-zinc-800 text-zinc-300'
                                }`}
                              >
                                {isDepleting && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                )}
                                {usedByPrinter.code} ({usedByPrinter.model})
                              </span>
                            ) : (
                              <span className="text-zinc-500">In Scaffale</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 min-w-[220px]">
                            <div className="flex items-center justify-between font-mono-tech mb-1">
                              <span
                                className={`text-sm font-bold ${
                                  spool.remainingWeightG <= spool.reorderThresholdG
                                    ? 'text-red-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {spool.remainingWeightG.toFixed(2)} g
                              </span>
                              <span className="text-[11px] text-zinc-400">
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  spool.remainingWeightG <= spool.reorderThresholdG
                                    ? 'bg-red-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono-tech text-zinc-200">
                            € {residualEur.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => refillSpool(spool.id)}
                              className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono-tech text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Carica nuova bobina da 1000g"
                            >
                              <RotateCcw size={12} />
                              <span>Ricarica 1Kg</span>
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
              MODULO 3: CENTRALE ENERGETICA & COSTI CORRENTE REAL-TIME
          =============================================================== */}
          {activeModule === 'energy' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Telemetria Assorbimento Elettrico & Costi Industriali
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Calcolo istantaneo del carico in Watt su tutte le 4 linee e proiezione costi energetici.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#121215] border border-zinc-800 px-3 py-1.5 rounded">
                  <span className="text-xs text-zinc-400">Tariffa (€/kWh):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={electricityCostPerKwh}
                    onChange={(e) =>
                      setElectricityRate(parseFloat(e.target.value) || 0)
                    }
                    className="w-20 bg-[#09090b] border border-zinc-700 rounded px-2 py-1 text-xs font-mono-tech text-emerald-400 outline-none"
                  />
                </div>
              </div>

              {/* Card Riepilogo Energetico */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#121215] border border-zinc-800 p-4 rounded-lg">
                  <div className="text-xs text-zinc-400 uppercase font-mono-tech">
                    Potenza Istantanea Flotta
                  </div>
                  <div className="text-2xl font-mono-tech font-bold text-amber-400 mt-1">
                    {totalLiveWatts} W
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                     Capacità massima installata: 1.900 W
                  </div>
                </div>

                <div className="bg-[#121215] border border-zinc-800 p-4 rounded-lg">
                  <div className="text-xs text-zinc-400 uppercase font-mono-tech">
                    Costo Orario Attuale
                  </div>
                  <div className="text-2xl font-mono-tech font-bold text-emerald-400 mt-1">
                    € {hourlyCostEur.toFixed(3)} / ora
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Proiezione 24h continuo: € {(hourlyCostEur * 24).toFixed(2)}
                  </div>
                </div>

                <div className="bg-[#121215] border border-zinc-800 p-4 rounded-lg">
                  <div className="text-xs text-zinc-400 uppercase font-mono-tech">
                    Energia Totale Contabilizzata
                  </div>
                  <div className="text-2xl font-mono-tech font-bold text-white mt-1">
                    {printers
                      .reduce((acc, p) => acc + p.totalKwhConsumed, 0)
                      .toFixed(2)}{' '}
                    kWh
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Costo storico flotta: €{' '}
                    {(
                      printers.reduce((acc, p) => acc + p.totalKwhConsumed, 0) *
                      electricityCostPerKwh
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Ripartizione Carico Elettrico per Singola Macchina */}
              <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Assorbimento Specifico per Unità Operativa
                </h3>

                <div className="space-y-3">
                  {printers.map((p) => {
                    const loadPct = Math.min(
                      100,
                      (p.currentWatts / p.ratedMaxWatts) * 100
                    );
                    const unitCostPerHour =
                      (p.currentWatts / 1000) * electricityCostPerKwh;

                    return (
                      <div
                        key={p.id}
                        className="bg-[#09090b] border border-zinc-800 p-3.5 rounded space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-tech font-semibold text-white">
                              {p.code}
                            </span>
                            <span className="text-zinc-400">
                              ({p.brand} {p.model})
                            </span>
                          </div>
                          <div className="flex items-center gap-4 font-mono-tech">
                            <span className="text-amber-400 font-semibold">
                              {p.currentWatts} W / {p.ratedMaxWatts} W max
                            </span>
                            <span className="text-emerald-400">
                              € {unitCostPerHour.toFixed(3)}/h
                            </span>
                            <span className="text-zinc-400">
                              Tot: {p.totalKwhConsumed.toFixed(2)} kWh
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${loadPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              MODULO 4: MANUTENZIONE PREDITTIVA & ORDINI DI ACQUISTO
          =============================================================== */}
          {activeModule === 'maintenance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Registro Manutenzione Programmata (MTBF) & Ordini
                </h2>
                <p className="text-xs text-zinc-400">
                  Le ore di esercizio di ugelli, cinghie e viti Z avanzano in automatico durante la stampa.
                </p>
              </div>

              {/* Griglia Manutenzione per le 4 Stampanti */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {printers.map((printer) => (
                  <div
                    key={printer.id}
                    className="bg-[#121215] border border-zinc-800 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                      <div>
                        <span className="font-mono-tech text-xs text-blue-400 font-semibold">
                          {printer.code}
                        </span>
                        <h3 className="text-sm font-semibold text-white">
                          {printer.brand} {printer.model}
                        </h3>
                      </div>
                      <div className="text-right font-mono-tech">
                        <span className="text-[10px] uppercase text-zinc-400 block">
                          Monte Ore Totale
                        </span>
                        <span className="text-sm font-bold text-white">
                          {printer.totalPrintHours.toFixed(1)} h
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {printer.components.map((comp) => {
                        const wearPct = Math.min(
                          100,
                          (comp.currentHours / comp.maxHours) * 100
                        );
                        const isWarning = wearPct >= 85;

                        return (
                          <div
                            key={comp.id}
                            className="bg-[#09090b] border border-zinc-800/90 p-2.5 rounded space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                                {isWarning && (
                                  <AlertTriangle
                                    size={13}
                                    className="text-amber-400 shrink-0"
                                  />
                                )}
                                {comp.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-mono-tech text-xs ${
                                    isWarning ? 'text-amber-400 font-bold' : 'text-zinc-400'
                                  }`}
                                >
                                  {comp.currentHours.toFixed(1)} / {comp.maxHours} h
                                </span>
                                <button
                                  onClick={() =>
                                    resetComponentWear(printer.id, comp.id)
                                  }
                                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-mono-tech transition-colors cursor-pointer"
                                  title="Segna manutenzione effettuata e azzera ore"
                                >
                                  Reset Tagliando
                                </button>
                              </div>
                            </div>

                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  wearPct >= 90
                                    ? 'bg-red-500'
                                    : wearPct >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${wearPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* CODA ORDINI DI APPROVVIGIONAMENTO */}
              <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShoppingCart size={16} className="text-amber-400" />
                    <span>Coda Ordini di Acquisto (Filamenti & Ricambi)</span>
                  </h3>
                  <span className="text-xs font-mono-tech text-zinc-400">
                    Generati automaticamente da soglie stock e usura
                  </span>
                </div>

                <div className="divide-y divide-zinc-800">
                  {orders.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-500 font-mono-tech">
                      Nessun ordine pendente. Scorte e componenti entro i parametri nominali.
                    </div>
                  ) : (
                    orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded font-mono-tech text-[10px] font-semibold ${
                              ord.priority === 'CRITICAL'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {ord.priority}
                          </span>
                          <div>
                            <div className="font-semibold text-zinc-100">
                              {ord.description}
                            </div>
                            <div className="font-mono-tech text-[11px] text-zinc-500">
                              Codice: {ord.itemCode} • Rilevato: {ord.createdAt}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono-tech font-semibold text-zinc-200">
                            € {ord.estimatedCost.toFixed(2)}
                          </span>

                          {ord.status === 'PENDING' ? (
                            <button
                              onClick={() => markOrderAsOrdered(ord.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer"
                            >
                              Segna Ordinato
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 bg-zinc-800 text-emerald-400 rounded font-mono-tech text-[11px] flex items-center gap-1">
                              <CheckCircle2 size={12} /> IN ARRIVO
                            </span>
                          )}

                          <button
                            onClick={() => deleteOrder(ord.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Rimuovi voce"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          BOTTOM NAVIGATION BAR PER IPHONE / MOBILE (< lg)
      ===================================================================== */}
      <nav className="lg:hidden bg-[#121215] border-t border-zinc-800 grid grid-cols-4 py-1.5 px-2 shrink-0 z-30">
        {[
          { id: 'fleet', label: 'Macchine', icon: Server },
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
              className={`flex flex-col items-center justify-center py-1.5 rounded transition-colors ${
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