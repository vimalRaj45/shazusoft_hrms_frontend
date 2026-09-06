import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Slider,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
  Stack,
  Divider,
  Paper
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  RotateLeft as RotateLeftIcon,
  CropFree as FitIcon,
  AspectRatio as FillIcon,
  RestartAlt as ResetIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AccountCircle as AvatarIcon,
  CameraAlt as CameraIcon
} from '@mui/icons-material';

const CANVAS_SIZE = 360; // Preview viewport size
const OUTPUT_SIZE = 512; // Exported high-resolution avatar size

export default function ImageCropperModal({
  open,
  imageSrc,
  fileName = 'avatar.jpg',
  onClose,
  onCropComplete,
  isUploading = false
}) {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const imageRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(0.5);
  const [maxScale, setMaxScale] = useState(3.5);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');

  // Reset all adjustments when a new image is loaded
  useEffect(() => {
    if (!imageSrc || !open) {
      setImageLoaded(false);
      setScale(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setPreviewDataUrl('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      // Calculate initial fit
      const cropDiameter = CANVAS_SIZE * 0.78;
      const isRotated = rotation % 180 !== 0;
      const naturalWidth = isRotated ? img.naturalHeight : img.naturalWidth;
      const naturalHeight = isRotated ? img.naturalWidth : img.naturalHeight;

      const scaleX = cropDiameter / naturalWidth;
      const scaleY = cropDiameter / naturalHeight;
      // Default: fill crop area so no empty gaps
      const initialScale = Math.max(scaleX, scaleY);

      setMinScale(Math.min(scaleX, scaleY) * 0.7);
      setMaxScale(initialScale * 3.5);
      setScale(initialScale);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, open]);

  // Redraw canvas on changes
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw checkered transparency background
    const gridSize = 16;
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        ctx.fillStyle = (Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0 ? '#f8fafc' : '#e2e8f0';
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }

    // Save state before image transformation
    ctx.save();
    // Center point of canvas
    ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw the image centered
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Draw dark semi-transparent overlay outside circular & square avatar guides
    const cropDiameter = width * 0.78;
    const radius = cropDiameter / 2;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.save();
    // Fill full backdrop with darkened mask
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(0, 0, width, height);

    // Clear the circular avatar aperture
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Reset composite operation to draw overlay borders and guides
    ctx.globalCompositeOperation = 'source-over';

    // Circular Avatar boundary ring (White + Green accent)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle square frame guide for 4px border radius card preview
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(centerX - radius, centerY - radius, cropDiameter, cropDiameter);
    ctx.setLineDash([]);

    // Rule-of-thirds grid inside circular aperture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    // Vertical grid lines
    ctx.moveTo(centerX - radius + cropDiameter / 3, centerY - radius);
    ctx.lineTo(centerX - radius + cropDiameter / 3, centerY + radius);
    ctx.moveTo(centerX - radius + (2 * cropDiameter) / 3, centerY - radius);
    ctx.lineTo(centerX - radius + (2 * cropDiameter) / 3, centerY + radius);
    // Horizontal grid lines
    ctx.moveTo(centerX - radius, centerY - radius + cropDiameter / 3);
    ctx.lineTo(centerX + radius, centerY - radius + cropDiameter / 3);
    ctx.moveTo(centerX - radius, centerY - radius + (2 * cropDiameter) / 3);
    ctx.lineTo(centerX + radius, centerY - radius + (2 * cropDiameter) / 3);
    ctx.stroke();

    ctx.restore();

    // Generate real-time live preview thumbnail
    updateLivePreview();
  }, [imageLoaded, scale, rotation, offset]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Update live circular and square preview
  const updateLivePreview = () => {
    const img = imageRef.current;
    if (!img || !imageLoaded) return;

    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const pCtx = previewCanvas.getContext('2d');
    const pSize = 120;
    previewCanvas.width = pSize;
    previewCanvas.height = pSize;
    pCtx.clearRect(0, 0, pSize, pSize);

    const cropDiameter = CANVAS_SIZE * 0.78;
    const ratio = pSize / cropDiameter;

    pCtx.save();
    pCtx.translate(pSize / 2 + offset.x * ratio, pSize / 2 + offset.y * ratio);
    pCtx.rotate((rotation * Math.PI) / 180);
    pCtx.scale(scale * ratio, scale * ratio);
    pCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    pCtx.restore();

    try {
      setPreviewDataUrl(previewCanvas.toDataURL('image/jpeg', 0.85));
    } catch (e) {}
  };

  // Mouse / Touch drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return;

    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // "Fit to Profile" button logic: scales entire image to fit inside avatar without any edge cut off
  const handleFitToProfile = () => {
    const img = imageRef.current;
    if (!img) return;

    const cropDiameter = CANVAS_SIZE * 0.78;
    const isRotated = rotation % 180 !== 0;
    const naturalWidth = isRotated ? img.naturalHeight : img.naturalWidth;
    const naturalHeight = isRotated ? img.naturalWidth : img.naturalHeight;

    // Minimum scale so the largest dimension fits inside circular frame
    const fitScale = Math.min(cropDiameter / naturalWidth, cropDiameter / naturalHeight);
    setScale(fitScale);
    setOffset({ x: 0, y: 0 });
  };

  // "Fill Avatar" button logic: scales image to cover avatar completely without empty space
  const handleFillFrame = () => {
    const img = imageRef.current;
    if (!img) return;

    const cropDiameter = CANVAS_SIZE * 0.78;
    const isRotated = rotation % 180 !== 0;
    const naturalWidth = isRotated ? img.naturalHeight : img.naturalWidth;
    const naturalHeight = isRotated ? img.naturalWidth : img.naturalHeight;

    const fillScale = Math.max(cropDiameter / naturalWidth, cropDiameter / naturalHeight);
    setScale(fillScale);
    setOffset({ x: 0, y: 0 });
  };

  // Rotate 90°
  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Reset to initial
  const handleReset = () => {
    const img = imageRef.current;
    if (!img) return;
    const cropDiameter = CANVAS_SIZE * 0.78;
    const fillScale = Math.max(cropDiameter / img.naturalWidth, cropDiameter / img.naturalHeight);
    setScale(fillScale);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Final Crop & Export
  const handleApplyCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = OUTPUT_SIZE;
    exportCanvas.height = OUTPUT_SIZE;
    const eCtx = exportCanvas.getContext('2d');

    // Fill with clean background (for photos with transparent PNG background)
    eCtx.fillStyle = '#ffffff';
    eCtx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const cropDiameter = CANVAS_SIZE * 0.78;
    const exportRatio = OUTPUT_SIZE / cropDiameter;

    eCtx.save();
    // Center point of output canvas
    eCtx.translate(OUTPUT_SIZE / 2 + offset.x * exportRatio, OUTPUT_SIZE / 2 + offset.y * exportRatio);
    eCtx.rotate((rotation * Math.PI) / 180);
    eCtx.scale(scale * exportRatio, scale * exportRatio);
    eCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    eCtx.restore();

    // Export high-quality JPEG
    const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.9);

    if (onCropComplete) {
      onCropComplete({
        croppedDataUrl,
        filename: fileName.replace(/\.[^/.]+$/, '') + '_cropped.jpg'
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isUploading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Hidden off-screen canvas for real-time live preview rendering */}
      <canvas ref={previewCanvasRef} style={{ display: 'none' }} />

      <DialogTitle
        sx={{
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          py: 1.5,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CameraIcon sx={{ color: '#133829', fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
            Crop & Fit Profile Picture
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disabled={isUploading}
          sx={{ color: '#64748b', '&:hover': { color: '#0f172a' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#ffffff' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="center">
          {/* Main Interactive Canvas Area */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                position: 'relative',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                border: '2px solid #cbd5e1',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                touchAction: 'none'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />

              {!imageLoaded && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.85)',
                    gap: 1
                  }}
                >
                  <CircularProgress size={32} sx={{ color: '#133829' }} />
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Loading image...
                  </Typography>
                </Box>
              )}
            </Box>

            <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
              Drag to reposition • Use slider below to zoom in/out
            </Typography>

            {/* Zoom Slider & Quick Adjust Controls */}
            <Paper
              elevation={0}
              sx={{
                width: CANVAS_SIZE,
                p: 1.5,
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '4px'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Tooltip title="Zoom Out">
                  <IconButton
                    size="small"
                    onClick={() => setScale((s) => Math.max(minScale, s - 0.15))}
                    disabled={scale <= minScale}
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Slider
                  size="small"
                  value={scale}
                  min={minScale}
                  max={maxScale}
                  step={0.02}
                  onChange={(e, val) => setScale(val)}
                  sx={{
                    color: '#133829',
                    '& .MuiSlider-thumb': {
                      width: 14,
                      height: 14,
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 6px rgba(19, 56, 41, 0.16)'
                      }
                    }
                  }}
                />

                <Tooltip title="Zoom In">
                  <IconButton
                    size="small"
                    onClick={() => setScale((s) => Math.min(maxScale, s + 0.15))}
                    disabled={scale >= maxScale}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Action Buttons: Fit, Fill, Rotate, Reset */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FitIcon sx={{ fontSize: 16 }} />}
                  onClick={handleFitToProfile}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderColor: '#cbd5e1',
                    color: '#0f172a',
                    '&:hover': { borderColor: '#133829', bgcolor: '#f0fdf4' }
                  }}
                >
                  Fit to Profile
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FillIcon sx={{ fontSize: 16 }} />}
                  onClick={handleFillFrame}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderColor: '#cbd5e1',
                    color: '#0f172a',
                    '&:hover': { borderColor: '#133829', bgcolor: '#f0fdf4' }
                  }}
                >
                  Fill Frame
                </Button>

                <Tooltip title="Rotate 90° Clockwise">
                  <IconButton size="small" onClick={handleRotateRight} sx={{ border: '1px solid #cbd5e1', p: 0.6 }}>
                    <RotateRightIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Reset Framing">
                  <IconButton size="small" onClick={handleReset} sx={{ border: '1px solid #cbd5e1', p: 0.6 }}>
                    <ResetIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* Right Preview Panel: Live Avatar Renderings */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 200 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              Live Profile Previews
            </Typography>

            {/* Large Circular Avatar Preview (Profile Header) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8 }}>
              <Avatar
                src={previewDataUrl}
                sx={{
                  width: 88,
                  height: 88,
                  border: '3px solid #133829',
                  boxShadow: '0 6px 16px rgba(19, 56, 41, 0.2)',
                  bgcolor: '#133829',
                  fontSize: 28,
                  fontWeight: 800
                }}
              >
                <AvatarIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                Profile Header (88px)
              </Typography>
            </Box>

            {/* Small Circular Avatar Preview (Navbar size) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, bgcolor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', width: '100%' }}>
              <Avatar
                src={previewDataUrl}
                sx={{
                  width: 36,
                  height: 36,
                  border: '1.5px solid #133829',
                  bgcolor: '#133829'
                }}
              >
                <AvatarIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', display: 'block' }}>
                  Top Navbar (36px)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                  Live Header View
                </Typography>
              </Box>
            </Box>

            {/* Square 4px Border Radius Preview (Staff Timesheet / Cards) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, bgcolor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', width: '100%' }}>
              <Avatar
                src={previewDataUrl}
                variant="rounded"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '4px',
                  border: '1.5px solid #133829',
                  bgcolor: '#133829'
                }}
              >
                <AvatarIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', display: 'block' }}>
                  Staff Badge (36px)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                  Timesheet & ID Card
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', width: '100%' }}>
              <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600, display: 'block', lineHeight: 1.4 }}>
                ✓ Exported at <strong>512x512 High-Res</strong>
                <br />✓ Optimized client-side before Cloudflare R2 upload
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isUploading}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: '4px', fontWeight: 600, textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleApplyCrop}
          disabled={!imageLoaded || isUploading}
          variant="contained"
          startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
          sx={{
            borderRadius: '4px',
            fontWeight: 800,
            textTransform: 'none',
            bgcolor: '#133829',
            '&:hover': { bgcolor: '#0b2319' },
            px: 2.5
          }}
        >
          {isUploading ? 'Uploading to Cloudflare R2...' : 'Crop & Upload Profile Photo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
