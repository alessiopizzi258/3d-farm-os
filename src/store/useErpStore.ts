import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PrinterBrand = 'Anycubic' | 'Creality' | 'Altro';
export type PrinterStatus = 'PRINTING' | 'IDLE' | 'PAUSED' | 'OFFLINE';

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
  apiType: 'Moonraker' | 'OctoPrint' | 'Manuale';
  smartPlugIp?: string; // Opzionale: IP presa Shelly / Tasmota per lettura Watt reali
  status: PrinterStatus;
  loadedSpoolId: string | null;
  currentJobName: string;
  progress: number;
  flowRateMm3s: number;
  elapsedSeconds: number;
  estimatedTotalSeconds: number;
  nozzleTemp: number;
  nozzleTarget: number;
  bedTemp: number;
  bedTarget: number;
  currentWatts: number;
  printingWattsConfig: number; // Watt medi reali in stampa (configurabili)
  idleWattsConfig: number;     // Watt in standby (configurabili)
  ratedMaxWatts: number;
  totalKwhConsumed: number;
  streamUrl: string;
  totalPrintHours: number;
  isLiveConnected: boolean;    // True se risponde al ping di rete
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
  remainingWeightG: number;
  densityGcm3: number;
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

  // Motore Real-Time
  tickRealTimeTelemetry: () => void;
  pollRealHardware: () => Promise<{ onlineCount: number; details: string[] }>;

  // CRUD Stampanti
  addPrinter: (printer: Omit<PrinterUnit, 'id' | 'totalPrintHours' | 'totalKwhConsumed' | 'components' | 'currentWatts' | 'isLiveConnected' | 'elapsedSeconds'>) => void;
  updatePrinter: (id: string, data: Partial<PrinterUnit>) => void;
  deletePrinter: (id: string) => void;
  togglePrinterStatus: (printerId: string) => void;
  assignSpoolToPrinter: (printerId: string, spoolId: string | null) => void;

  // CRUD Filamenti
  addSpool: (spool: Omit<Spool, 'id'>) => void;
  updateSpoolWeight: (spoolId: string, newWeightG: number) => void;
  deleteSpool: (spoolId: string) => void;
  refillSpool: (spoolId: string) => void;

  // Manutenzione & Ordini
  resetComponentWear: (printerId: string, componentId: string) => void;
  addManualOrder: (description: string, category: 'FILAMENT' | 'SPARE_PART', cost: number, priority: 'LOW' | 'HIGH' | 'CRITICAL') => void;
  markOrderAsOrdered: (orderId: string) => void;
  deleteOrder: (orderId: string) => void;
  setElectricityRate: (rate: number) => void;
}

export const createDefaultComponents = (h1 = 0, h2 = 0, h3 = 0): MaintenanceComponent[] => [
  { id: 'nozzle', name: 'Ugello 0.4mm', currentHours: h1, maxHours: 300, lastServiced: new Date().toISOString().split('T')[0] },
  { id: 'belts', name: 'Cinghie GT2 X/Y', currentHours: h2, maxHours: 600, lastServiced: new Date().toISOString().split('T')[0] },
  { id: 'z_lube', name: 'Lubrificazione Viti Z', currentHours: h3, maxHours: 150, lastServiced: new Date().toISOString().split('T')[0] },
  { id: 'ptfe', name: 'Tubo PTFE Estrusore', currentHours: h1, maxHours: 400, lastServiced: new Date().toISOString().split('T')[0] },
];

