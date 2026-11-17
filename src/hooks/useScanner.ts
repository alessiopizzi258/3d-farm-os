import { useState, useCallback } from 'react';

export function useScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Protocollo NFC (Android / Chrome)
  const startNFC = useCallback(async () => {
    try {
      if (!('NDEFReader' in window)) {
        alert('NFC non supportato su questo browser. Usa fotocamera o tag con URL.');
        return;
      }
      setIsScanning(true);
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.scan();
      
      ndef.onreading = (event: any) => {
        const decoder = new TextDecoder();
        for (const record of event.message.records) {
          if (record.recordType === "text") {
            const data = decoder.decode(record.data);
            setScanResult(data);
            setIsScanning(false);
          }
        }
      };
    } catch (error) {
      console.error("Errore NFC:", error);
      setIsScanning(false);
    }
  }, []);

  // Protocollo Barcode/QR via API nativa Fotocamera
  const startCameraScan = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      videoElement.srcObject = stream;
      videoElement.setAttribute("playsinline", "true");
      videoElement.play();

      // Utilizzo della BarcodeDetector API (latenza zero, se supportata)
      if ('BarcodeDetector' in window) {
        // @ts-ignore
        const detector = new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128'] });
        
        const scanLoop = setInterval(async () => {
          const barcodes = await detector.detect(videoElement);
          if (barcodes.length > 0) {
            setScanResult(barcodes[0].rawValue);
            clearInterval(scanLoop);
            stream.getTracks().forEach(track => track.stop());
            setIsScanning(false);
          }
        }, 300);
      } else {
        alert("API Barcode nativa non supportata. Necessario fallback a libreria JS (es. html5-qrcode).");
      }
    } catch (error) {
      console.error("Errore Fotocamera:", error);
      setIsScanning(false);
    }
  }, []);

  return { scanResult, isScanning, startNFC, startCameraScan, setScanResult };
}