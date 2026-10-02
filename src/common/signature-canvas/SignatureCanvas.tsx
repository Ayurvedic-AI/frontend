import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';
import { cn } from '../../lib/cn';

export interface SignatureCanvasRef {
  clearCanvas: () => void;
  getSignatureData: () => string | null;
  isEmpty: () => boolean;
  loadImage: (imageUrl: string) => Promise<void>;
}

export interface SignatureCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  onSignatureChange?: (isEmpty: boolean) => void;
  onDrawEnd?: () => void;
  className?: string;
  style?: CSSProperties;
}

const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(function SignatureCanvas(
  {
    width = 400,
    height = 120,
    backgroundColor = '#FFFFFF',
    strokeColor = '#000000',
    strokeWidth = 2,
    onSignatureChange,
    onDrawEnd,
    className,
    style,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onSignatureChange?.(false);
      }
    },
    getSignatureData: () => (canvasRef.current && hasSignature ? canvasRef.current.toDataURL('image/png') : null),
    isEmpty: () => !hasSignature,
    loadImage: async (imageUrl: string) => {
      if (!canvasRef.current || !imageUrl) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        if (!imageUrl.startsWith('blob:')) img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          setHasSignature(true);
          onSignatureChange?.(true);
          resolve();
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [width, height, backgroundColor, strokeColor, strokeWidth]);

  function coords(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy };
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function start(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = coords(e);
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = coords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSignature) {
      setHasSignature(true);
      onSignatureChange?.(true);
    }
  }

  function end() {
    if (isDrawing && hasSignature) onDrawEnd?.();
    setIsDrawing(false);
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} style={style}>
      <div className="relative rounded-md border border-input bg-background" style={{ backgroundColor }}>
        <canvas
          ref={canvasRef}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
          style={{ display: 'block', width: '100%', height: `${height}px`, touchAction: 'none', cursor: 'crosshair' }}
        />
        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Signature drawing area
          </div>
        )}
      </div>
    </div>
  );
});

export default SignatureCanvas;
export { SignatureCanvas };
