import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PrinterBrand = 'Anycubic' | 'Creality';
export type PrinterStatus = 'PRINTING' | 'IDLE' | 'PAUSED' | 'MAINTENANCE' | 'OFFLINE';

export interface MaintenanceComponent {
  id: string;
  name: string;
  currentHours: number;
  maxHours: number;
  lastServiced: string;
}

export interface PrinterUnit {
  id: string;
  code: string;
  brand: PrinterBrand;
  model: string;
  ipAddress: string;
  port: number;
  apiType: 'Moonraker' | 'AnycubicCloud' | 'OctoPrint';
  status: PrinterStatus;
  loadedSpoolId: string | null;
  // Job attivo
  currentJobName: string | null;
  progress: number; // 0 - 100
  flowRateMm3s: number; // mm3/s per calcolo consumo grammi in tempo reale
  elapsedSeconds: number;
  estimatedTotalSeconds: number;
  // Telemetria Termica ed Elettrica
  nozzleTemp: number;
  nozzleTarget: number;
  bedTemp: number;
  bedTarget: number;
  currentWatts: number;
  ratedMaxWatts: number;
  totalKwhConsumed: number;
  // Telecamera
  streamUrl: string;
  // Manutenzione
  totalPrintHours: number;
  components: MaintenanceComponent[];
}

export interface Spool {
  id: string;
  sku: string;
  brand: string;
  material: 'PLA' | 'PETG' | 'ASA' | 'ABS' | 'TPU';
  colorName: string;
  colorHex: string;
  initialWeightG: number;
  remainingWeightG: number; // Scende in tempo reale (es. 742.84 g)
  densityGcm3: number; // PLA: 1.24, PETG: 1.27, ABS: 1.04
  costPerKg: number;
  reorderThresholdG: number;
  nfcUid: string;
}

export interface PurchaseOrder {
  id: string;
  createdAt: string;
  itemCode: string;
  description: string;
  category: 'FILAMENT' | 'SPARE_PART';
  priority: 'LOW' | 'HIGH' | 'CRITICAL';
  estimatedCost: number;
  status: 'PENDING' | 'ORDERED';
}

interface ErpState {
  electricityCostPerKwh: number;
  sessionKwh: number;
  sessionCostEur: number;
  printers: PrinterUnit[];
  spools: Spool[];
  orders: PurchaseOrder[];

  // Azioni Real-Time (1 secondo)
  tickRealTimeTelemetry: () => void;

  // Azioni Stampanti
  togglePrinterStatus: (printerId: string) => void;
  assignSpoolToPrinter: (printerId: string, spoolId: string) => void;
  updatePrinterNetwork: (printerId: string, ip: string, port: number, streamUrl: string) => void;
  addDiscoveredPrinter: (printer: Omit<PrinterUnit, 'id' | 'totalPrintHours' | 'totalKwhConsumed' | 'components'>) => void;

  // Azioni Filamenti
  addSpool: (spool: Omit<Spool, 'id'>) => void;
  refillSpool: (spoolId: string) => void;

  // Azioni Manutenzione & Ordini
  resetComponentWear: (printerId: string, componentId: string) => void;
  markOrderAsOrdered: (orderId: string) => void;
  deleteOrder: (orderId: string) => void;
  setElectricityRate: (rate: number) => void;
}

const createDefaultComponents = (h1 = 120, h2 = 310, h3 = 85): MaintenanceComponent[] => [
  { id: 'nozzle', name: 'Ugello Hardened 0.4mm', currentHours: h1, maxHours: 300, lastServiced: '2025-01-15' },
  { id: 'belts', name: 'Cinghie Gates GT2 X/Y', currentHours: h2, maxHours: 600, lastServiced: '2024-11-20' },
  { id: 'z_lube', name: 'Lubrificazione Viti Trapezoidali Z', currentHours: h3, maxHours: 150, lastServiced: '2025-02-01' },
  { id: 'ptfe', name: 'Tubo PTFE / Bowden Estrusore', currentHours: h1 + 40, maxHours: 400, lastServiced: '2025-01-10' },
];