export const useErpStore = create<ErpState>()(
  persist(
    (set, get) => ({
      electricityCostPerKwh: 0.28,
      sessionKwh: 0,
      sessionCostEur: 0,

      printers: [
        {
          id: 'any-01',
          code: 'ANYCUBIC-01',
          brand: 'Anycubic',
          model: 'Anycubic #1 (Configura IP)',
          ipAddress: '192.168.1.101',
          port: 7125,
          apiType: 'Moonraker',
          smartPlugIp: '',
          status: 'PRINTING',
          loadedSpoolId: 'sp-1',
          currentJobName: 'In stampa attiva',
          progress: 35,
          flowRateMm3s: 12.0,
          elapsedSeconds: 3600,
          estimatedTotalSeconds: 10800,
          nozzleTemp: 210,
          nozzleTarget: 210,
          bedTemp: 60,
          bedTarget: 60,
          currentWatts: 185,
          printingWattsConfig: 185,
          idleWattsConfig: 12,
          ratedMaxWatts: 400,
          totalKwhConsumed: 1.45,
          streamUrl: 'http://192.168.1.101:8080/?action=stream',
          totalPrintHours: 120.5,
          isLiveConnected: false,
          components: createDefaultComponents(120, 120, 45),
        },
        {
          id: 'any-02',
          code: 'ANYCUBIC-02',
          brand: 'Anycubic',
          model: 'Anycubic #2 (Configura IP)',
          ipAddress: '192.168.1.102',
          port: 7125,
          apiType: 'Moonraker',
          smartPlugIp: '',
          status: 'IDLE',
          loadedSpoolId: 'sp-2',
          currentJobName: 'Pronta',
          progress: 0,
          flowRateMm3s: 0,
          elapsedSeconds: 0,
          estimatedTotalSeconds: 7200,
          nozzleTemp: 24,
          nozzleTarget: 0,
          bedTemp: 24,
          bedTarget: 0,
          currentWatts: 12,
          printingWattsConfig: 190,
          idleWattsConfig: 12,
          ratedMaxWatts: 400,
          totalKwhConsumed: 0.85,
          streamUrl: 'http://192.168.1.102:8080/?action=stream',
          totalPrintHours: 85.0,
          isLiveConnected: false,
          components: createDefaultComponents(85, 85, 85),
        },
        {
          id: 'any-03',
          code: 'ANYCUBIC-03',
          brand: 'Anycubic',
          model: 'Anycubic #3 (Configura IP)',
          ipAddress: '192.168.1.103',
          port: 7125,
          apiType: 'Moonraker',
          smartPlugIp: '',
          status: 'IDLE',
          loadedSpoolId: null,
          currentJobName: 'Pronta',
          progress: 0,
          flowRateMm3s: 0,
          elapsedSeconds: 0,
          estimatedTotalSeconds: 7200,
          nozzleTemp: 23,
          nozzleTarget: 0,
          bedTemp: 23,
          bedTarget: 0,
          currentWatts: 12,
          printingWattsConfig: 210,
          idleWattsConfig: 12,
          ratedMaxWatts: 450,
          totalKwhConsumed: 2.1,
          streamUrl: 'http://192.168.1.103:8080/?action=stream',
          totalPrintHours: 210.0,
          isLiveConnected: false,
          components: createDefaultComponents(210, 210, 110),
        },
        {
          id: 'cre-01',
          code: 'CREALITY-01',
          brand: 'Creality',
          model: 'Creality #1 (Configura IP)',
          ipAddress: '192.168.1.104',
          port: 7125,
          apiType: 'Moonraker',
          smartPlugIp: '',
          status: 'PRINTING',
          loadedSpoolId: 'sp-2',
          currentJobName: 'Produzione lotto Creality',
          progress: 60,
          flowRateMm3s: 15.0,
          elapsedSeconds: 5400,
          estimatedTotalSeconds: 9000,
          nozzleTemp: 220,
          nozzleTarget: 220,
          bedTemp: 65,
          bedTarget: 65,
          currentWatts: 240,
          printingWattsConfig: 240,
          idleWattsConfig: 15,
          ratedMaxWatts: 500,
          totalKwhConsumed: 3.2,
          streamUrl: 'http://192.168.1.104:8080/?action=stream',
          totalPrintHours: 160.0,
          isLiveConnected: false,
          components: createDefaultComponents(160, 160, 60),
        },
      ],

      spools: [
        {
          id: 'sp-1',
          sku: 'FIL-PLA-01',
          brand: 'Anycubic',
          material: 'PLA',
          colorName: 'Nero',
          colorHex: '#18181b',
          initialWeightG: 1000,
          remainingWeightG: 780.0,
          densityGcm3: 1.24,
          costPerKg: 18.0,
          reorderThresholdG: 200,
          nfcUid: 'TAG-001',
        },
        {
          id: 'sp-2',
          sku: 'FIL-PETG-02',
          brand: 'Creality Hyper',
          material: 'PETG',
          colorName: 'Grigio',
          colorHex: '#64748b',
          initialWeightG: 1000,
          remainingWeightG: 420.0,
          densityGcm3: 1.27,
          costPerKg: 21.0,
          reorderThresholdG: 200,
          nfcUid: 'TAG-002',
        },
      ],

      orders: [],

      // POLLING HARDWARE REALE (Moonraker API + Shelly Smart Plug)
      pollRealHardware: async () => {
        const state = get();
        let onlineCount = 0;
        const details: string[] = [];

        const updatedPrinters = await Promise.all(
          state.printers.map(async (printer) => {
            if (printer.apiType === 'Manuale') {
              details.push(`${printer.code}: Modalità Manuale attiva (${printer.status})`);
              return printer;
            }

            let updatedPrinter = { ...printer };

            // 1. Tentativo interrogazione API Moonraker / Klipper
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 1800);
              const url = `http://${printer.ipAddress}:${printer.port}/printer/objects/query?heater_bed&extruder&print_stats&virtual_sdcard`;
              const res = await fetch(url, { signal: controller.signal });
              clearTimeout(timeout);

              if (res.ok) {
                const json = await res.json();
                const statusData = json?.result?.status;
                if (statusData) {
                  onlineCount++;
                  const rawState = statusData.print_stats?.state; // printing, paused, standby, complete
                  const mappedStatus: PrinterStatus =
                    rawState === 'printing'
                      ? 'PRINTING'
                      : rawState === 'paused'
                      ? 'PAUSED'
                      : 'IDLE';

                  updatedPrinter = {
                    ...updatedPrinter,
                    isLiveConnected: true,
                    status: mappedStatus,
                    nozzleTemp: Math.round(statusData.extruder?.temperature || updatedPrinter.nozzleTemp),
                    nozzleTarget: Math.round(statusData.extruder?.target || 0),
                    bedTemp: Math.round(statusData.heater_bed?.temperature || updatedPrinter.bedTemp),
                    bedTarget: Math.round(statusData.heater_bed?.target || 0),
                    currentJobName: statusData.print_stats?.filename || 'Nessun file attivo',
                    progress: Math.round((statusData.virtual_sdcard?.progress || 0) * 100),
                  };
                  details.push(`${printer.code} (${printer.ipAddress}:${printer.port}): CONNESSA LIVE [${mappedStatus}]`);
                }
              } else {
                updatedPrinter.isLiveConnected = false;
                details.push(`${printer.code} (${printer.ipAddress}): Nessuna risposta HTTP Moonraker (Uso stima energetica/filamento)`);
              }
            } catch {
              updatedPrinter.isLiveConnected = false;
              details.push(`${printer.code} (${printer.ipAddress}): Non raggiungibile da questo browser (Uso calcolo real-time interno)`);
            }

            // 2. Tentativo lettura Presa Smart Shelly (Gen1 /status o Gen2 /rpc/Switch.GetStatus?id=0)
            if (printer.smartPlugIp && printer.smartPlugIp.trim() !== '') {
              try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 1500);
                const resPlug = await fetch(`http://${printer.smartPlugIp}/rpc/Switch.GetStatus?id=0`, {
                  signal: controller.signal,
                });
                clearTimeout(timeout);
                if (resPlug.ok) {
                  const plugData = await resPlug.json();
                  if (typeof plugData.apower === 'number') {
                    updatedPrinter.currentWatts = Math.round(plugData.apower);
                    details.push(`Presa Smart ${printer.smartPlugIp}: Letti ${updatedPrinter.currentWatts} W reali`);
                  }
                }
              } catch {
                // Mantiene il calcolo Watt basato sullo stato
              }
            }

            return updatedPrinter;
          })
        );

        set({ printers: updatedPrinters });
        return { onlineCount, details };
      },

      // MOTORE A 1 SECONDO: Scorrimento Grammi + Calcolo Corrente kWh + Manutenzione
      tickRealTimeTelemetry: () =>
        set((state) => {
          let totalWattsThisSecond = 0;
          const updatedSpools = [...state.spools];
          const updatedOrders = [...state.orders];

          const updatedPrinters = state.printers.map((printer) => {
            if (printer.status === 'OFFLINE') {
              return { ...printer, currentWatts: 0 };
            }

            if (printer.status !== 'PRINTING') {
              const idleW = printer.idleWattsConfig || 12;
              totalWattsThisSecond += idleW;
              const idleKwh = idleW / 1000 / 3600;
              return {
                ...printer,
                currentWatts: idleW,
                totalKwhConsumed: Number((printer.totalKwhConsumed + idleKwh).toFixed(5)),
              };
            }

            // Se è in PRINTING: calcola oscillazione realistica PID attorno ai Watt configurati per quella stampante
            const pidDelta = Math.round(Math.sin(Date.now() / 1200) * 5);
            const liveWatts = Math.max(20, (printer.printingWattsConfig || 190) + pidDelta);
            totalWattsThisSecond += liveWatts;
            const kwhAdded = liveWatts / 1000 / 3600;

            // Scorrimento Grammi dalla Bobina associata
            const spoolIdx = updatedSpools.findIndex((s) => s.id === printer.loadedSpoolId);
            if (spoolIdx !== -1) {
              const spool = updatedSpools[spoolIdx];
              // Calcolo grammi/secondo da mm3/s * densità
              const flow = printer.flowRateMm3s > 0 ? printer.flowRateMm3s : 12.0;
              const gramsPerSecond = (flow / 1000) * spool.densityGcm3;
              const nextWeight = Math.max(
                0,
                Number((spool.remainingWeightG - gramsPerSecond).toFixed(3))
              );

              updatedSpools[spoolIdx] = {
                ...spool,
                remainingWeightG: nextWeight,
              };

              // Ordine automatico sotto soglia
              if (
                nextWeight <= spool.reorderThresholdG &&
                !updatedOrders.some((o) => o.itemCode === spool.sku && o.status === 'PENDING')
              ) {
                updatedOrders.unshift({
                  id: `ord-${Date.now()}`,
                  createdAt: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                  itemCode: spool.sku,
                  description: `Riordino Bobina ${spool.brand} ${spool.material} ${spool.colorName} (< ${spool.reorderThresholdG}g)`,
                  category: 'FILAMENT',
                  priority: nextWeight < 80 ? 'CRITICAL' : 'HIGH',
                  estimatedCost: spool.costPerKg,
                  status: 'PENDING',
                });
              }
            }

            const newElapsed = printer.elapsedSeconds + 1;
            const estTotal = printer.estimatedTotalSeconds > 0 ? printer.estimatedTotalSeconds : 10800;
            const newProgress = Math.min(100, Number(((newElapsed / estTotal) * 100).toFixed(2)));
            const hourInc = 1 / 3600;

            return {
              ...printer,
              currentWatts: liveWatts,
              totalKwhConsumed: Number((printer.totalKwhConsumed + kwhAdded).toFixed(5)),
              elapsedSeconds: newElapsed >= estTotal ? 0 : newElapsed,
              progress: printer.isLiveConnected ? printer.progress : newProgress,
              totalPrintHours: Number((printer.totalPrintHours + hourInc).toFixed(3)),
              components: printer.components.map((c) => ({
                ...c,
                currentHours: Number((c.currentHours + hourInc).toFixed(4)),
              })),
            };
          });

          const tickKwh = totalWattsThisSecond / 1000 / 3600;
          const nextSessionKwh = Number((state.sessionKwh + tickKwh).toFixed(5));
          const nextSessionCost = Number((nextSessionKwh * state.electricityCostPerKwh).toFixed(4));

          return {
            printers: updatedPrinters,
            spools: updatedSpools,
            orders: updatedOrders,
            sessionKwh: nextSessionKwh,
            sessionCostEur: nextSessionCost,
          };
        }),

      addPrinter: (newP) =>
        set((state) => ({
          printers: [
            ...state.printers,
            {
              ...newP,
              id: `pr-${Date.now()}`,
              currentWatts: newP.status === 'PRINTING' ? newP.printingWattsConfig : newP.idleWattsConfig,
              totalKwhConsumed: 0,
              totalPrintHours: 0,
              elapsedSeconds: 0,
              isLiveConnected: false,
              components: createDefaultComponents(0, 0, 0),
            },
          ],
        })),

      updatePrinter: (id, data) =>
        set((state) => ({
          printers: state.printers.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      deletePrinter: (id) =>
        set((state) => ({
          printers: state.printers.filter((p) => p.id !== id),
        })),

      togglePrinterStatus: (printerId) =>
        set((state) => ({
          printers: state.printers.map((p) => {
            if (p.id !== printerId) return p;
            const nextStatus: PrinterStatus = p.status === 'PRINTING' ? 'IDLE' : 'PRINTING';
            return {
              ...p,
              status: nextStatus,
              flowRateMm3s: nextStatus === 'PRINTING' ? (p.flowRateMm3s || 14.0) : 0,
              nozzleTemp: nextStatus === 'PRINTING' ? 215 : 25,
              nozzleTarget: nextStatus === 'PRINTING' ? 215 : 0,
              bedTemp: nextStatus === 'PRINTING' ? 60 : 24,
              bedTarget: nextStatus === 'PRINTING' ? 60 : 0,
              currentWatts: nextStatus === 'PRINTING' ? p.printingWattsConfig : p.idleWattsConfig,
            };
          }),
        })),

      assignSpoolToPrinter: (printerId, spoolId) =>
        set((state) => ({
          printers: state.printers.map((p) =>
            p.id === printerId ? { ...p, loadedSpoolId: spoolId || null } : p
          ),
        })),

      addSpool: (spoolData) =>
        set((state) => ({
          spools: [...state.spools, { ...spoolData, id: `sp-${Date.now()}` }],
        })),

      updateSpoolWeight: (spoolId, newWeightG) =>
        set((state) => ({
          spools: state.spools.map((s) =>
            s.id === spoolId ? { ...s, remainingWeightG: Math.max(0, newWeightG) } : s
          ),
        })),

      deleteSpool: (spoolId) =>
        set((state) => ({
          spools: state.spools.filter((s) => s.id !== spoolId),
          printers: state.printers.map((p) =>
            p.loadedSpoolId === spoolId ? { ...p, loadedSpoolId: null } : p
          ),
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

      addManualOrder: (description, category, estimatedCost, priority) =>
        set((state) => ({
          orders: [
            {
              id: `ord-${Date.now()}`,
              createdAt: new Date().toLocaleDateString('it-IT'),
              itemCode: category === 'FILAMENT' ? 'MAN-FIL' : 'MAN-PART',
              description,
              category,
              priority,
              estimatedCost,
              status: 'PENDING',
            },
            ...state.orders,
          ],
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
      name: 'enterprise-3d-erp-v4',
    }
  )
);