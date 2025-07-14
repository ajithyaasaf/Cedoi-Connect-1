import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please grant camera permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualEntry = () => {
    const qrCode = prompt('Enter QR code manually:');
    if (qrCode && qrCode.trim()) {
      onScan(qrCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="bg-accent rounded-full p-3">
                <span className="material-icons text-white text-2xl">qr_code_scanner</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Scan QR Code</h2>
            <p className="text-sm text-gray-600">Position the QR code within the camera frame</p>
          </div>

          {error ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="material-icons text-red-500">error</span>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* QR Code Frame Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-accent"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-accent"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-accent"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-accent"></div>
                  </div>
                </div>

                {isScanning && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black bg-opacity-50 text-white text-center py-2 px-4 rounded-lg">
                      <p className="text-sm">Looking for QR code...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleManualEntry}
              variant="outline"
              className="w-full py-3 px-4 border-2 border-accent text-accent hover:bg-accent hover:text-white transition-all duration-200"
            >
              <span className="material-icons mr-2">keyboard</span>
              Enter Code Manually
            </Button>
            
            <div className="flex space-x-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                <span className="material-icons mr-2">close</span>
                Cancel
              </Button>
              {error && (
                <Button
                  onClick={startCamera}
                  className="flex-1 py-3 px-4 bg-accent hover:bg-accent/90 text-white transition-all duration-200"
                >
                  <span className="material-icons mr-2">refresh</span>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}