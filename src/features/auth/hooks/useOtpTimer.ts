import { useState, useEffect, useCallback } from 'react';

const OTP_EXPIRY_KEY = 'otp_expiry_time';

function getRemainingSeconds(): number {
  const expiryTime = localStorage.getItem(OTP_EXPIRY_KEY);
  if (!expiryTime) return 0;
  const remaining = Math.floor((Number(expiryTime) - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

export function storeOtpExpiry(otpExpirySeconds: number) {
  const expiryTimestamp = Date.now() + otpExpirySeconds * 1000;
  localStorage.setItem(OTP_EXPIRY_KEY, String(expiryTimestamp));
}

export function clearOtpExpiry() {
  localStorage.removeItem(OTP_EXPIRY_KEY);
}

export function useOtpTimer() {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(getRemainingSeconds);

  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      const updated = getRemainingSeconds();
      setRemainingSeconds(updated);
      if (updated <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const resetTimer = useCallback((otpExpirySeconds: number) => {
    storeOtpExpiry(otpExpirySeconds);
    setRemainingSeconds(otpExpirySeconds);
  }, []);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isExpired = remainingSeconds <= 0;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { minutes, seconds, remainingSeconds, isExpired, display, resetTimer };
}
