import { addSystemLog } from './db';

// Helper to get admin PIN with fallback default '1234'
export function getAdminPin(): string {
  const savedPin = localStorage.getItem('adminPin') || localStorage.getItem('pin');
  return savedPin && savedPin.trim() ? savedPin.trim() : '1234';
}

// Helper to set admin PIN in localStorage
export function setAdminPin(newPin: string): void {
  const cleaned = newPin.trim();
  localStorage.setItem('adminPin', cleaned);
  localStorage.setItem('pin', cleaned);
}

// Check if PIN requirement is active
export function isPinRequired(): boolean {
  // By default true so admin is protected by PIN
  const val = localStorage.getItem('requirePin');
  return val === null ? true : val === 'true';
}

// Set PIN requirement toggle
export function setPinRequired(required: boolean): void {
  localStorage.setItem('requirePin', String(required));
}

// Verify entered PIN against stored PIN
export function verifyAdminPin(enteredPin: string): boolean {
  const correctPin = getAdminPin();
  return enteredPin.trim() === correctPin;
}

// Perform Admin Login using PIN
export function loginAdminWithPin(enteredPin: string): { success: boolean; message: string } {
  if (verifyAdminPin(enteredPin)) {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('userRole', 'admin');
    
    const adminName = localStorage.getItem('adminName') || 'Admin Tata Usaha';
    try {
      addSystemLog({
        action: 'LOGIN_ADMIN_PIN',
        category: 'Keamanan',
        level: 'success',
        user: adminName,
        details: `Petugas Admin (${adminName}) berhasil masuk ke Portal Admin menggunakan verifikasi PIN Keamanan.`,
        metadata: { client: navigator.userAgent, method: 'PIN' }
      });
    } catch (e) {
      console.error('Failed to log admin pin login:', e);
    }

    return {
      success: true,
      message: 'Verifikasi PIN Berhasil! Selamat datang di Portal Admin Tata Usaha.'
    };
  }

  try {
    addSystemLog({
      action: 'LOGIN_PIN_GAGAL',
      category: 'Keamanan',
      level: 'warning',
      user: 'Pengguna / Tamu',
      details: 'Percobaan akses masuk Portal Admin dengan PIN salah.',
    });
  } catch (e) {
    console.error('Failed to log failed pin login:', e);
  }

  return {
    success: false,
    message: 'PIN yang Anda masukkan salah. Silakan periksa kembali atau gunakan login akun.'
  };
}