export const useErpStore = create<ErpState>()(
  persist(
    (set, get) => ({
      electricityCostPerKwh: 0.28, // Tariffa media aziendale €/kWh
      sessionKwh: 14.82,
      sessionCostEur: 4.15,

      printers: [
        {
          id: 'any-01',
          code: 'ANC-KOBRA-01',
          brand: 'Anycubic',
          model: 'Kobra 3 Combo',
          ipAddress: '192.168.1.101',
          port: 7125,
          apiType: 'AnycubicCloud',
          status: 'PRINTING',
          loadedSpoolId: 'sp-1',
          currentJobName: 'staffa_supporto_industriale_v4.gcode',
          progress: 64.2,
          flowRateMm3s: 14.5, // ~0.018 grammi al secondo
          elapsedSeconds: 8420,
          estimatedTotalSeconds: 13100,
          nozzleTemp: 215,
          nozzleTarget: 215,
          bedTemp: 60,
          bedTarget: 60,
          currentWatts: 185,
          ratedMaxWatts: 400,
          totalKwhConsumed: 42.6,
          streamUrl: 'http://192.168.1.101:8080/?action=stream',
          totalPrintHours: 412.5,
          components: createDefaultComponents(265, 412, 138),
        },
        {
          id: 'any-02',
          code: 'ANC-KOBRA-02',
          brand: 'Anycubic',
          model: 'Kobra 2 Pro',
          ipAddress: '192.168.1.102',
          port: 7125,
          apiType: 'Moonraker',
          status: 'PRINTING',
          loadedSpoolId: 'sp-2',
          currentJobName: 'carter_protezione_motore_x10.gcode',
          progress: 28.7,
          flowRateMm3s: 18.2, // Alta velocità
          elapsedSeconds: 4100,
          estimatedTotalSeconds: 14200,
          nozzleTemp: 240,
          nozzleTarget: 240,
          bedTemp: 80,
          bedTarget: 80,
          currentWatts: 235,
          ratedMaxWatts: 400,
          totalKwhConsumed: 38.1,
          streamUrl: 'http://192.168.1.102:8080/?action=stream',
          totalPrintHours: 289.0,
          components: createDefaultComponents(140, 289, 148),
        },
        {
          id: 'any-03',
          code: 'ANC-KOBRA-03',
          brand: 'Anycubic',
          model: 'Kobra 2 Max',
          ipAddress: '192.168.1.103',
          port: 7125,
          apiType: 'AnycubicCloud',
          status: 'IDLE',
          loadedSpoolId: 'sp-3',
          currentJobName: 'In attesa di produzione',
          progress: 0,
          flowRateMm3s: 0,
          elapsedSeconds: 0,
          estimatedTotalSeconds: 0,
          nozzleTemp: 24,
          nozzleTarget: 0,
          bedTemp: 23,
          bedTarget: 0,
          currentWatts: 12, // Consumo standby scheda madre
          ratedMaxWatts: 500,
          totalKwhConsumed: 61.4,
          streamUrl: 'http://192.168.1.103:8080/?action=stream',
          totalPrintHours: 530.2,
          components: createDefaultComponents(295, 530, 60),
        },
        {
          id: 'cre-01',
          code: 'CRE-K1C-01',
          brand: 'Creality',
          model: 'K1 Max / Ender-3 V3',
          ipAddress: '192.168.1.104',
          port: 4408,
          apiType: 'Moonraker',
          status: 'PRINTING',
          loadedSpoolId: 'sp-4',
          currentJobName: 'alloggiamento_sensore_ottico_ASA.gcode',
          progress: 81.4,
          flowRateMm3s: 16.0,
          elapsedSeconds: 11200,
          estimatedTotalSeconds: 13750,
          nozzleTemp: 260,
          nozzleTarget: 260,
          bedTemp: 100,
          bedTarget: 100,
          currentWatts: 310, // Camera calda + piatto a 100°C
          ratedMaxWatts: 600,
          totalKwhConsumed: 54.9,
          streamUrl: 'http://192.168.1.104:8080/?action=stream',
          totalPrintHours: 365.8,
          components: createDefaultComponents(180, 365, 110),
        },
      ],

      spools: [
        {
          id: 'sp-1',
          sku: 'FIL-PLA-BLK-01',
          brand: 'Anycubic High-Speed',
          material: 'PLA',
          colorName: 'Nero Opaco Industriale',
          colorHex: '#1e293b',
          initialWeightG: 1000,
          remainingWeightG: 642.5,
          densityGcm3: 1.24,
          costPerKg: 18.5,
          reorderThresholdG: 250,
          nfcUid: '04:A2:88:1B:99:20',
        },
        {
          id: 'sp-2',
          sku: 'FIL-PETG-GRY-02',
          brand: 'eSUN PRO',
          material: 'PETG',
          colorName: 'Grigio Meccanico',
          colorHex: '#64748b',
          initialWeightG: 1000,
          remainingWeightG: 214.8, // Sotto soglia -> Innesca ordine
          densityGcm3: 1.27,
          costPerKg: 21.0,
          reorderThresholdG: 250,
          nfcUid: '04:B7:12:4C:31:88',
        },
        {
          id: 'sp-3',
          sku: 'FIL-PLA-WHT-03',
          brand: 'Creality Hyper',
          material: 'PLA',
          colorName: 'Bianco Ottico',
          colorHex: '#f8fafc',
          initialWeightG: 1000,
          remainingWeightG: 890.0,
          densityGcm3: 1.24,
          costPerKg: 19.9,
          reorderThresholdG: 250,
          nfcUid: '04:C1:44:9E:10:02',
        },
        {
          id: 'sp-4',
          sku: 'FIL-ASA-ORG-04',
          brand: 'Polymaker Polylite',
          material: 'ASA',
          colorName: 'Arancio Sicurezza',
          colorHex: '#f97316',
          initialWeightG: 1000,
          remainingWeightG: 418.2,
          densityGcm3: 1.07,
          costPerKg: 29.5,
          reorderThresholdG: 250,
          nfcUid: '04:D9:55:2A:77:19',
        },
      ],

      orders: [
        {
          id: 'ord-init-1',
          createdAt: 'Oggi, 08:30',
          itemCode: 'FIL-PETG-GRY-02',
          description: 'Bobina eSUN PRO PETG Grigio Meccanico (Sotto soglia 250g)',
          category: 'FILAMENT',
          priority: 'HIGH',
          estimatedCost: 21.0,
          status: 'PENDING',
        },
        {
          id: 'ord-init-2',
          createdAt: 'Oggi, 09:15',
          itemCode: 'MNT-ANC-03-NOZZLE',
          description: 'Ugello Hardened 0.4mm per ANC-KOBRA-03 (295/300h usura)',
          category: 'SPARE_PART',
          priority: 'CRITICAL',
          estimatedCost: 14.5,
          status: 'PENDING',
        },
      ],

      // MOTORE FISICO A 1 SECONDO (Consumo Filamento + Corrente + Usura)
      tickRealTimeTelemetry: () =>
        set((state) => {
          let totalWattsThisSecond = 0;
          const updatedSpools = [...state.spools];
          const updatedOrders = [...state.orders];

          const updatedPrinters = state.printers.map((printer) => {
            if (printer.status !== 'PRINTING') {
              const idleWatts = printer.status === 'OFFLINE' ? 0 : 12;
              totalWattsThisSecond += idleWatts;
              return { ...printer, currentWatts: idleWatts };
            }

            // 1. Oscilla realisticamente i Watt del PID riscaldamento (+/- 6W)
            const pidVariation = Math.sin(Date.now() / 1000) * 6;
            const basePrintWatts =
              printer.bedTarget >= 90 ? 305 : printer.bedTarget >= 75 ? 230 : 180;
            const liveWatts = Math.round(basePrintWatts + pidVariation);
            totalWattsThisSecond += liveWatts;

            const kwhAdded = liveWatts / 1000 / 3600;

            // 2. Calcola grammi consumati in questo secondo: (mm3/s / 1000) * densità
            const spoolIndex = updatedSpools.findIndex(
              (s) => s.id === printer.loadedSpoolId
            );
            if (spoolIndex !== -1) {
              const spool = updatedSpools[spoolIndex];
              // Moltiplicatore visivo x4 per rendere ben percepibile lo scorrimento dei centesimi di grammo a schermo
              const gramsPerSecond =
                ((printer.flowRateMm3s / 1000) * spool.densityGcm3) * 4;
              const newRemaining = Math.max(
                0,
                Number((spool.remainingWeightG - gramsPerSecond).toFixed(3))
              );

              updatedSpools[spoolIndex] = {
                ...spool,
                remainingWeightG: newRemaining,
              };

              // Controlla se scende sotto soglia per generare l'ordine in automatico
              if (
                newRemaining <= spool.reorderThresholdG &&
                !updatedOrders.some((o) => o.itemCode === spool.sku && o.status === 'PENDING')
              ) {
                updatedOrders.unshift({
                  id: `ord-${Date.now()}`,
                  createdAt: 'Adesso (Auto-Trigger)',
                  itemCode: spool.sku,
                  description: `Riordino ${spool.brand} ${spool.material} ${spool.colorName} (Residuo < ${spool.reorderThresholdG}g)`,
                  category: 'FILAMENT',
                  priority: newRemaining < 100 ? 'CRITICAL' : 'HIGH',
                  estimatedCost: spool.costPerKg,
                  status: 'PENDING',
                });
              }
            }

            // 3. Aggiorna avanzamento job e ore di manutenzione
            const newElapsed = printer.elapsedSeconds + 1;
            const newProgress = Math.min(
              100,
              Number(((newElapsed / printer.estimatedTotalSeconds) * 100).toFixed(2))
            );
            const hourIncrement = 1 / 3600;

            const updatedComponents = printer.components.map((comp) => {
              const nextHours = Number((comp.currentHours + hourIncrement).toFixed(4));
              return { ...comp, currentHours: nextHours };
            });

            return {
              ...printer,
              currentWatts: liveWatts,
              totalKwhConsumed: Number((printer.totalKwhConsumed + kwhAdded).toFixed(4)),
              elapsedSeconds: newElapsed >= printer.estimatedTotalSeconds ? 0 : newElapsed,
              progress: newProgress >= 100 ? 0 : newProgress,
              totalPrintHours: Number((printer.totalPrintHours + hourIncrement).toFixed(3)),
              components: updatedComponents,
            };
          });

          const totalKwhTick = totalWattsThisSecond / 1000 / 3600;
          const newSessionKwh = Number((state.sessionKwh + totalKwhTick).toFixed(5));
          const newSessionCost = Number(
            (newSessionKwh * state.electricityCostPerKwh).toFixed(4)
          );

          return {
            printers: updatedPrinters,
            spools: updatedSpools,
            orders: updatedOrders,
            sessionKwh: newSessionKwh,
            sessionCostEur: newSessionCost,
          };
        }),

      togglePrinterStatus: (printerId) =>
        set((state) => ({
          printers: state.printers.map((p) => {
            if (p.id !== printerId) return p;
            const nextStatus: PrinterStatus =
              p.status === 'PRINTING' ? 'IDLE' : 'PRINTING';
            return {
              ...p,
              status: nextStatus,
              flowRateMm3s: nextStatus === 'PRINTING' ? 15.0 : 0,
              nozzleTemp: nextStatus === 'PRINTING' ? 215 : 25,
              nozzleTarget: nextStatus === 'PRINTING' ? 215 : 0,
              bedTemp: nextStatus === 'PRINTING' ? 60 : 24,
              bedTarget: nextStatus === 'PRINTING' ? 60 : 0,
              currentJobName:
                nextStatus === 'PRINTING'
                  ? 'lotto_produzione_serie_B.gcode'
                  : 'In attesa di produzione',
              estimatedTotalSeconds: p.estimatedTotalSeconds || 10800,
            };
          }),
        })),

      assignSpoolToPrinter: (printerId, spoolId) =>
        set((state) => ({
          printers: state.printers.map((p) =>
            p.id === printerId ? { ...p, loadedSpoolId: spoolId } : p
          ),
        })),

      updatePrinterNetwork: (printerId, ipAddress, port, streamUrl) =>
        set((state) => ({
          printers: state.printers.map((p) =>
            p.id === printerId ? { ...p, ipAddress, port, streamUrl } : p
          ),
        })),

      addDiscoveredPrinter: (newP) =>
        set((state) => ({
          printers: [
            ...state.printers,
            {
              ...newP,
              id: `pr-${Date.now()}`,
              totalPrintHours: 0,
              totalKwhConsumed: 0,
              components: createDefaultComponents(0, 0, 0),
            },
          ],
        })),

      addSpool: (spoolData) =>
        set((state) => ({
          spools: [...state.spools, { ...spoolData, id: `sp-${Date.now()}` }],
        })),

      refillSpool: (spoolId) =>
        set((state) => ({
          spools: state.spools.map((s) =>
            s.id === spoolId ? { ...s, remainingWeightG: s.initialWeightG } : s
          ),
        })),

      resetComponentWear: (printerId, componentId) =>
        set((state) => ({
          printers: state.printers.map((p) =>
            p.id === printerId
              ? {
                  ...p,
                  components: p.components.map((c) =>
                    c.id === componentId
                      ? {
                          ...c,
                          currentHours: 0,
                          lastServiced: new Date().toISOString().split('T')[0],
                        }
                      : c
                  ),
                }
              : p
          ),
        })),

      markOrderAsOrdered: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'ORDERED' } : o
          ),
        })),

      deleteOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== orderId),
        })),

      setElectricityRate: (rate) => set({ electricityCostPerKwh: rate }),
    }),
    {
      name: 'enterprise-3d-erp-v3',
    }
  )
);