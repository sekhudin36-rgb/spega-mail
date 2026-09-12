import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  Bell, 
  Database, 
  Save, 
  ShieldCheck, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Palette,
  Cloud,
  ExternalLink,
  RefreshCw,
  FolderTree,
  Check,
  AlertCircle,
  FolderCheck,
  FileText,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  RotateCcw,
  Eye,
  EyeOff,
  KeyRound,
  Layers,
  FileDown
} from 'lucide-react';
import { db } from '../lib/db';
import { cn } from '../lib/utils';
import { useConfirm } from '../components/ConfirmProvider';
import { DEFAULT_LEFT_LOGO, DEFAULT_RIGHT_LOGO } from '../lib/printHelper';
import { 
  getRootFolderId, 
  setRootFolderId, 
  extractFolderId, 
  getDriveFolderUrl, 
  DEFAULT_DRIVE_FOLDER_ID,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  getGoogleAccessToken,
  getGoogleUser,
  verifyFolderAccess,
  isAutoSyncEnabled,
  setAutoSyncEnabled
} from '../lib/googleDrive';
import GoogleDriveModal from '../components/GoogleDriveModal';
import AdminPinModal from '../components/AdminPinModal';
import { generateFullUserManualPdf } from '../lib/pdfGuideHelper';
import { getAdminPin, setAdminPin, isPinRequired, setPinRequired } from '../lib/authHelper';
import toast from 'react-hot-toast';

const THEME_MODES = [
  { id: 'high-density', name: 'High Density (Data Engine)', desc: 'Tema dasbor data padat berkecepatan tinggi, latar gelap pekat, kontras tinggi dan aksen indigo.' },
  { id: 'glass', name: 'Glassmorphism', desc: 'Bawaan elegan dengan efek kaca buram dan sudut membulat.' },
  { id: 'neumorphism', name: 'Neumorphism', desc: 'Desain 3D lembut seperti karet dengan bayangan terang-gelap.' },
  { id: 'claymorphism', name: 'Claymorphism', desc: 'Tampilan 3D halus, tebal, dan bersahabat seperti tanah liat.' },
  { id: 'aurora', name: 'Aurora Glow', desc: 'Latar gradien bercahaya yang bergerak dinamis.' },
  { id: 'grid', name: 'Cyber Grid', desc: 'Estetika cetak biru teknis dengan sudut tajam.' },
  { id: 'solid', name: 'Solid Minimalist', desc: 'Gelap pekat minim distraksi peningkat fokus.' },
  { id: 'light', name: 'Clean Light', desc: 'Versi terang, sangat jelas dan profesional.' },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', desc: 'Retro gelap, garis pindai & gaya hacker.' },
  { id: 'vaporwave', name: 'Vaporwave 80s', desc: 'Nostalgia warna senja retro pink 80an.' },
  { id: 'matrix', name: 'Matrix Terminal', desc: 'Layar kode murni dengan teks terminal.' },
  { id: 'dos', name: 'Retro DOS', desc: 'Estetika murni komputer lama dengan warna terminal monokrom.' },
  { id: 'brutalism', name: 'Neo Brutalism', desc: 'Kontras tinggi, bingkai tebal, dan bayangan blok pekat.' },
  { id: 'wireframe', name: 'Wireframe X', desc: 'Tampilan teknis tanpa latar dengan garis putus-putus.' },
  { id: 'space', name: 'Deep Space', desc: 'Nuansa angkasa luar gelap void radial.' },
  { id: 'obsidian', name: 'Dark Obsidian', desc: 'Hitam mengkilap layaknya batu kaca vulkanik.' },
  { id: 'ocean', name: 'Abyss Ocean', desc: 'Desain laut dalam yang sangat mulus membulat.' },
  { id: 'hologram', name: 'Hologram Tech', desc: 'Warna prismatik iridesen cerah futuristik.' },
  { id: 'sunset', name: 'Sunset Retro', desc: 'Warna lembayung senja yang ikonik gradasi.' },
  { id: 'neon-city', name: 'Neon City', desc: 'Gelap dengan pendaran cahaya neon disetiap sisinya.' },
  { id: 'comic', name: 'Comic Pop-Art', desc: 'Coretan komik retro dengan tekstur titik matriks.' },
  { id: 'frost', name: 'Winter Frost', desc: 'Putih kebiruan dingin seperti kaca berlapis es.' },
  { id: 'paper', name: 'Parchment', desc: 'Terasa seperti dokumen kertas atau perkamen koran tua.' },
  { id: 'win95', name: 'Nostalgia Win95', desc: 'Antarmuka abu-abu dengan kotak border 3D timbul jadul.' },
  { id: 'blueprint', name: 'Cyan Blueprint', desc: 'Latar biru arsitek dengan cetak biru garis putih tegas.' },
  { id: 'candy', name: 'Candy Jelly', desc: 'Cerah, manis, berkilauan penuh warna seperti permen jeli transparan.' },
  { id: 'chalkboard', name: 'Papan Tulis', desc: 'Hijau tekstur kapur gelap dengan font garis putih putus-putus.' },
  { id: 'honeycomb', name: 'Hexa Cyber', desc: 'Latar sarang lebah heksagonal dengan sudut UI terpotong melintang.' },
  { id: 'e-ink', name: 'E-Reader Kindle', desc: 'Sangat datar, hitam di atas warna tulang, tanpa bayangan apapun.' },
  { id: 'luxury', name: 'Royal Elegance', desc: 'Sorotan gradasi sangat gelap mendalam yang elegan diiringi sinar aksen.' },
  { id: 'terminal-crt', name: 'Terminal CRT', desc: 'Glow intens di atas layar phosphor lengkung dengan efek scanline tebal.' },
  { id: 'notebook', name: 'Buku Catatan', desc: 'Kertas putih dengan garis biru merah khas buku tulis sekolah.' },
  { id: 'manga', name: 'Manga Halftone', desc: 'Dot-matrix Jepang, hitam tebal dengan pop blok terang komik.' },
  { id: 'wood', name: 'Woodcraft', desc: 'Tekstur kayu jati gelap dengan pahatan elemen yang direlief.' },
  { id: 'steampunk', name: 'Steampunk Origin', desc: 'Mesin jadul dengan bingkai kuningan dan tembaga industrial.' },
  { id: 'zen', name: 'Zen Minimalist', desc: 'Ketenangan absolut, warna krem, tanpa garis keras dan bayangan.' },
  { id: 'arcade', name: 'Arcade 8-bit', desc: 'Konsol game retro mesin ding-dong dengan bingkai tajam 8-bit.' },
  { id: 'gothic', name: 'Vampire Gothic', desc: 'Tema gelap fantasi merah darah dan hitam pekat nan elegan.' },
  { id: 'vcr', name: 'Kaset VCR', desc: 'Layar biru televisi analog jadul, tulisan putih tebal tanpa tab menu pinggiran.' },
  { id: 'fluent', name: 'Fluent OS', desc: 'Gaya modern ultra-blur bening menyerupai desain layar sistem terbaru.' },
  { id: 'glitch', name: 'Cyber Glitch', desc: 'Visual retak dengan pinggiran distorsi kromatik RGB yang disengaja.' },
  { id: 'watercolor', name: 'Cat Air (Aquarelle)', desc: 'Cucian cat air pudar dengan bentuk wadah yang organik asimetris tak rata.' },
  { id: 'dune', name: 'Desert Mirage', desc: 'Warna gurun pasir hangat eksotis dengan lekukan debu angin sahara.' },
  { id: 'macos9', name: 'Classic Mac OS', desc: 'Antarmuka abu-abu dengan pinstripes khas sistem operasi komputer era 99-an.' },
  { id: 'origami', name: 'Origami Folds', desc: 'Lipatan keras geometris asimetris di atas batas latar krem kertas.' },
  { id: 'velvet', name: 'Royal Velvet', desc: 'Kesan artistik teater beludru merah-gelap dengan pendar bayangan yang mendalam.' },
  { id: 'stained-glass', name: 'Stained Glass', desc: 'Efek kaca patri gereja warna-warni religius dengan kusen timah hitam.' },
  { id: 'military', name: 'Tactical Camo', desc: 'Hijau zaitun taktis dengan box pelindung keras penahan guncangan.' },
  { id: 'outrun', name: 'Synthwave Outrun', desc: 'Jalanan retro 80-an grid fiksi dengan neon kuat yang menembus kegelapan.' },
  { id: 'frutiger', name: 'Frutiger Aero', desc: 'Zaman web awal 2000-an! Kilauan basah bening, bundar & sangat segar.' },
  { id: 'gold-marble', name: 'Golden Marble', desc: 'Tekstur ukiran urat batu marmer putih diikat tegak oleh bingkai emas mewah mulia.' },
  { id: 'brushed-metal', name: 'Brushed Metal', desc: 'Plat aluminium perak yang disikat simetris ciri khas pemutar musik awal 2000an.' },
  { id: 'phantom', name: 'Phantom Ghost', desc: 'Transparansi absolut. Serba samar tak terlihat tersisa buram kaca tembus pandang.' },
  { id: 'holo-foil', name: 'Holographic Foil', desc: 'Efek pantulan cahaya pelangi ala kartu koleksi foil berkilau hologram.' },
  { id: 'toxic', name: 'Toxic Mutant', desc: 'Cahaya hijau radioaktif beracun menyala garang di atas dasar hitam legam.' },
  { id: 'denim', name: 'Denim Jeans', desc: 'Tekstur jins biru pekat kasual yang dijahit benang emas kontras di tepian.' },
  { id: 'pixel', name: '8-Bit Pixel Art', desc: 'Bentuk kotak tegas tanpa anti-aliasing layaknya mesin NES kuno dengan warna biru muda.' },
  { id: 'leather', name: 'Leather Bound', desc: 'Nuansa coklat hangat berdimensi kulit dompet klasik bergaya vintage.' },
  { id: 'construct', name: 'White Construct', desc: 'Kehampaan serba putih ekstrem layaknya ruang pemuatan program simulasi simulasi fiksi.' },
  { id: 'y2k', name: 'Y2K Tech', desc: 'Gaya gelembung biru muda dengan bingkai bulat ekstrem ciri kultur desain Y2K bubble/blob.' },
  { id: 'gummy', name: 'Gummy Bear', desc: 'Kenyal, bundar, lembut transparan. Merah muda magenta seperti permen jeli stroberi manis.' },
  { id: 'casino', name: 'Casino Royale', desc: 'Latar karpet felt hijau elit kasino berpadu keping merah & bingkai emas mewah mulia.' },
  { id: 'solar', name: 'Solar Flare', desc: 'Terbakar panas oranye berapi hingga menembus panel. Cahaya matahari bergradasi kegelapan antariksa.' }
];

const COLOR_PALETTES = [
  {
    group: 'High Density & Sci-Fi',
    colors: [
      { name: 'Indigo Engine', rgb: '99, 102, 241', hex: '#818cf8' },
      { name: 'Neon Tron', rgb: '6, 182, 212', hex: '#22d3ee' },
      { name: 'Acid Green', rgb: '132, 204, 22', hex: '#a3e635' },
      { name: 'Hot Pink', rgb: '236, 72, 153', hex: '#ec4899' },
      { name: 'Electric Purple', rgb: '168, 85, 247', hex: '#c084fc' },
      { name: 'Laser Red', rgb: '239, 68, 68', hex: '#f87171' },
      { name: 'Hyper Yellow', rgb: '254, 240, 138', hex: '#fef08a' }
    ]
  },
  {
    group: 'Jewels & Elements',
    colors: [
      { name: 'Sky Blue', rgb: '14, 165, 233', hex: '#38bdf8' },
      { name: 'Emerald', rgb: '16, 185, 129', hex: '#34d399' },
      { name: 'Gold Amber', rgb: '245, 158, 11', hex: '#fbbf24' },
      { name: 'Ruby Rose', rgb: '244, 63, 94', hex: '#fb7185' },
      { name: 'Deep Teal', rgb: '20, 184, 166', hex: '#2dd4bf' },
      { name: 'Amethyst', rgb: '139, 92, 246', hex: '#a78bfa' }
    ]
  },
  {
    group: 'Dark & Monochromatic',
    colors: [
      { name: 'Silver Steel', rgb: '148, 163, 184', hex: '#94a3b8' },
      { name: 'Slate Gray', rgb: '100, 116, 139', hex: '#64748b' },
      { name: 'Dark Zinc', rgb: '82, 82, 91', hex: '#52525b' },
      { name: 'Stone Brown', rgb: '120, 113, 108', hex: '#78716c' },
      { name: 'Pure White', rgb: '255, 255, 255', hex: '#ffffff' },
      { name: 'Crimson Blood', rgb: '153, 27, 27', hex: '#991b1b' }
    ]
  },
  {
    group: 'Pastel & Elegant',
    colors: [
      { name: 'Lavender', rgb: '167, 139, 250', hex: '#c4b5fd' },
      { name: 'Mint', rgb: '110, 231, 183', hex: '#6ee7b7' },
      { name: 'Peach', rgb: '251, 146, 60', hex: '#fdba74' },
      { name: 'Soft Sky', rgb: '125, 211, 252', hex: '#bae6fd' },
      { name: 'Blush Pink', rgb: '244, 114, 182', hex: '#fbcfe8' },
      { name: 'Lemon', rgb: '253, 224, 71', hex: '#fef08a' }
    ]
  }
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [appName, setAppName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolKop, setSchoolKop] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schoolContact, setSchoolContact] = useState('');
  const [headmaster, setHeadmaster] = useState('');
  const [headmasterNip, setHeadmasterNip] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminNip, setAdminNip] = useState('');
  const [leftLogo, setLeftLogo] = useState<string>(DEFAULT_LEFT_LOGO);
  const [rightLogo, setRightLogo] = useState<string>(DEFAULT_RIGHT_LOGO);
  const [showKopLogos, setShowKopLogos] = useState<boolean>(true);
  const leftLogoInputRef = useRef<HTMLInputElement>(null);
  const rightLogoInputRef = useRef<HTMLInputElement>(null);

  // Notification State
  const [notifyInbox, setNotifyInbox] = useState(true);
  const [notifySystem, setNotifySystem] = useState(true);

  // Security State
  const [requirePin, setRequirePin] = useState(true);
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [isTestingPinModalOpen, setIsTestingPinModalOpen] = useState(false);

  // Theme State
  const [themeColorRgb, setThemeColorRgb] = useState('14, 165, 233');
  const [themeColorHex, setThemeColorHex] = useState('#38bdf8');
  const [themeStyle, setThemeStyle] = useState('glass');

  // Account State
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');

  // Google Drive State
  const [driveFolderInput, setDriveFolderInput] = useState('https://drive.google.com/drive/folders/1AlFa3R5LFPBHhCjRKcohK9PrvT3mtCgy?hl=ID');
  const [driveFolderId, setDriveFolderId] = useState('1AlFa3R5LFPBHhCjRKcohK9PrvT3mtCgy');
  const [driveAutoSync, setDriveAutoSync] = useState(true);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveUser, setDriveUser] = useState<any>(null);
  const [isAuthenticatingDrive, setIsAuthenticatingDrive] = useState(false);
  const [isTestingDriveAccess, setIsTestingDriveAccess] = useState(false);
  const [driveTestStatus, setDriveTestStatus] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });
  const [isDriveSyncModalOpen, setIsDriveSyncModalOpen] = useState(false);

  // UI State
  const [isSaved, setIsSaved] = useState(false);
  const [resolution, setResolution] = useState('1280x800');
  const [uiScale, setUiScale] = useState('1');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { confirm } = useConfirm();

  useEffect(() => {
    // Load settings from localStorage
    setAppName(localStorage.getItem('appName') || 'SPEGA MAIL');
    setSchoolName(localStorage.getItem('schoolName') || 'SMP NEGERI 3 KRAS');
    setSchoolKop(localStorage.getItem('schoolKop') || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN');
    setSchoolAddress(localStorage.getItem('schoolAddress') || 'Jalan Raya Jabang Kras, Kediri, Jawa Timur');
    setSchoolContact(localStorage.getItem('schoolContact') || 'Telp: (0354) XXXXXX | Email: smpn3kras@example.com');
    setHeadmaster(localStorage.getItem('headmaster') || 'Dr. Budi Santoso, M.Pd');
    setHeadmasterNip(localStorage.getItem('headmasterNip') || '19800101 200501 1 001');
    setAdminName(localStorage.getItem('adminName') || 'Rahmawati, S.Kom');
    setAdminNip(localStorage.getItem('adminNip') || '19900202 201502 2 002');
    
    // Logos
    const savedLeftLogo = localStorage.getItem('leftLogo') || localStorage.getItem('schoolLogoLeft') || localStorage.getItem('schoolLogo') || DEFAULT_LEFT_LOGO;
    const savedRightLogo = localStorage.getItem('rightLogo') || localStorage.getItem('schoolLogoRight') || DEFAULT_RIGHT_LOGO;
    const savedShowLogos = localStorage.getItem('showKopLogos') !== 'false';
    setLeftLogo(savedLeftLogo);
    setRightLogo(savedRightLogo);
    setShowKopLogos(savedShowLogos);
    
    setNotifyInbox(localStorage.getItem('notifyInbox') !== 'false');
    setNotifySystem(localStorage.getItem('notifySystem') !== 'false');
    
    setRequirePin(isPinRequired());
    setPin(getAdminPin());

    setAdminUsername(localStorage.getItem('adminUsername') || 'admin');
    setAdminPassword('');

    setThemeColorRgb(localStorage.getItem('themeColorRgb') || '14, 165, 233');
    setThemeColorHex(localStorage.getItem('themeColorHex') || '#38bdf8');
    setThemeStyle(localStorage.getItem('themeStyle') || 'glass');
    
    setResolution(localStorage.getItem('appResolution') || '1280x800');
    setUiScale(localStorage.getItem('uiScale') || '1');

    // Google Drive
    const savedFolderUrl = localStorage.getItem('googleDriveFolderUrl') || 'https://drive.google.com/drive/folders/1AlFa3R5LFPBHhCjRKcohK9PrvT3mtCgy?hl=ID';
    const savedFolderId = localStorage.getItem('googleDriveFolderId') || '1AlFa3R5LFPBHhCjRKcohK9PrvT3mtCgy';
    setDriveFolderInput(savedFolderUrl);
    setDriveFolderId(savedFolderId);
    setDriveAutoSync(localStorage.getItem('googleDriveAutoSync') !== 'false');

    getGoogleAccessToken().then(tok => {
      setDriveToken(tok);
      setDriveUser(getGoogleUser());
    });
  }, []);

  const handleDriveFolderInputChange = (val: string) => {
    setDriveFolderInput(val);
    const extracted = extractFolderId(val);
    setDriveFolderId(extracted);
    setDriveTestStatus({ status: 'idle', message: '' });
  };

  const handleSaveDriveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = extractFolderId(driveFolderInput);
    localStorage.setItem('googleDriveFolderUrl', driveFolderInput);
    localStorage.setItem('googleDriveFolderId', cleanId);
    localStorage.setItem('googleDriveAutoSync', String(driveAutoSync));
    setDriveFolderId(cleanId);
    window.dispatchEvent(new Event('googleDriveConfigChanged'));
    showSavedMessage();
    toast.success('Pengaturan Google Drive berhasil disimpan');
  };

  const handleConnectGoogleDrive = async () => {
    setIsAuthenticatingDrive(true);
    setDriveTestStatus({ status: 'idle', message: '' });
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        setDriveToken(res.accessToken);
        setDriveUser(res.user);
        toast.success(`Terhubung sebagai ${res.user.displayName || res.user.email}`);
      } else {
        // User closed the popup window
        toast('Login Google dibatalkan atau jendela ditutup', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghubungkan Google Drive');
    } finally {
      setIsAuthenticatingDrive(false);
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    const isConfirmed = await confirm({
      title: 'Putuskan Akun Google Drive',
      message: 'Apakah Anda ingin memutuskan koneksi akun Google Drive dari aplikasi?',
      confirmLabel: 'Putuskan',
      variant: 'warning'
    });
    if (isConfirmed) {
      await signOutGoogleDrive();
      setDriveToken(null);
      setDriveUser(null);
      setDriveTestStatus({ status: 'idle', message: '' });
      toast.success('Koneksi Google Drive diputuskan');
    }
  };

  const handleTestDriveAccess = async () => {
    if (!driveToken) {
      toast.error('Silakan hubungkan akun Google terlebih dahulu');
      await handleConnectGoogleDrive();
      return;
    }

    setIsTestingDriveAccess(true);
    setDriveTestStatus({ status: 'idle', message: '' });

    try {
      const idToTest = extractFolderId(driveFolderInput);
      const res = await verifyFolderAccess(idToTest, driveToken);
      if (res.success) {
        setDriveTestStatus({
          status: 'success',
          message: `Akses berhasil! Folder: "${res.name || 'Folder Ditemukan'}" siap digunakan.`
        });
        toast.success('Akses folder Google Drive valid & siap digunakan');
      } else {
        setDriveTestStatus({
          status: 'error',
          message: res.error || 'Gagal mengakses folder Google Drive'
        });
        toast.error('Gagal mengakses folder');
      }
    } catch (err: any) {
      setDriveTestStatus({
        status: 'error',
        message: err.message || 'Terjadi kesalahan uji koneksi'
      });
      toast.error('Uji koneksi gagal');
    } finally {
      setIsTestingDriveAccess(false);
    }
  };

  const showSavedMessage = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    alert('Pengaturan berhasil disimpan!');
  };

  const applyThemeClasses = (rgb: string, hex: string, style: string) => {
    document.body.className = '';
    if (style !== 'glass') document.body.classList.add(`theme-${style}`);
    document.documentElement.style.setProperty('--accent-rgb', rgb);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${rgb}, 0.5)`);
    document.documentElement.style.setProperty('--accent-text', hex);
  };

  const applyResolution = (res: string) => {
    const isElectron = navigator.userAgent.toLowerCase().includes('electron') || (typeof window !== 'undefined' && 'require' in window);
    
    let ipcRenderer = null;
    if (isElectron) {
      try {
        // @ts-ignore
        ipcRenderer = window.require('electron').ipcRenderer;
        
        if (res === 'fullscreen') {
          ipcRenderer.send('set-fullscreen', true);
        } else {
          const [width, height] = res.split('x').map(Number);
          ipcRenderer.send('resize-window', width, height);
        }
      } catch (e) {
        console.error('IPC Renderer Error:', e);
      }
    } else {
      // Fallback for Web Browser
      if (res === 'fullscreen') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.error(`Error attempting to exit fullscreen: ${err.message}`);
          });
        }
        // Browsers usually block window.resizeTo, but it might work for popups
        const [w, h] = res.split('x').map(Number);
        try {
           window.resizeTo(w, h);
        } catch(e) {}
      }
    }
  };

  const applyScale = (scale: string) => {
    document.documentElement.style.fontSize = `${16 * Number(scale)}px`;
  };

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('themeColorRgb', themeColorRgb);
    localStorage.setItem('themeColorHex', themeColorHex);
    localStorage.setItem('themeStyle', themeStyle);
    localStorage.setItem('appResolution', resolution);
    localStorage.setItem('uiScale', uiScale);
    
    applyThemeClasses(themeColorRgb, themeColorHex, themeStyle);
    applyResolution(resolution);
    applyScale(uiScale);
    
    showSavedMessage();
  };

  const handleUploadLeftLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Harap pilih file gambar (PNG, JPG, SVG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLeftLogo(result);
      localStorage.setItem('leftLogo', result);
      toast.success('Logo Sekolah (Kiri) berhasil diunggah');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadRightLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Harap pilih file gambar (PNG, JPG, SVG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setRightLogo(result);
      localStorage.setItem('rightLogo', result);
      toast.success('Logo Dinas (Kanan) berhasil diunggah');
    };
    reader.readAsDataURL(file);
  };

  const handleResetLeftLogo = () => {
    setLeftLogo(DEFAULT_LEFT_LOGO);
    localStorage.setItem('leftLogo', DEFAULT_LEFT_LOGO);
    toast.success('Logo Sekolah dikembalikan ke Preset Tut Wuri Handayani');
  };

  const handleResetRightLogo = () => {
    setRightLogo(DEFAULT_RIGHT_LOGO);
    localStorage.setItem('rightLogo', DEFAULT_RIGHT_LOGO);
    toast.success('Logo Dinas dikembalikan ke Preset Lambang Dinas Pendidikan');
  };

  const handleRemoveLeftLogo = () => {
    setLeftLogo('');
    localStorage.removeItem('leftLogo');
    toast('Logo Sekolah dinonaktifkan', { icon: '🗑️' });
  };

  const handleRemoveRightLogo = () => {
    setRightLogo('');
    localStorage.removeItem('rightLogo');
    toast('Logo Dinas dinonaktifkan', { icon: '🗑️' });
  };

  // ... rest of the original code methods ...
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('schoolName', schoolName);
    localStorage.setItem('schoolKop', schoolKop);
    localStorage.setItem('schoolAddress', schoolAddress);
    localStorage.setItem('schoolContact', schoolContact);
    localStorage.setItem('headmaster', headmaster);
    localStorage.setItem('headmasterNip', headmasterNip);
    localStorage.setItem('adminName', adminName);
    localStorage.setItem('adminNip', adminNip);
    localStorage.setItem('appName', appName);
    localStorage.setItem('leftLogo', leftLogo);
    localStorage.setItem('rightLogo', rightLogo);
    localStorage.setItem('showKopLogos', String(showKopLogos));
    window.dispatchEvent(new Event('storage'));
    showSavedMessage();
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('notifyInbox', String(notifyInbox));
    localStorage.setItem('notifySystem', String(notifySystem));
    showSavedMessage();
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setPinRequired(requirePin);
    const finalPin = pin && pin.trim() ? pin.trim() : '1234';
    setAdminPin(finalPin);
    setPin(finalPin);
    
    localStorage.setItem('adminUsername', adminUsername);
    if (adminPassword && adminPassword.trim() !== '') {
      localStorage.setItem('adminPassword', adminPassword);
      setAdminPassword(''); // reset input after saving
    }
    toast.success('Pengaturan Keamanan & PIN Admin berhasil disimpan!');
    showSavedMessage();
  };

  // Data Management Functions
  const exportData = async () => {
    try {
      const data = {
        teachers: await db.teachers.toArray(),
        students: await db.students.toArray(),
        letters: await db.letters.toArray(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-nusamail-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Gagal mengekspor data.');
    }
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.teachers || data.students || data.letters) {
          const isConfirmed = await confirm({
            title: 'Pulihkan Data Backup',
            message: 'Apakah Anda ingin menimpa data yang ada dengan data dari file backup ini? Ini akan menimpa semua data saat ini.',
            confirmLabel: 'Pulihkan Data',
            variant: 'warning'
          });
          
          if(isConfirmed) {
            await db.transaction('rw', db.teachers, db.students, db.letters, async () => {
              await db.teachers.clear();
              await db.students.clear();
              await db.letters.clear();
              
              if (data.teachers?.length) await db.teachers.bulkAdd(data.teachers);
              if (data.students?.length) await db.students.bulkAdd(data.students);
              if (data.letters?.length) await db.letters.bulkAdd(data.letters);
            });
            alert('Data berhasil dipulihkan!');
            window.location.reload();
          }
        } else {
          alert('Format file tidak valid. Pastikan ini adalah file backup SPEGA MAIL.');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal mengimpor data. File rusak atau format tidak sesuai.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const resetData = async () => {
    const confirmHard = await confirm({
      title: 'Hapus Semua Data',
      message: 'PERINGATAN: Semua data surat, guru, dan siswa akan dihapus secara permanen. Tindakan ini benar-benar tidak bisa dibatalkan. Lanjutkan penghapusan?',
      confirmLabel: 'Reset Permanen',
      variant: 'danger'
    });
    
    if (confirmHard) {
      try {
        await db.transaction('rw', db.teachers, db.students, db.letters, async () => {
          await db.teachers.clear();
          await db.students.clear();
          await db.letters.clear();
        });
        alert('Semua data berhasil dihapus.');
        window.location.reload();
      } catch (error) {
        console.error('Reset failed:', error);
        alert('Gagal mereset data.');
      }
    }
  };

  const tabs = [
    { id: 'profile', icon: Building, label: 'Profil Sekolah' },
    { id: 'googledrive', icon: Cloud, label: 'Google Drive & Cloud' },
    { id: 'theme', icon: Palette, label: 'Tampilan & Tema' },
    { id: 'notifications', icon: Bell, label: 'Notifikasi' },
    { id: 'security', icon: ShieldCheck, label: 'Keamanan & Akses' },
    { id: 'data', icon: Database, label: 'Manajemen Data' },
  ];

  const SavedMessage = () => (
    <motion.span 
      initial={{ opacity: 0, x: -10 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="text-sm text-emerald-400 font-medium flex items-center gap-1.5"
    >
      <CheckCircle2 className="w-4 h-4" />
      Berhasil disimpan
    </motion.span>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">Pengaturan</h2>
        <p className="text-slate-400">Konfigurasi sistem, profil sekolah, dan manajemen data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Navigation */}
        <div className="space-y-2 lg:col-span-1">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
                activeTab === tab.id 
                  ? "nav-active" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          ))}

          {/* Buku Panduan PDF Card */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <FileDown className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Buku Panduan PDF</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Dokumen resmi petunjuk teknis operasional aplikasi menyeluruh untuk Admin TU, Guru, dan Wali Murid.
              </p>
              <button
                type="button"
                onClick={generateFullUserManualPdf}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-900/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Panduan (PDF)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            
            {/* TAB: PROFIL SEKOLAH */}
            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6"
              >
                <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                  <Building className="w-5 h-5 text-sky-400" />
                  Informasi Sekolah
                </h3>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  
                  {/* Bagian Branding Aplikasi */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4 animate-fade-in">
                    <h4 className="text-sm font-semibold text-sky-400 mb-2 uppercase tracking-wide">Pengaturan Branding Aplikasi</h4>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400 uppercase">Nama Aplikasi (Tampil di Menu Utama & Halaman Masuk)</label>
                      <input 
                        type="text" 
                        value={appName} 
                        onChange={(e) => setAppName(e.target.value)} 
                        className="glass-input w-full font-bold" 
                        placeholder="Contoh: SPEGA MAIL" 
                        required 
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Ubah nama ini untuk menyesuaikan nama/merk aplikasi utama yang tampil di seluruh bilah navigasi dan login.</p>
                    </div>
                  </div>
                  
                  {/* Bagian Kop Sekolah & Pengaturan Dual Logo */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-sky-400 uppercase tracking-wide flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" /> Desain Kop Surat & Logo Resmi (Dual-Logo)
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Tata letak standar resmi: Logo Sekolah di sisi Kiri dan Logo Dinas di sisi Kanan</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={showKopLogos}
                          onChange={(e) => setShowKopLogos(e.target.checked)}
                          className="rounded border-slate-600 text-sky-500 focus:ring-sky-400 bg-slate-800"
                        />
                        <span className="text-xs font-medium text-slate-300">Tampilkan Logo di Kop</span>
                      </label>
                    </div>

                    {/* Logo Upload Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Logo Kiri: Sekolah */}
                      <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center p-1 overflow-hidden shrink-0">
                            {leftLogo ? (
                              <img src={leftLogo} alt="Logo Sekolah" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-[10px] text-slate-500 text-center">Tanpa Logo</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Logo Sekolah (Kiri)</h5>
                            <p className="text-[11px] text-slate-400 mt-0.5">Logo Tut Wuri Handayani / Lambang Khas SMPN 3 Kras</p>
                            <span className="inline-block text-[10px] text-sky-400 mt-1 font-mono">Format: PNG / SVG / JPG</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <input 
                            type="file" 
                            ref={leftLogoInputRef} 
                            onChange={handleUploadLeftLogo} 
                            accept="image/*" 
                            className="hidden" 
                          />
                          <button
                            type="button"
                            onClick={() => leftLogoInputRef.current?.click()}
                            className="flex-1 glass-button py-1.5 text-xs flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5 text-sky-400" /> Unggah File
                          </button>
                          <button
                            type="button"
                            onClick={handleResetLeftLogo}
                            title="Kembalikan ke Preset Tut Wuri Handayani"
                            className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-400" /> Preset
                          </button>
                          {leftLogo && (
                            <button
                              type="button"
                              onClick={handleRemoveLeftLogo}
                              title="Hapus Logo Kiri"
                              className="px-2 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 text-xs transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Logo Kanan: Dinas Pendidikan */}
                      <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center p-1 overflow-hidden shrink-0">
                            {rightLogo ? (
                              <img src={rightLogo} alt="Logo Dinas" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-[10px] text-slate-500 text-center">Tanpa Logo</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Logo Dinas / Pemda (Kanan)</h5>
                            <p className="text-[11px] text-slate-400 mt-0.5">Logo Resmi Dinas Pendidikan / Lambang Pemkab Kediri</p>
                            <span className="inline-block text-[10px] text-emerald-400 mt-1 font-mono">Format: PNG / SVG / JPG</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <input 
                            type="file" 
                            ref={rightLogoInputRef} 
                            onChange={handleUploadRightLogo} 
                            accept="image/*" 
                            className="hidden" 
                          />
                          <button
                            type="button"
                            onClick={() => rightLogoInputRef.current?.click()}
                            className="flex-1 glass-button py-1.5 text-xs flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-400" /> Unggah File
                          </button>
                          <button
                            type="button"
                            onClick={handleResetRightLogo}
                            title="Kembalikan ke Preset Dinas Pendidikan"
                            className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-400" /> Preset
                          </button>
                          {rightLogo && (
                            <button
                              type="button"
                              onClick={handleRemoveRightLogo}
                              title="Hapus Logo Kanan"
                              className="px-2 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 text-xs transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Text Fields Kop */}
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase">Instansi Induk (Kop Baris 1 & 2)</label>
                        <textarea rows={2} value={schoolKop} onChange={(e) => setSchoolKop(e.target.value)} className="glass-input w-full resize-none" placeholder="Cth: PEMERINTAH KABUPATEN KEDIRI&#10;DINAS PENDIDIKAN" required />
                        <p className="text-[10px] text-slate-500 mt-1">Gunakan Enter untuk baris baru (maksimal 2 baris).</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase">Nama Sekolah / Satuan Pendidikan (Dicetak Tebal)</label>
                        <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="glass-input w-full font-bold" placeholder="Cth: SMP NEGERI 3 KRAS" required />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 uppercase">Alamat Lengkap</label>
                          <input type="text" value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} className="glass-input w-full" placeholder="Jalan Raya Jabang Kras, Kediri, Jawa Timur" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 uppercase">Kontak (Telepon, Email, Website)</label>
                          <input type="text" value={schoolContact} onChange={(e) => setSchoolContact(e.target.value)} className="glass-input w-full" placeholder="Telp: (0354) XXXXXX | Email: smpn3kras@example.com" />
                        </div>
                      </div>
                    </div>

                    {/* Live Kop Preview */}
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                        <Eye className="w-3.5 h-3.5" /> Pratinjau Langsung Kop Surat (Live Letterhead Preview)
                      </div>
                      <div className="bg-white text-slate-900 rounded-xl p-5 shadow-lg border border-slate-300 select-none">
                        <div style={{ borderBottom: '3.5px double #000000', paddingBottom: '8px' }} className="flex items-center justify-between gap-4">
                          {showKopLogos && leftLogo ? (
                            <div className="w-16 h-16 flex items-center justify-center shrink-0">
                              <img src={leftLogo} alt="Logo Sekolah" className="max-h-16 max-w-16 object-contain" />
                            </div>
                          ) : (
                            <div className="w-4 shrink-0"></div>
                          )}

                          <div className="text-center flex-1 px-2 font-serif uppercase">
                            {schoolKop.split('\n').filter(Boolean).map((line, i) => (
                              <div key={i} className="text-xs font-bold leading-tight tracking-wide text-slate-900">{line}</div>
                            ))}
                            <div className="text-base font-extrabold tracking-wider text-black my-1 leading-tight">{schoolName || 'SMP NEGERI 3 KRAS'}</div>
                            <div className="text-[10.5px] font-sans font-normal normal-case text-slate-700 leading-snug">
                              {schoolAddress} {schoolContact ? `• ${schoolContact}` : ''}
                            </div>
                          </div>

                          {showKopLogos && rightLogo ? (
                            <div className="w-16 h-16 flex items-center justify-center shrink-0">
                              <img src={rightLogo} alt="Logo Dinas" className="max-h-16 max-w-16 object-contain" />
                            </div>
                          ) : (
                            <div className="w-4 shrink-0"></div>
                          )}
                        </div>
                        <p className="text-[10px] font-sans text-slate-500 text-center mt-2 italic">
                          Format di atas akan diterapkan pada seluruh Lembar Disposisi, Kartu Kendali, Buku Agenda, Daftar Pertelaan Arsip, dan Rekapitulasi Cetak.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Pejabat / Pengelola */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-sky-400 mb-2 uppercase tracking-wide">Data Pejabat & Administrasi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 uppercase">Nama Kepala Sekolah</label>
                          <input type="text" value={headmaster} onChange={(e) => setHeadmaster(e.target.value)} className="glass-input w-full" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 uppercase">NIP Kepala Sekolah</label>
                          <input type="text" value={headmasterNip} onChange={(e) => setHeadmasterNip(e.target.value)} className="glass-input w-full" placeholder="NIP/NRK/Kosongkan jika tidak ada" />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 uppercase">Nama Petugas Administrasi / Arsiparis</label>
                          <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} className="glass-input w-full" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 uppercase">NIP / ID Petugas</label>
                          <input type="text" value={adminNip} onChange={(e) => setAdminNip(e.target.value)} className="glass-input w-full" placeholder="NIP/NRK/Kosongkan jika tidak ada" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>{isSaved && <SavedMessage />}</div>
                    <button type="submit" className="glass-button flex items-center gap-2">
                      <Save className="w-4 h-4" /> Simpan Perubahan
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB: GOOGLE DRIVE & CLOUD */}
            {activeTab === 'googledrive' && (
              <motion.div 
                key="googledrive"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Panel 1: Akun & Koneksi */}
                <div className="glass-panel p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                        <Cloud className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-medium text-white">Integrasi Google Drive</h3>
                        <p className="text-xs text-slate-400">Simpan dan arsipkan surat otomatis ke Google Drive SMPN 3 Kras</p>
                      </div>
                    </div>

                    <a
                      href={getDriveFolderUrl(driveFolderId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button flex items-center justify-center gap-2 text-xs py-2 px-3 !bg-sky-500/10 hover:!bg-sky-500/20 !border-sky-500/30 text-sky-300 hover:text-white"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Folder Google Drive
                    </a>
                  </div>

                  {/* Status Koneksi Akun */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wide">Status Autentikasi Google</h4>
                    
                    {driveToken && driveUser ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-3">
                          {driveUser.photoURL ? (
                            <img src={driveUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-emerald-500/40" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                              {driveUser.email?.charAt(0).toUpperCase() || 'G'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{driveUser.displayName || 'Akun Google Sekolah'}</p>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <Check className="w-3 h-3" /> Terhubung
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">{driveUser.email}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleDisconnectGoogleDrive}
                          className="glass-button text-xs py-1.5 px-3 text-slate-400 hover:text-rose-300 hover:border-rose-500/40"
                        >
                          Putuskan Akun
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-white">Google Drive Belum Terhubung</p>
                          <p className="text-xs text-slate-400 mt-0.5">Masuk dengan akun Google yang memiliki hak akses ke folder drive sekolah.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleConnectGoogleDrive}
                          disabled={isAuthenticatingDrive}
                          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white text-slate-800 font-medium text-xs hover:bg-slate-100 transition shadow cursor-pointer disabled:opacity-50"
                        >
                          {isAuthenticatingDrive ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700" /> Menghubungkan...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                              </svg>
                              Sign in with Google
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pengaturan URL & ID Folder */}
                  <form onSubmit={handleSaveDriveSettings} className="space-y-4 mt-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                      <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wide">Tautan & Folder Penyimpanan Google Drive</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                            Tautan / Alamat URL Folder Google Drive
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const defaultUrl = 'https://drive.google.com/drive/folders/1AlFa3R5LFPBHhCjRKcohK9PrvT3mtCgy?hl=ID';
                                handleDriveFolderInputChange(defaultUrl);
                                toast.success('Menggunakan folder default SMPN 3 Kras');
                              }}
                              className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Reset ke Default
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={driveFolderInput}
                            onChange={(e) => handleDriveFolderInputChange(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/1AlFa3R5LFPBHhCjRKcohK9PrvT3mtCgy?hl=ID"
                            className="glass-input w-full font-mono text-xs pr-10"
                            required
                          />
                          {driveFolderInput && (
                            <a
                              href={driveFolderInput.startsWith('http') ? driveFolderInput : `https://drive.google.com/drive/folders/${driveFolderInput}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-sky-400 hover:bg-white/10 rounded transition-colors"
                              title="Buka folder di tab baru"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Anda dapat mengganti alamat penyimpanan kapan saja dengan menempelkan link folder Google Drive baru Anda di atas, lalu klik <strong>Simpan Pengaturan Drive</strong>.
                        </p>
                      </div>

                      {/* Panduan Cara Mengganti Folder */}
                      <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-xs space-y-1.5">
                        <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                          💡 Cara Mengganti Lokasi Folder Penyimpanan Google Drive:
                        </span>
                        <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                          <li>Buka Google Drive Anda di browser dan buat/pilih folder yang diinginkan.</li>
                          <li>Klik kanan pada folder tersebut &gt; pilih <strong>Bagikan (Share)</strong> &gt; <strong>Salin tautan (Copy link)</strong>.</li>
                          <li>Tempelkan tautan tersebut ke kolom input di atas.</li>
                          <li>Klik tombol <strong>Uji Akses Folder</strong> untuk memastikan akun Anda memiliki izin akses.</li>
                          <li>Klik <strong>Simpan Pengaturan Drive</strong> di bawah untuk menerapkan perubahan.</li>
                        </ol>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                        <div className="flex items-center gap-2 text-xs">
                          <FolderTree className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="text-slate-400">ID Folder Terdeteksi:</span>
                          <code className="text-sky-300 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {driveFolderId || DEFAULT_DRIVE_FOLDER_ID}
                          </code>
                        </div>

                        <button
                          type="button"
                          onClick={handleTestDriveAccess}
                          disabled={isTestingDriveAccess}
                          className="glass-button text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 text-slate-300 hover:text-white"
                        >
                          {isTestingDriveAccess ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menguji Akses...
                            </>
                          ) : (
                            <>
                              <FolderCheck className="w-3.5 h-3.5 text-sky-400" /> Uji Akses Folder
                            </>
                          )}
                        </button>
                      </div>

                      {/* Test Result Message */}
                      {driveTestStatus.status !== 'idle' && (
                        <div className={cn(
                          "p-3 rounded-lg border text-xs flex items-start gap-2.5",
                          driveTestStatus.status === 'success' 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        )}>
                          {driveTestStatus.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                          )}
                          <span>{driveTestStatus.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Auto Sync Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <h4 className="text-sm font-medium text-white">Sinkronisasi Otomatis Surat Baru</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Otomatis unggah berkas surat ke Google Drive setiap kali surat baru dibuat atau dicatat
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={driveAutoSync}
                          onChange={(e) => setDriveAutoSync(e.target.checked)}
                        />
                        <div 
                          className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"
                          style={{ backgroundColor: driveAutoSync ? 'var(--accent-text)' : undefined }}
                        ></div>
                      </label>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div>{isSaved && <SavedMessage />}</div>
                      <button type="submit" className="glass-button flex items-center gap-2">
                        <Save className="w-4 h-4" /> Simpan Pengaturan Drive
                      </button>
                    </div>
                  </form>
                </div>

                {/* Panel 2: Aturan Struktur Folder & Penamaan Berkas */}
                <div className="glass-panel p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-sky-400" />
                      Struktur Subfolder Berdasarkan Jenis Surat
                    </h3>
                    <p className="text-xs text-slate-400">
                      Dokumen akan dikelompokkan secara otomatis ke dalam subfolder khusus di dalam Google Drive:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        📁 Surat Masuk
                      </span>
                      <p className="text-[11px] text-slate-400">Surat dinas masuk, disposisi kepala sekolah, dan tanda terima.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                        📁 Surat Keluar
                      </span>
                      <p className="text-[11px] text-slate-400">Surat keluar umum, permohonan, dan edaran sekolah.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                        📁 Surat Keputusan (SK)
                      </span>
                      <p className="text-[11px] text-slate-400">SK Kepala Sekolah, pembagian tugas guru & staf, panitia.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                        📁 Surat Tugas
                      </span>
                      <p className="text-[11px] text-slate-400">Surat penugasan pembina, diklat, dan lomba OSN/O2SN.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-xs font-semibold text-pink-400 flex items-center gap-1.5">
                        📁 Undangan Resmi
                      </span>
                      <p className="text-[11px] text-slate-400">Undangan rapat pleno komite, dinas, dan wali murid.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                        📁 Backup Database Sistem
                      </span>
                      <p className="text-[11px] text-slate-400">Cadangan basis data JSON terstruktur lengkap beserta cap tanggal.</p>
                    </div>
                  </div>

                  {/* Penamaan File Berformat Tanggal */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wide">
                        Aturan Penamaan Berkas (Berisi Tanggal)
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">Format Baku</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/50 border border-slate-800 font-mono text-xs text-sky-300">
                      YYYY-MM-DD_[JenisSurat]_[NomorSurat]_[PerihalRingkas].pdf
                    </div>

                    <div className="space-y-1 text-xs text-slate-400">
                      <p className="text-[11px] text-slate-300 font-medium">Contoh Berkas yang Dihasilkan:</p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] font-mono text-slate-400">
                        <li>2026-08-10_Surat-Masuk_421.3-1208-418.20-2026_Undangan-Koordinasi-ANBK.pdf</li>
                        <li>2026-08-15_Surat-Keluar_421.2-085-SMPN3-VIII-2026_Undangan-Rapat-Pleno-Komite.pdf</li>
                        <li>2026-08-17_Surat-Tugas_094-086-SMPN3-VIII-2026_Surat-Tugas-Pembina-OSN.pdf</li>
                      </ul>
                    </div>
                  </div>

                  {/* Sync All Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-400">
                      Ingin mencadangkan seluruh arsip surat dan database ke Google Drive sekaligus?
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsDriveSyncModalOpen(true)}
                      className="glass-button flex items-center justify-center gap-2 !bg-sky-600 hover:!bg-sky-500 text-white text-xs py-2 px-4 w-full sm:w-auto"
                    >
                      <Sparkles className="w-4 h-4" /> Cadangkan Semua Data ke Google Drive
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: TEma & TAMPILAN */}
            {activeTab === 'theme' && (
              <motion.div 
                key="theme"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6"
              >
                <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                  <Palette className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
                  Tampilan & Tema
                </h3>
                <form onSubmit={handleSaveTheme} className="space-y-6">
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-white mb-4">Aksen Warna (100+ Kombinasi Tema)</h4>
                      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {COLOR_PALETTES.map((palette, idx) => (
                          <div key={idx} className="space-y-3">
                            <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{palette.group}</h5>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {palette.colors.map(color => (
                                <button
                                  key={color.name}
                                  type="button"
                                  onClick={() => {
                                    setThemeColorRgb(color.rgb);
                                    setThemeColorHex(color.hex);
                                  }}
                                  className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all text-center",
                                    themeColorHex === color.hex 
                                      ? "bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]"
                                      : "bg-black/20 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                                  )}
                                >
                                  <div className="w-5 h-5 rounded-full ring-2 ring-black/40" style={{ backgroundColor: color.hex, boxShadow: `0 0 12px rgba(${color.rgb}, 0.6)` }}></div>
                                  <span className="text-[10px] font-medium leading-tight">{color.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-8 border-t border-white/5 pt-8">
                    <label className="text-sm font-medium text-white">Resolusi Layar Jendela Aplikasi / Resolusi Windows</label>
                    <select 
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="glass-input w-full max-w-sm"
                    >
                      <option className="text-black" value="1024x768">1024 x 768 (Kecil)</option>
                      <option className="text-black" value="1280x720">1280 x 720 (HD)</option>
                      <option className="text-black" value="1280x800">1280 x 800 (Standar WXGA)</option>
                      <option className="text-black" value="1366x768">1366 x 768 (Laptop)</option>
                      <option className="text-black" value="1600x900">1600 x 900 (HD+)</option>
                      <option className="text-black" value="1920x1080">1920 x 1080 (Layar Lebar Full HD)</option>
                      <option className="text-black" value="fullscreen">Layar Penuh (Fullscreen)</option>
                    </select>
                    <p className="text-xs text-slate-400 leading-relaxed">Pengaturan resolusi jendela aplikasi akan segera diterapkan setelah disimpan.</p>
                  </div>

                  <div className="space-y-4 mt-8 border-t border-white/5 pt-8">
                    <label className="text-sm font-medium text-white">Ukuran Elemen & Teks Aplikasi (Skala UI)</label>
                    <select 
                      value={uiScale}
                      onChange={(e) => setUiScale(e.target.value)}
                      className="glass-input w-full max-w-sm"
                    >
                      <option className="text-black" value="0.75">Sangat Kecil (75%)</option>
                      <option className="text-black" value="0.875">Kecil (87.5%)</option>
                      <option className="text-black" value="1">Normal (100%)</option>
                      <option className="text-black" value="1.125">Besar (112.5%)</option>
                      <option className="text-black" value="1.25">Sangat Besar (125%)</option>
                    </select>
                    <p className="text-xs text-slate-400 leading-relaxed">Pilih ukuran pembesaran/pengecilan seluruh antarmuka aplikasi.</p>
                  </div>

                  <div className="space-y-4 mt-8 border-t border-white/5 pt-8">
                    <label className="text-sm font-medium text-white">Konsep Tampilan Fisik (Struktur Mode)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {THEME_MODES.map(style => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setThemeStyle(style.id)}
                          className={cn(
                            "text-left p-4 rounded-xl border transition-all h-full flex flex-col group",
                            themeStyle === style.id 
                              ? "nav-active border-transparent shadow-[inset_0_0_0_1px_var(--accent-text)]"
                              : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/5"
                          )}
                        >
                          <h4 className="font-medium text-white mb-1 group-hover:text-[var(--accent-text)] transition-colors">{style.name}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed mt-auto">{style.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <div>{isSaved && <SavedMessage />}</div>
                    <button type="submit" className="glass-button flex items-center gap-2">
                      <Save className="w-4 h-4" /> Terapkan & Simpan
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB: NOTIFIKASI */}
            {activeTab === 'notifications' && (
              <motion.div 
                key="notifications"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6"
              >
                <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-sky-400" style={{ color: 'var(--accent-text)' }} />
                  Pengaturan Notifikasi
                </h3>
                <form onSubmit={handleSaveNotifications} className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <h4 className="text-sm font-medium text-white">Notifikasi Surat Masuk</h4>
                      <p className="text-xs text-slate-400 mt-1">Tampilkan peringatan saat ada surat masuk baru</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifyInbox} onChange={(e) => setNotifyInbox(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500" style={{ backgroundColor: notifyInbox ? 'var(--accent-text)' : undefined }}></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <h4 className="text-sm font-medium text-white">Pembaruan Sistem</h4>
                      <p className="text-xs text-slate-400 mt-1">Terima notifikasi terkait pembaruan aplikasi</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifySystem} onChange={(e) => setNotifySystem(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500" style={{ backgroundColor: notifySystem ? 'var(--accent-text)' : undefined }}></div>
                    </label>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-6">
                    <div>{isSaved && <SavedMessage />}</div>
                    <button type="submit" className="glass-button flex items-center gap-2">
                      <Save className="w-4 h-4" /> Simpan Perubahan
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB: KEAMANAN & AKSES PIN ADMIN */}
            {activeTab === 'security' && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6 space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-sky-400" style={{ color: 'var(--accent-text)' }} />
                      Keamanan & PIN Akses Portal Admin
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Atur PIN otorisasi khusus untuk masuk ke dasbor Admin Tata Usaha dari Portal Pengajuan Surat Guru & Wali Murid.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTestingPinModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Uji Coba PIN Sekarang</span>
                  </button>
                </div>

                <form onSubmit={handleSaveSecurity} className="space-y-6">
                  {/* CARD 1: PENGATURAN PIN PORTAL ADMIN */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/80 border border-indigo-500/30 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0 mt-0.5">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">PIN Akses Khusus Portal Admin</h4>
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                              requirePin ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-700/50 text-slate-400 border-slate-600"
                            )}>
                              {requirePin ? 'PIN Wajib Aktif' : 'PIN Opsional'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            Petugas Tata Usaha atau Kepala Sekolah dapat langsung masuk ke dasbor utama cukup dengan mengetikkan <b>PIN 4-6 digit</b> ini tanpa perlu mengetik ulang username & kata sandi panjang.
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={requirePin} 
                          onChange={(e) => setRequirePin(e.target.checked)} 
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                        Nomor PIN Admin Saat Ini (4 - 6 Digit Angka)
                      </label>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="relative w-full sm:w-64">
                          <input 
                            type={showPin ? "text" : "password"} 
                            value={pin} 
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                            className="glass-input w-full pr-10 text-base font-mono tracking-widest font-bold text-center bg-slate-900/90 border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                            placeholder="1234"
                            maxLength={6}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                            title={showPin ? "Sembunyikan PIN" : "Perlihatkan PIN"}
                          >
                            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                            setPin(randomPin);
                            setShowPin(true);
                            toast.success(`PIN baru di-generate: ${randomPin}. Klik Simpan untuk menerapkan.`);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Acak 4 Digit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPin('1234');
                            setShowPin(true);
                            toast.success('PIN direset ke default: 1234');
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset ke 1234</span>
                        </button>
                      </div>

                      <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>PIN standar sekolah bawaan sistem: <b className="text-slate-200 font-mono">1234</b>. Digunakan pada tombol <b>"🔐 Portal Admin TU"</b> di pojok atas Portal Pengajuan Surat.</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: KREDENSIAL AKUN UTAMA ADMIN */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      Kredensial Login Akun Alternatif (Username & Kata Sandi)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Kredensial ini digunakan jika Anda memilih login akun standar di halaman login utama.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Username Login Admin</label>
                        <input 
                          type="text" 
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          className="glass-input w-full"
                          required
                          placeholder="admin"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ganti Kata Sandi Baru</label>
                        <input 
                          type="password" 
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="glass-input w-full"
                          placeholder="Kosongkan jika tidak ingin mengubah"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Kosongkan jika tetap ingin memakai sandi saat ini.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>{isSaved && <SavedMessage />}</div>
                    <button type="submit" className="glass-button flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                      <Save className="w-4 h-4" /> Simpan Pengaturan PIN & Keamanan
                    </button>
                  </div>
                </form>

                {/* Modal Uji Coba PIN */}
                <AdminPinModal
                  isOpen={isTestingPinModalOpen}
                  onClose={() => setIsTestingPinModalOpen(false)}
                  isTestMode={true}
                  title="Uji Coba PIN Keamanan Admin"
                  subtitle="Ketikkan PIN yang Anda simpan untuk memverifikasi apakah PIN berfungsi dengan benar."
                />
              </motion.div>
            )}

            {/* TAB: MANAJEMEN DATA */}
            {activeTab === 'data' && (
              <motion.div 
                key="data"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="glass-panel p-6">
                  <h3 className="text-xl font-medium text-white mb-2 flex items-center gap-2">
                    <Database className="w-5 h-5 text-sky-400" style={{ color: 'var(--accent-text)' }} />
                    Backup & Restore Data
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Simpan cadangan data Anda ke dalam file, atau pulihkan data dari file cadangan sebelumnya. Sangat disarankan untuk rutin melakukan backup.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={exportData} className="glass-button flex items-center justify-center gap-2 flex-1">
                      <Download className="w-4 h-4" /> Export Data (Backup)
                    </button>
                    
                    <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={importData} />
                    <button onClick={() => fileInputRef.current?.click()} className="glass-button flex items-center justify-center gap-2 flex-1 !bg-white/5 !border-white/10 !text-slate-300 hover:!text-white hover:!bg-white/10">
                      <Upload className="w-4 h-4" /> Import Data (Restore)
                    </button>
                  </div>
                </div>

                <div className="glass-panel p-6 border-rose-500/20">
                  <h3 className="text-xl font-medium text-rose-400 mb-2 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Zona Berbahaya
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Tindakan di bawah ini akan menghapus seluruh data di aplikasi secara permanen. Pastikan Anda telah mencadangkan data sebelum melanjutkan.
                  </p>
                  <button 
                    type="button" 
                    className="glass-button-danger text-sm flex items-center gap-2"
                    onClick={resetData}
                  >
                    <Trash2 className="w-4 h-4" /> Reset Semua Data
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Modal Sinkronisasi Semua Data ke Google Drive */}
      <GoogleDriveModal
        isOpen={isDriveSyncModalOpen}
        onClose={() => setIsDriveSyncModalOpen(false)}
        mode="syncAll"
      />
    </motion.div>
  );
}
