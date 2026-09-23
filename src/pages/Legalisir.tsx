import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Award, 
  FileCheck, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  Download, 
  Eye, 
  UploadCloud, 
  Phone, 
  UserCheck, 
  Calendar, 
  FileText, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Share2, 
  HelpCircle, 
  ShieldCheck, 
  Check, 
  X, 
  RefreshCw, 
  Send, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  Lock,
  KeyRound,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { 
  db, 
  type LegalisirRequest, 
  type Student, 
  ensureLegalisirSeeded,
  addSystemLog
} from '../lib/db';
import { 
  printHTMLContent, 
  renderLegalisirReceiptHTML, 
  renderLegalisirEndorsementCertificateHTML, 
  renderLegalisirRegisterBookHTML, 
  renderLegalisirStampLabelsHTML,
  getSchoolConfig 
} from '../lib/printHelper';
import AdminPinModal from '../components/AdminPinModal';
import AppLogo from '../components/AppLogo';
import SecretAdminMarker, { useSecretAdminShortcut } from '../components/SecretAdminTrigger';
import ThemeToggleButton from '../components/ThemeToggleButton';

interface LegalisirProps {
  isAdmin?: boolean;
}

export default function Legalisir({ isAdmin = false }: LegalisirProps) {
  // Check admin session
  const checkIsAdmin = useCallback(() => {
    if (isAdmin) return true;
    const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
    const role = sessionStorage.getItem('userRole');
    return isAuth && role !== 'guru_wali';
  }, [isAdmin]);

  const [isCurrentAdmin, setIsCurrentAdmin] = useState<boolean>(checkIsAdmin);

  useEffect(() => {
    setIsCurrentAdmin(checkIsAdmin());
  }, [checkIsAdmin, isAdmin]);

  // Admin PIN prompt state
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);

  // Secret admin shortcut listener (Ctrl+Shift+A or Alt+A)
  useSecretAdminShortcut(() => {
    executeAdminAction(() => {
      setActiveTab('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Security gate for service actions in Buku Register
  const executeAdminAction = (action: () => void) => {
    if (isCurrentAdmin) {
      action();
    } else {
      toast('Fitur aksi layanan buku register hanya dapat digunakan oleh Petugas Admin TU. Masukkan PIN untuk melanjutkan.', {
        icon: '🔒',
      });
      setPendingAdminAction(() => action);
      setIsAdminPinModalOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsCurrentAdmin(true);
    setIsAdminPinModalOpen(false);
    toast.success('Akses Petugas Admin TU Berhasil Diverifikasi!');
    if (pendingAdminAction) {
      const fn = pendingAdminAction;
      setPendingAdminAction(null);
      fn();
    }
  };

  // Navigation & tabs
  const [activeTab, setActiveTab] = useState<'form' | 'tracking' | 'admin' | 'guide'>(
    isAdmin ? 'admin' : 'form'
  );

  // Auto seed check on mount
  useEffect(() => {
    ensureLegalisirSeeded();
  }, []);

  // Fetch live requests and students from Dexie
  const requests = useLiveQuery(() => db.legalisir.reverse().sortBy('submittedAt')) || [];
  const students = useLiveQuery(() => db.students.toArray()) || [];
  const teachers = useLiveQuery(() => db.teachers.toArray()) || [];

  // Active user / admin info
  const config = useMemo(() => getSchoolConfig(), []);
  const schoolName = localStorage.getItem('schoolName') || 'SMP Negeri 3 Kras';

  // State for search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Tracking tab state
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedRequest, setTrackedRequest] = useState<LegalisirRequest | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  // Selected request for detail / actions modal
  const [selectedReq, setSelectedReq] = useState<LegalisirRequest | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [successReceiptModal, setSuccessReceiptModal] = useState<LegalisirRequest | null>(null);

  // Status edit state
  const [newStatus, setNewStatus] = useState<LegalisirRequest['status']>('verified');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [rejectionInput, setRejectionInput] = useState('');
  const [takenByInput, setTakenByInput] = useState('');

  // New application form state
  const [formData, setFormData] = useState({
    documentType: 'ijazah' as LegalisirRequest['documentType'],
    documentName: 'Ijazah SMP Negeri 3 Kras',
    documentNumber: '',
    applicantName: '',
    applicantType: 'alumni' as LegalisirRequest['applicantType'],
    nisn: '',
    nis: '',
    graduationYear: new Date().getFullYear().toString(),
    birthPlaceDate: '',
    parentName: '',
    phone: '',
    email: '',
    numberOfCopies: 5,
    purpose: 'Persyaratan Pendaftaran Masuk SMA/SMK',
    destinationInstitution: '',
    deliveryMethod: 'ambil_langsung' as LegalisirRequest['deliveryMethod'],
    representativeName: '',
    representativePhone: '',
    fileUrl: '',
    fileName: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [studentSuggestions, setStudentSuggestions] = useState<Student[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const inProgress = requests.filter(r => r.status === 'verified' || r.status === 'signed').length;
    const ready = requests.filter(r => r.status === 'ready').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    return { total, pending, inProgress, ready, completed };
  }, [requests]);

  // Filtered requests list for Admin table
  const filteredRequests = useMemo(() => {
    return requests.filter(item => {
      const matchSearch = 
        item.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.nisn && item.nisn.includes(searchQuery)) ||
        (item.documentNumber && item.documentNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.purpose.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchDocType = docTypeFilter === 'all' || item.documentType === docTypeFilter;
      const matchYear = yearFilter === 'all' || item.graduationYear === yearFilter;

      return matchSearch && matchStatus && matchDocType && matchYear;
    });
  }, [requests, searchQuery, statusFilter, docTypeFilter, yearFilter]);

  // Unique graduation years in database
  const graduationYears = useMemo(() => {
    const years = new Set<string>();
    requests.forEach(r => {
      if (r.graduationYear) years.add(r.graduationYear);
    });
    return Array.from(years).sort().reverse();
  }, [requests]);

  // Handle student name autocomplete
  const handleApplicantNameChange = (val: string) => {
    setFormData(prev => ({ ...prev, applicantName: val }));
    if (val.trim().length >= 2) {
      const matched = students.filter(s => 
        s.name.toLowerCase().includes(val.toLowerCase()) ||
        (s.nisn && s.nisn.includes(val))
      ).slice(0, 5);
      setStudentSuggestions(matched);
      setShowSuggestions(matched.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setFormData(prev => ({
      ...prev,
      applicantName: student.name,
      nisn: student.nisn || '',
      nis: student.nis || '',
      birthPlaceDate: student.birthPlace && student.birthDate 
        ? `${student.birthPlace}, ${format(new Date(student.birthDate), 'dd MMMM yyyy', { locale: id })}`
        : '',
      phone: student.phone || prev.phone,
      email: student.email || prev.email,
    }));
    setShowSuggestions(false);
    toast.success(`Data ${student.name} otomatis dimuat dari Buku Induk Siswa!`);
  };

  // Handle file input for scan upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran berkas maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedFilePreview(result);
      setFormData(prev => ({
        ...prev,
        fileUrl: result,
        fileName: file.name
      }));
      toast.success(`Berkas ${file.name} berhasil dilampirkan.`);
    };
    reader.readAsDataURL(file);
  };

  // Generate unique Ticket Number (e.g. LEG-2026/08-006)
  const generateTicketNumber = async (): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const totalCount = await db.legalisir.count();
    const seq = String(totalCount + 1).padStart(3, '0');
    return `LEG-${currentYear}/${currentMonth}-${seq}`;
  };

  // Submit new legalization request
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.applicantName.trim()) {
      toast.error('Mohon isi nama lengkap pemohon.');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Mohon isi nomor WhatsApp aktif untuk notifikasi kesiapan berkas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketNumber = await generateTicketNumber();
      const qrVerificationCode = `SPEGA-LEG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRecord: Omit<LegalisirRequest, 'id'> = {
        ticketNumber,
        documentType: formData.documentType,
        documentName: formData.documentName || 'Ijazah SMP Negeri 3 Kras',
        documentNumber: formData.documentNumber || `DN-${new Date().getFullYear()}/REG-${Math.floor(10000 + Math.random() * 90000)}`,
        applicantName: formData.applicantName.trim(),
        applicantType: formData.applicantType,
        nisn: formData.nisn.trim() || undefined,
        nis: formData.nis.trim() || undefined,
        graduationYear: formData.graduationYear || new Date().getFullYear().toString(),
        birthPlaceDate: formData.birthPlaceDate.trim() || undefined,
        parentName: formData.parentName.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        numberOfCopies: Math.min(Math.max(Number(formData.numberOfCopies) || 1, 1), 10),
        purpose: formData.purpose.trim() || 'Persyaratan Administrasi',
        destinationInstitution: formData.destinationInstitution.trim() || undefined,
        deliveryMethod: formData.deliveryMethod,
        representativeName: formData.deliveryMethod === 'diwakilkan' ? formData.representativeName : undefined,
        representativePhone: formData.deliveryMethod === 'diwakilkan' ? formData.representativePhone : undefined,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        fileUrl: formData.fileUrl || undefined,
        fileName: formData.fileName || undefined,
        adminNotes: 'Permohonan berhasil didaftarkan. Menunggu verifikasi berkas oleh Petugas Tata Usaha.',
        qrVerificationCode,
        pickupSchedule: 'Senin - Kamis (07.30 - 14.30 WIB), Jumat (07.30 - 11.30 WIB) di Loket TU'
      };

      const newId = await db.legalisir.add(newRecord as LegalisirRequest);
      const createdObj = { ...newRecord, id: newId as number };

      await addSystemLog({
        action: 'Pengajuan Legalisir Online',
        category: 'Persuratan',
        level: 'info',
        user: formData.applicantName,
        details: `Permohonan legalisir ${formData.documentType} No. Tiket: ${ticketNumber} (${formData.numberOfCopies} lembar).`
      });

      toast.success('Permohonan legalisir berhasil dikirim!');
      setSuccessReceiptModal(createdObj);

      // Reset form
      setFormData({
        documentType: 'ijazah',
        documentName: 'Ijazah SMP Negeri 3 Kras',
        documentNumber: '',
        applicantName: '',
        applicantType: 'alumni',
        nisn: '',
        nis: '',
        graduationYear: new Date().getFullYear().toString(),
        birthPlaceDate: '',
        parentName: '',
        phone: '',
        email: '',
        numberOfCopies: 5,
        purpose: 'Persyaratan Pendaftaran Masuk SMA/SMK',
        destinationInstitution: '',
        deliveryMethod: 'ambil_langsung',
        representativeName: '',
        representativePhone: '',
        fileUrl: '',
        fileName: '',
      });
      setSelectedFilePreview(null);

    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengajukan legalisir: ' + (err.message || 'Kesalahan sistem'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Perform tracking search
  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) {
      toast.error('Masukkan Nomor Tiket, NISN, atau Nama Pemohon.');
      return;
    }

    const q = trackQuery.trim().toLowerCase();
    const found = requests.find(r => 
      r.ticketNumber.toLowerCase() === q ||
      (r.nisn && r.nisn === q) ||
      r.applicantName.toLowerCase().includes(q)
    );

    setTrackedRequest(found || null);
    setTrackSearched(true);

    if (found) {
      toast.success(`Permohonan ditemukan: ${found.applicantName} (${found.ticketNumber})`);
    } else {
      toast.error('Nomor tiket atau identitas pemohon tidak ditemukan dalam arsip legalisir.');
    }
  };

  // Print helper handlers
  const handlePrintReceipt = async (req: LegalisirRequest) => {
    try {
      toast.loading('Menyiapkan lembar tanda terima cetak...', { id: 'print-receipt' });
      const qrDataUrl = await QRCode.toDataURL(
        `https://spegamail.smpn3kras.sch.id/legalisir?ticket=${encodeURIComponent(req.ticketNumber)}`,
        { width: 140, margin: 1 }
      );
      const html = renderLegalisirReceiptHTML(req, config, qrDataUrl);
      await printHTMLContent(html, `Tanda_Terima_Legalisir_${req.ticketNumber}`, 'portrait');
      toast.success('Pratinjau cetak tanda terima siap!', { id: 'print-receipt' });
    } catch (e) {
      toast.error('Gagal mencetak tanda terima.', { id: 'print-receipt' });
    }
  };

  const handlePrintCertificate = async (req: LegalisirRequest) => {
    if (!isCurrentAdmin) {
      executeAdminAction(() => handlePrintCertificate(req));
      return;
    }
    try {
      toast.loading('Menyiapkan Surat Pengesahan Legalisir Resmi...', { id: 'print-cert' });
      const qrDataUrl = await QRCode.toDataURL(
        `VALIDASI RESMI SMPN 3 KRAS: ${req.ticketNumber} - ${req.applicantName} - ${req.documentNumber}`,
        { width: 150, margin: 1 }
      );
      const html = renderLegalisirEndorsementCertificateHTML(req, config, qrDataUrl, teachers);
      await printHTMLContent(html, `Surat_Pengesahan_Legalisir_${req.ticketNumber}`, 'portrait');
      toast.success('Surat Keterangan Pengesahan siap dicetak!', { id: 'print-cert' });
    } catch (e) {
      toast.error('Gagal membuat naskah surat pengesahan.', { id: 'print-cert' });
    }
  };

  const handlePrintRegisterBook = async () => {
    if (!isCurrentAdmin) {
      executeAdminAction(handlePrintRegisterBook);
      return;
    }
    try {
      toast.loading('Menyusun Buku Register Legalisir TU...', { id: 'print-book' });
      const yearLabel = yearFilter === 'all' ? 'Semua Tahun Kelulusan' : `Tahun Kelulusan ${yearFilter}`;
      const html = renderLegalisirRegisterBookHTML(filteredRequests, config, yearLabel, teachers);
      await printHTMLContent(html, `Buku_Register_Legalisir_SMPN3Kras`, 'landscape');
      toast.success('Buku Register Legalisir siap dicetak!', { id: 'print-book' });
    } catch (e) {
      toast.error('Gagal mencetak buku register.', { id: 'print-book' });
    }
  };

  const handlePrintStampLabels = async (req: LegalisirRequest) => {
    if (!isCurrentAdmin) {
      executeAdminAction(() => handlePrintStampLabels(req));
      return;
    }
    try {
      toast.loading('Menyiapkan Label Stempel Legalisir...', { id: 'print-labels' });
      const qrDataUrl = await QRCode.toDataURL(
        `KEABSAHAN: ${req.ticketNumber} | ${req.applicantName} | SMPN 3 KRAS`,
        { width: 100, margin: 0 }
      );
      const html = renderLegalisirStampLabelsHTML(req, config, qrDataUrl);
      await printHTMLContent(html, `Label_Stempel_Legalisir_${req.ticketNumber}`, 'portrait');
      toast.success('Label stempel siap dicetak & digunting!', { id: 'print-labels' });
    } catch (e) {
      toast.error('Gagal mencetak label stempel.', { id: 'print-labels' });
    }
  };

  // Open status update modal (Admin only)
  const handleOpenStatusModal = (req: LegalisirRequest) => {
    if (!isCurrentAdmin) {
      executeAdminAction(() => handleOpenStatusModal(req));
      return;
    }
    setSelectedReq(req);
    setNewStatus(req.status);
    setAdminNotesInput(req.adminNotes || '');
    setRejectionInput(req.rejectionReason || '');
    setTakenByInput(req.takenBy || req.applicantName);
    setStatusModal(true);
  };

  // Save updated status (Admin only)
  const handleSaveStatusUpdate = async () => {
    if (!isCurrentAdmin) {
      toast.error('Hanya Petugas Admin TU yang berwenang memperbarui status legalisir.');
      return;
    }
    if (!selectedReq || !selectedReq.id) return;

    try {
      const now = new Date().toISOString();
      const updates: Partial<LegalisirRequest> = {
        status: newStatus,
        adminNotes: adminNotesInput.trim() || selectedReq.adminNotes,
      };

      if (newStatus === 'verified') {
        updates.verifiedAt = now;
        updates.verifiedBy = config.adminName || 'Petugas Tata Usaha';
      } else if (newStatus === 'signed') {
        updates.signedAt = now;
      } else if (newStatus === 'ready') {
        updates.readyAt = now;
      } else if (newStatus === 'completed') {
        updates.completedAt = now;
        updates.takenBy = takenByInput.trim() || selectedReq.applicantName;
        updates.takenDate = format(new Date(), 'yyyy-MM-dd');
      } else if (newStatus === 'rejected') {
        updates.rejectionReason = rejectionInput.trim() || 'Berkas dokumen fisik buram atau tidak sesuai Buku Induk.';
      }

      await db.legalisir.update(selectedReq.id, updates);

      await addSystemLog({
        action: 'Pembaruan Status Legalisir',
        category: 'Persuratan',
        level: 'success',
        user: config.adminName || 'Admin TU',
        details: `Update status legalisir ${selectedReq.ticketNumber} (${selectedReq.applicantName}) -> ${newStatus.toUpperCase()}`
      });

      toast.success(`Status ${selectedReq.ticketNumber} berhasil diperbarui menjadi ${newStatus.toUpperCase()}`);
      setStatusModal(false);

      if (trackedRequest && trackedRequest.id === selectedReq.id) {
        setTrackedRequest({ ...trackedRequest, ...updates });
      }
    } catch (e) {
      toast.error('Gagal memperbarui status.');
    }
  };

  // Delete legalisir record (Admin only)
  const handleDeleteRequest = async (req: LegalisirRequest) => {
    if (!isCurrentAdmin) {
      executeAdminAction(() => handleDeleteRequest(req));
      return;
    }

    if (!window.confirm(`Hapus data permohonan legalisir ${req.ticketNumber} (${req.applicantName}) dari buku register?`)) {
      return;
    }

    if (!req.id) return;

    try {
      await db.legalisir.delete(req.id);
      await addSystemLog({
        action: 'Hapus Berkas Legalisir',
        category: 'Persuratan',
        level: 'warning',
        user: config.adminName || 'Admin TU',
        details: `Menghapus arsip permohonan legalisir ${req.ticketNumber} (${req.applicantName}).`
      });

      toast.success(`Berkas ${req.ticketNumber} berhasil dihapus.`);
      if (selectedReq?.id === req.id) {
        setViewDetailModal(false);
      }
    } catch (e) {
      toast.error('Gagal menghapus berkas.');
    }
  };

  // Generate WhatsApp Direct Notification URL
  const generateWhatsAppNotificationUrl = (req: LegalisirRequest) => {
    const cleanPhone = req.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0') 
      ? '62' + cleanPhone.slice(1) 
      : cleanPhone.startsWith('62') 
        ? cleanPhone 
        : '62' + cleanPhone;

    let message = '';
    if (req.status === 'ready') {
      message = `Halo *${req.applicantName}*,\n\nKami menginformasikan dari *Tata Usaha ${schoolName}* bahwa permohonan legalisir ${req.documentName} Anda dengan nomor tiket *${req.ticketNumber}* telah *SELESAI DITANDATANGANI & DISAHKAN*.\n\nDokumen terlegalisir sebanyak *${req.numberOfCopies} lembar* siap diambil di Ruang Tata Usaha (TU) SMP Negeri 3 Kras pada hari kerja (Senin - Jumat, 08.00 - 14.00 WIB).\n\n*Catatan*: Harap membawa Ijazah Asli untuk verifikasi saat pengambilan. Layanan ini GRATIS tanpa dipungut biaya apapun.\n\nTerima kasih.`;
    } else if (req.status === 'completed') {
      message = `Halo *${req.applicantName}*,\n\nTerima kasih. Dokumen legalisir nomor tiket *${req.ticketNumber}* telah resmi diserahkan pada tanggal ${req.takenDate || 'hari ini'} di Loket Tata Usaha *${schoolName}*.\n\nSemoga berkas legalisir tersebut bermanfaat untuk keperluan ${req.purpose}.\n\nSalam hormat,\nTata Usaha SMP Negeri 3 Kras.`;
    } else {
      message = `Halo *${req.applicantName}*,\n\nStatus permohonan legalisir Anda di *${schoolName}* dengan No. Tiket *${req.ticketNumber}* saat ini: *${req.status.toUpperCase()}*.\n\nCatatan TU: ${req.adminNotes || 'Sedang diproses sesuai prosedur sekolah.'}\n\nTerima kasih.`;
    }

    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  };

  // Status color badge helper
  const getStatusBadge = (status: LegalisirRequest['status']) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Siap Diambil di TU
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Check className="w-3.5 h-3.5" />
            Selesai Diserahkan
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <UserCheck className="w-3.5 h-3.5" />
            Diverifikasi Buku Induk
          </span>
        );
      case 'signed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Award className="w-3.5 h-3.5" />
            Ditandatangani Kasek
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <X className="w-3.5 h-3.5" />
            Ditolak / Perlu Perbaikan
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Menunggu Verifikasi
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-28 md:pb-12">
      {/* Top Quick Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
            title="Kembali ke Portal 1: Layanan Draf Surat Guru & Wali Murid"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Portal 1: Guru & Wali</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="font-bold">PORTAL 2</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-[11px]">LEGALISIR IJAZAH</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Secret Admin Marker (Hanya Admin yang Tahu) */}
          <SecretAdminMarker
            variant="dot"
            onTrigger={() => {
              executeAdminAction(() => {
                setActiveTab('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              });
            }}
          />
          <ThemeToggleButton variant="pill" />
        </div>
      </div>

      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
          <AppLogo size="2xl" className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            {/* Secret triple-click trigger on emblem badge */}
            <SecretAdminMarker
              variant="logo-wrapper"
              onTrigger={() => {
                executeAdminAction(() => {
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                });
              }}
              className="inline-block"
            >
              <div className="flex items-center gap-3 cursor-pointer group">
                <AppLogo size="md" withGlow className="group-hover:scale-105 transition-transform" />
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-all">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono font-bold">PORTAL 2</span> • Layanan Terpadu Legalisir • {schoolName}
                </div>
              </div>
            </SecretAdminMarker>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Portal 2: Layanan Legalisir Ijazah & Dokumen Sekolah
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pengesahan resmi fotokopi Ijazah, Surat Keterangan Lulus (SKL), Buku Rapor, dan Piagam Prestasi siswa & alumni SMP Negeri 3 Kras secara terstandar, cepat, akurat, dan 100% Bebas Biaya (Gratis).
            </p>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex flex-wrap md:flex-col items-start gap-2 bg-slate-950/60 backdrop-blur-md p-4 rounded-xl border border-slate-800 shrink-0">
            <div className="text-xs text-slate-400 font-medium">Rekapitulasi Layanan:</div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{stats.pending} Antrean</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{stats.ready} Siap Ambil</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>{stats.completed} Selesai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'form'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Plus className="w-4 h-4" />
            Ajukan Permohonan Legalisir
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'tracking'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Search className="w-4 h-4" />
            Lacak Status Tiket
          </button>

          {isCurrentAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Buku Register & Loket TU</span>
              {stats.pending > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                  {stats.pending} Baru
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('guide')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'guide'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            SOP & Panduan Berkas
          </button>
        </div>
      </div>

      {/* TAB 1: FORM PENGAJUAN LEGALISIR ONLINE */}
      {activeTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-indigo-400" />
                    Formulir Permohonan Pengesahan Legalisir
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Silakan lengkapi data di bawah ini dengan cermat sesuai dokumen fisik asli.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Gratis (Rp 0)
                </span>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-6">
                {/* Step 1: Jenis Dokumen & Pemohon */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                    Pilih Jenis Dokumen & Status Pemohon
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Jenis Dokumen yang Dilegalisir <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formData.documentType}
                        onChange={(e) => {
                          const val = e.target.value as LegalisirRequest['documentType'];
                          const nameMap: Record<string, string> = {
                            ijazah: 'Ijazah SMP Negeri 3 Kras',
                            skl: 'Surat Keterangan Lulus (SKL)',
                            rapor: 'Buku Rapor Siswa Semester 1-6',
                            piagam: 'Piagam / Sertifikat Prestasi',
                            skpi: 'Surat Keterangan Pengganti Ijazah (SKPI)',
                            lainnya: 'Dokumen Sekolah Lainnya'
                          };
                          setFormData(prev => ({ 
                            ...prev, 
                            documentType: val,
                            documentName: nameMap[val] || 'Dokumen Sekolah'
                          }));
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                        required
                      >
                        <option value="ijazah">Ijazah SMP (STTB / Ijazah Kelulusan)</option>
                        <option value="skl">Surat Keterangan Lulus (SKL Resmi)</option>
                        <option value="rapor">Buku Rapor (Semester 1 s.d 6)</option>
                        <option value="piagam">Piagam Penghargaan / Sertifikat Prestasi</option>
                        <option value="skpi">Surat Keterangan Pengganti Ijazah (SKPI Rusak/Hilang)</option>
                        <option value="lainnya">Dokumen Sekolah Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Status Pemohon <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formData.applicantType}
                        onChange={(e) => setFormData(prev => ({ ...prev, applicantType: e.target.value as any }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="alumni">Alumni Siswa SMPN 3 Kras</option>
                        <option value="siswa">Peserta Didik Aktif</option>
                        <option value="wali">Orang Tua / Wali Murid</option>
                        <option value="instansi">Perwakilan Instansi / Kedinasan</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 2: Data Pemohon / Alumni */}
                <div className="space-y-4 pt-2 border-t border-slate-800/80">
                  <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
                    Identitas Pemohon (Alumni / Siswa)
                  </h3>

                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nama Lengkap Siswa / Alumni <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ketik nama untuk pencocokan otomatis buku induk siswa..."
                      value={formData.applicantName}
                      onChange={(e) => handleApplicantNameChange(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden">
                        <div className="p-2 text-[11px] font-semibold text-indigo-300 bg-slate-900 border-b border-slate-700">
                          Saran Data dari Buku Induk SMPN 3 Kras:
                        </div>
                        {studentSuggestions.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => handleSelectStudent(st)}
                            className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-none flex items-center justify-between"
                          >
                            <div>
                              <div className="text-sm font-semibold text-white">{st.name}</div>
                              <div className="text-xs text-slate-400">
                                NISN: {st.nisn || '-'} • Kelas: {st.grade || '-'} • NIS: {st.nis || '-'}
                              </div>
                            </div>
                            <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded">
                              Pilih Auto-fill
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        NISN (Nomor Induk Siswa Nasional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 0089123456"
                        value={formData.nisn}
                        onChange={(e) => setFormData(prev => ({ ...prev, nisn: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        NIS (Nomor Induk Sekolah)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 4210"
                        value={formData.nis}
                        onChange={(e) => setFormData(prev => ({ ...prev, nis: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tahun Kelulusan <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1990"
                        max="2030"
                        value={formData.graduationYear}
                        onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tempat, Tanggal Lahir
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Kediri, 12 April 2009"
                        value={formData.birthPlaceDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, birthPlaceDate: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nama Orang Tua / Wali
                      </label>
                      <input
                        type="text"
                        placeholder="Nama Ayah/Ibu kandung sesuai ijazah"
                        value={formData.parentName}
                        onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nomor WhatsApp Aktif <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          placeholder="08xxxxxxxxxx (untuk notifikasi kesiapan)"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Notifikasi pengambilan akan dikirimkan ke nomor ini.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Email Pemohon (Opsional)
                      </label>
                      <input
                        type="email"
                        placeholder="alamat.email@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Nomor Dokumen, Jumlah & Keperluan */}
                <div className="space-y-4 pt-2 border-t border-slate-800/80">
                  <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">3</span>
                    Rincian Dokumen & Keperluan Pengesahan
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nomor Seri Ijazah / Dokumen Asli
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: DN-05/DI-06/0129845"
                        value={formData.documentNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Dapat dilihat di pojok bawah blanko Ijazah/SKL Anda.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Jumlah Lembar yang Dilegalisir <span className="text-rose-400">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.numberOfCopies}
                          onChange={(e) => setFormData(prev => ({ ...prev, numberOfCopies: Number(e.target.value) }))}
                          className="flex-1 accent-indigo-500 cursor-pointer"
                        />
                        <span className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl font-bold text-indigo-300 text-sm w-24 text-center">
                          {formData.numberOfCopies} Lembar
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Kebijakan sekolah: Maksimal 10 eksemplar per permohonan.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Keperluan / Tujuan Pengesahan <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Persyaratan Pendaftaran Masuk SMA/SMK"
                        value={formData.purpose}
                        onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Instansi / Sekolah Lanjutan Tujuan (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: SMAN 1 Kandat / Kedinasan TNI"
                        value={formData.destinationInstitution}
                        onChange={(e) => setFormData(prev => ({ ...prev, destinationInstitution: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Delivery Method */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Metode Pengambilan Dokumen Terlegalisir
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: 'ambil_langsung' }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formData.deliveryMethod === 'ambil_langsung'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white">Ambil Sendiri di TU</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Datang ke loket dengan membawa Ijazah Asli</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: 'diwakilkan' }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formData.deliveryMethod === 'diwakilkan'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white">Diwakilkan Keluarga</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Wajib membawa Surat Kuasa / KTP Kuasa</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: 'pos_ekspedisi' }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formData.deliveryMethod === 'pos_ekspedisi'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white">Layanan Luar Kota</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Koordinasi khusus dengan staf TU sekolah</div>
                      </button>
                    </div>

                    {formData.deliveryMethod === 'diwakilkan' && (
                      <div className="mt-3 p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl space-y-3">
                        <div className="text-xs font-semibold text-amber-300">
                          Data Perwakilan / Penerima Kuasa:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Nama Lengkap Penerima Kuasa"
                            value={formData.representativeName}
                            onChange={(e) => setFormData(prev => ({ ...prev, representativeName: e.target.value }))}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                            required
                          />
                          <input
                            type="tel"
                            placeholder="No. WhatsApp Penerima Kuasa"
                            value={formData.representativePhone}
                            onChange={(e) => setFormData(prev => ({ ...prev, representativePhone: e.target.value }))}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 4: Upload Scan Berkas Asli */}
                <div className="space-y-4 pt-2 border-t border-slate-800/80">
                  <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">4</span>
                    Lampirkan Foto / Scan Dokumen Asli (Opsional tapi Direkomendasikan)
                  </h3>

                  <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center transition-colors bg-slate-950/40">
                    <input
                      type="file"
                      id="scan-upload"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="scan-upload" className="cursor-pointer block">
                      <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-white">
                        {formData.fileName ? formData.fileName : 'Klik untuk memilih atau seret foto/scan dokumen ke sini'}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Format JPG, PNG, atau PDF (Ukuran maksimal 5MB). Digunakan staf TU untuk validasi awal.
                      </p>
                    </label>

                    {selectedFilePreview && (
                      <div className="mt-4 inline-block relative border border-slate-700 rounded-xl p-2 bg-slate-900">
                        <img 
                          src={selectedFilePreview} 
                          alt="Preview Scan Ijazah" 
                          className="max-h-40 max-w-full rounded object-contain mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFilePreview(null);
                            setFormData(prev => ({ ...prev, fileUrl: '', fileName: '' }));
                          }}
                          className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-500 shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Memproses Permohonan...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Kirim Permohonan Legalisir
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Information Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Informasi Layanan Legalisir
              </h3>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="font-semibold text-white mb-1">⏱️ Estimasi Waktu Layanan:</div>
                  <div>1 Hari Kerja (Same Day Service bila berkas fisik fotokopi & ijazah asli diserahkan ke loket sebelum pk. 11.00 WIB).</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="font-semibold text-white mb-1">📋 Dokumen Wajib Dibawa:</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    <li>Ijazah / Dokumen ASLI (untuk dicocokkan).</li>
                    <li>Fotokopi dokumen yang telah digandakan rapi sejumlah yang diajukan.</li>
                    <li>Bukti Tanda Terima Permohonan (cetak atau tunjukkan di HP).</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="font-semibold text-white mb-1">🏢 Jam Operasional Loket TU:</div>
                  <div><b>Senin - Kamis:</b> 07.30 - 14.30 WIB</div>
                  <div><b>Jumat:</b> 07.30 - 11.30 WIB</div>
                  <div><b>Sabtu:</b> 07.30 - 13.00 WIB</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                  <div className="font-bold mb-0.5">Bebas Pungutan (Gratis):</div>
                  <div>Seluruh layanan persuratan dan pengesahan legalisir di SMP Negeri 3 Kras tidak dipungut biaya apapun (Rp 0).</div>
                </div>
              </div>
            </div>

            {/* Quick Track Box */}
            <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl text-center space-y-3">
              <QrCode className="w-10 h-10 text-indigo-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Sudah Pernah Mendaftar?</h4>
              <p className="text-xs text-slate-400">
                Lacak posisi berkas Anda secara langsung dengan memasukkan Nomor Tiket atau NISN.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('tracking')}
                className="w-full py-2.5 px-4 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 rounded-xl text-xs font-bold text-indigo-200 transition-colors"
              >
                Buka Pelacakan Tiket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PELACAKAN STATUS TIKET (TRACKING SYSTEM) */}
      {activeTab === 'tracking' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Pelacakan Status Permohonan Legalisir
              </h2>
              <p className="text-xs text-slate-400">
                Ketik Nomor Tiket (contoh: <code className="text-indigo-300 font-mono">LEG-2026/08-001</code>), NISN, atau Nama Pemohon.
              </p>
            </div>

            <form onSubmit={handleTrackSubmit} className="flex gap-2 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Masukkan No. Tiket (LEG-...) / NISN / Nama..."
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
              >
                Lacak Berkas
              </button>
            </form>

            {/* Quick Chips of Recent Requests */}
            {requests.length > 0 && (
              <div className="mt-4 text-center">
                <div className="text-[11px] text-slate-500 mb-1.5">Permohonan Terdaftar Terakhir:</div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {requests.slice(0, 4).map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setTrackQuery(r.ticketNumber);
                        setTrackedRequest(r);
                        setTrackSearched(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-colors"
                    >
                      {r.ticketNumber} ({r.applicantName.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tracking Result Card */}
          {trackSearched && trackedRequest && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="text-xs font-bold text-indigo-400 font-mono">
                    TIKET: {trackedRequest.ticketNumber}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {trackedRequest.applicantName}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {trackedRequest.documentName} • Tahun Kelulusan {trackedRequest.graduationYear} • NISN: {trackedRequest.nisn || '-'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(trackedRequest.status)}
                  <button
                    onClick={() => handlePrintReceipt(trackedRequest)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
                    title="Cetak Tanda Terima"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visual Workflow Stepper */}
              <div className="py-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                  Perjalanan Proses Pengesahan (Workflow):
                </div>

                {/* 5-Step Process */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
                  {[
                    { key: 'pending', title: '1. Diajukan', desc: 'Antrean loket online' },
                    { key: 'verified', title: '2. Verifikasi TU', desc: 'Cocok Buku Induk' },
                    { key: 'signed', title: '3. TTD Kasek', desc: 'Pengesahan Kepala Sekolah' },
                    { key: 'ready', title: '4. Siap Diambil', desc: 'Loket TU SMPN 3 Kras' },
                    { key: 'completed', title: '5. Selesai', desc: 'Telah diserahkan' },
                  ].map((step, idx) => {
                    const statusOrder = ['pending', 'verified', 'signed', 'ready', 'completed'];
                    const currentIdx = statusOrder.indexOf(trackedRequest.status);
                    const isDone = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div
                        key={step.key}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                          )}
                        </div>
                        <div className={`text-xs font-bold ${isDone ? 'text-white' : 'text-slate-400'}`}>
                          {step.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          {step.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Message & Action Guide */}
              <div className={`p-4 rounded-xl border ${
                trackedRequest.status === 'ready' 
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : trackedRequest.status === 'completed'
                    ? 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300'
              }`}>
                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Catatan Petugas Tata Usaha:
                </div>
                <div className="text-xs leading-relaxed">
                  {trackedRequest.adminNotes || 'Permohonan Anda sedang dalam proses verifikasi dengan Buku Induk Siswa.'}
                </div>
                {trackedRequest.pickupSchedule && (
                  <div className="mt-2 text-xs font-semibold">
                    Jadwal Loket Pengambilan: {trackedRequest.pickupSchedule}
                  </div>
                )}
              </div>

              {/* Detail Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-slate-400">Nomor Seri Ijazah/Dokumen:</div>
                  <div className="font-bold text-white font-mono text-sm">{trackedRequest.documentNumber || '-'}</div>
                  <div className="text-slate-400 mt-2">Jumlah Eksemplar:</div>
                  <div className="font-bold text-indigo-300">{trackedRequest.numberOfCopies} Lembar / Rangkap</div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-slate-400">Keperluan & Instansi Tujuan:</div>
                  <div className="font-bold text-white">{trackedRequest.purpose}</div>
                  <div className="text-slate-400 mt-2">Waktu Pengajuan:</div>
                  <div className="font-bold text-slate-300">
                    {format(new Date(trackedRequest.submittedAt), 'dd MMMM yyyy, HH:mm', { locale: id })} WIB
                  </div>
                </div>
              </div>

              {/* Contact Helpdesk Button */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Memerlukan bantuan petugas terkait permohonan ini?
                </div>
                <a
                  href={`https://wa.me/6285100004614?text=${encodeURIComponent(`Halo Tata Usaha SMPN 3 Kras, saya ingin menanyakan permohonan legalisir dengan No. Tiket: ${trackedRequest.ticketNumber} atas nama ${trackedRequest.applicantName}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Hubungi Helpdesk TU WhatsApp
                </a>
              </div>
            </div>
          )}

          {trackSearched && !trackedRequest && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Permohonan Tidak Ditemukan</h3>
              <p className="text-xs max-w-md mx-auto">
                Nomor tiket atau identitas pemohon tidak cocok dengan pendaftaran yang tersimpan di arsip persuratan sekolah. Harap periksa kembali nomor tiket Anda.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BUKU REGISTER & TATA KELOLA TU (ADMIN MODE) */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {/* Admin Mode Security Notice Banner */}
          {!isCurrentAdmin ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/50 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Buku Register Loket TU • Mode Baca (Akses Terbatas)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                      HANYA BACA
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Fitur aksi layanan (Verifikasi Buku Induk, Pembaruan Status, Cetak Surat Pengesahan Resmi, Label Cap, & Walk-in) <b>hanya bisa digunakan oleh Petugas Admin TU</b>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPendingAdminAction(null);
                  setIsAdminPinModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-950/50 transition-all flex items-center gap-2 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              >
                <KeyRound className="w-4 h-4" />
                <span>Buka Akses Admin TU</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><b>Sesi Petugas Admin TU Aktif:</b> Anda memiliki hak penuh untuk verifikasi nomor seri ijazah, pembaruan status, pencetakan dokumen dinas resmi, label stempel, dan manajemen arsip.</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                HAK AKSES ADMIN AKTIF
              </span>
            </div>
          )}

          {/* Action & Filter Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Buku Register & Manajemen Loket Legalisir Tata Usaha
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sub Bagian Tata Usaha • Buku Agenda Pengesahan STTB / Ijazah & Dokumen Sekolah
                </p>
              </div>

              {/* Admin Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => executeAdminAction(() => setActiveTab('form'))}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  title={!isCurrentAdmin ? "Khusus Petugas Admin TU" : ""}
                >
                  <Plus className="w-4 h-4" />
                  <span>Pendaftaran Langsung (Walk-in TU)</span>
                  {!isCurrentAdmin && <Lock className="w-3 h-3 text-indigo-200" />}
                </button>

                <button
                  onClick={() => executeAdminAction(handlePrintRegisterBook)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors"
                  title={!isCurrentAdmin ? "Khusus Petugas Admin TU" : ""}
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Buku Register (PDF/Print)</span>
                  {!isCurrentAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama alumni, NISN, No. Tiket, atau No. Ijazah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Semua Status ({requests.length})</option>
                  <option value="pending">Menunggu Verifikasi ({stats.pending})</option>
                  <option value="verified">Diverifikasi Buku Induk</option>
                  <option value="signed">Ditandatangani Kasek</option>
                  <option value="ready">Siap Diambil ({stats.ready})</option>
                  <option value="completed">Selesai Diserahkan ({stats.completed})</option>
                </select>
              </div>

              <div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Semua Angkatan / Th Lulus</option>
                  {graduationYears.map(yr => (
                    <option key={yr} value={yr}>Lulusan Tahun {yr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">No. Tiket / Tgl</th>
                    <th className="py-3 px-4">Nama Alumni / Pemohon</th>
                    <th className="py-3 px-4">Dokumen & No. Seri</th>
                    <th className="py-3 px-4 text-center">Lembar</th>
                    <th className="py-3 px-4">Keperluan & Tujuan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Aksi Layanan</span>
                        {!isCurrentAdmin ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 normal-case tracking-normal">
                            <Lock className="w-2.5 h-2.5" />
                            Khusus Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 normal-case tracking-normal">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Admin TU
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRequests.map((req, idx) => {
                    const submitFormatted = req.submittedAt 
                      ? format(new Date(req.submittedAt), 'dd/MM/yyyy') 
                      : '-';

                    return (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                          {idx + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold font-mono text-indigo-300">{req.ticketNumber}</div>
                          <div className="text-[11px] text-slate-500">{submitFormatted}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{req.applicantName}</div>
                          <div className="text-[11px] text-slate-400">
                            NISN: <span className="font-mono">{req.nisn || '-'}</span> • Th {req.graduationYear || '-'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{req.documentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{req.documentNumber || '-'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                            {req.numberOfCopies} lbr
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="truncate text-slate-200">{req.purpose}</div>
                          {req.destinationInstitution && (
                            <div className="text-[11px] text-slate-400 truncate">{req.destinationInstitution}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(req.status)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Update Status Button (Admin only) */}
                            <button
                              onClick={() => executeAdminAction(() => handleOpenStatusModal(req))}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                isCurrentAdmin
                                  ? 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border-indigo-500/30'
                                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 border-slate-700'
                              }`}
                              title={isCurrentAdmin ? "Ubah Status / Verifikasi (Admin TU)" : "Ubah Status / Verifikasi (Khusus Admin - Klik untuk verifikasi PIN)"}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Notification Button (Admin only) */}
                            <button
                              onClick={() => executeAdminAction(() => window.open(generateWhatsAppNotificationUrl(req), '_blank'))}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                isCurrentAdmin
                                  ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-emerald-300 border-slate-700'
                              }`}
                              title={isCurrentAdmin ? "Kirim Notifikasi WhatsApp (Admin TU)" : "Kirim Notifikasi WhatsApp (Khusus Admin)"}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>

                            {/* Print Certificate of Endorsement (Admin only) */}
                            <button
                              onClick={() => executeAdminAction(() => handlePrintCertificate(req))}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                isCurrentAdmin
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
                              }`}
                              title={isCurrentAdmin ? "Cetak Surat Pengesahan Legalisir (Format Dinas Resmi)" : "Cetak Surat Pengesahan (Khusus Admin)"}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* Print Stamp Labels (Admin only) */}
                            <button
                              onClick={() => executeAdminAction(() => handlePrintStampLabels(req))}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                isCurrentAdmin
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
                              }`}
                              title={isCurrentAdmin ? "Cetak Label Stempel Barcode (Admin TU)" : "Cetak Label Stempel (Khusus Admin)"}
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            {/* View Detail Modal (Public / Admin) */}
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setViewDetailModal(true);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                              title="Lihat Detail Lengkap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Record (Admin only) */}
                            {isCurrentAdmin && (
                              <button
                                onClick={() => handleDeleteRequest(req)}
                                className="p-1.5 bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-colors border border-rose-800/40"
                                title="Hapus Berkas (Admin TU)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Tidak ada catatan permohonan legalisir yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SOP & PANDUAN BERKAS */}
      {activeTab === 'guide' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Standar Operasional Prosedur (SOP) Pelayanan Legalisir Ijazah
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Pedoman resmi pelaksanaan pengesahan dokumen kesiswaan & ijazah di SMP Negeri 3 Kras Kediri.
              </p>
            </div>

            {/* 4-Step Infographic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="font-bold text-sm text-white">Pengajuan Permohonan</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pemohon mengajukan secara mandiri melalui portal online ini atau datang langsung ke ruang Tata Usaha dengan membawa fotokopi dokumen yang telah digandakan rapi.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="font-bold text-sm text-white">Verifikasi Buku Induk & Ijazah Asli</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Petugas Tata Usaha meneliti keabsahan berkas dengan mencocokkan Nomor Seri Ijazah, NISN, NIS, dan nilai dengan Buku Induk Siswa yang tersimpan di arsip sekolah.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="font-bold text-sm text-white">Penandatanganan & Cap Stempel Basah</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Setelah dinyatakan absah, berkas fotokopi ditandatangani oleh Kepala Sekolah / Plt. Kepala Sekolah dan dibubuhi Cap Dinas Resmi SMP Negeri 3 Kras.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h4 className="font-bold text-sm text-white">Penyerahan & Arsip Register</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Dokumen diserahkan kepada pemohon di loket TU dengan menandatangani Buku Register Pengesahan Legalisir sebagai bukti serah terima resmi.
                </p>
              </div>
            </div>

            {/* Requirements Box */}
            <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-3">
              <h3 className="text-sm font-bold text-indigo-200">
                Syarat & Ketentuan Pengesahan Dokumen:
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-5">
                <li>Ijazah / SKL yang diajukan adalah dokumen resmi yang diterbitkan oleh SMP Negeri 3 Kras Kabupaten Kediri.</li>
                <li>Fotokopi harus berukuran standar A4 / Folio (F4) 70-80 gram, tulisan terbaca jelas, dan tidak terpotong.</li>
                <li>Jumlah eksemplar yang dilegalisir maksimal <b>10 lembar</b> per pengajuan.</li>
                <li>Bila Ijazah Asli hilang atau rusak, pemohon wajib melampirkan Surat Keterangan Kehilangan dari Kepolisian (Polsek) untuk penerbitan SKPI (Surat Keterangan Pengganti Ijazah).</li>
                <li>Layanan Pengesahan Legalisir Sekolah <b>100% BEBAS BIAYA / GRATIS</b>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUKTI TANDA TERIMA PENDAFTARAN SUKSES */}
      {successReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Permohonan Legalisir Berhasil Didaftarkan!
              </h3>
              <p className="text-xs text-slate-400">
                Nomor Tiket Anda telah resmi tersimpan di sistem Tata Usaha sekolah.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <div className="text-xs text-slate-500 uppercase font-semibold">Nomor Tiket Registrasi:</div>
              <div className="text-2xl font-mono font-extrabold text-indigo-400 tracking-wider">
                {successReceiptModal.ticketNumber}
              </div>
              <div className="text-xs text-slate-300">
                Pemohon: <b>{successReceiptModal.applicantName}</b> ({successReceiptModal.documentName})
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 leading-relaxed">
              <b>Petunjuk Pengambilan:</b> Silakan simpan nomor tiket ini atau cetak tanda terima di bawah. Bawa Ijazah Asli dan {successReceiptModal.numberOfCopies} lembar fotokopi ke loket TU SMP Negeri 3 Kras pada jam kerja.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handlePrintReceipt(successReceiptModal)}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <Printer className="w-4 h-4" />
                Cetak Tanda Terima (PDF/Print)
              </button>

              <button
                type="button"
                onClick={() => setSuccessReceiptModal(null)}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE STATUS & VERIFIKASI (ADMIN) */}
      {statusModal && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  Verifikasi & Proses Status Legalisir
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedReq.ticketNumber} • {selectedReq.applicantName}
                </div>
              </div>
              <button
                onClick={() => setStatusModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Pilih Tahapan Status Baru:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="pending">Menunggu Verifikasi (Antrean Baru)</option>
                  <option value="verified">Diverifikasi (Sesuai Buku Induk Siswa)</option>
                  <option value="signed">Ditandatangani (Kepala Sekolah / Plt)</option>
                  <option value="ready">Siap Diambil di Loket TU (Kirim Notifikasi WA)</option>
                  <option value="completed">Selesai (Berkas Telah Diserahkan)</option>
                  <option value="rejected">Ditolak / Berkas Fisik Tidak Sah</option>
                </select>
              </div>

              {newStatus === 'completed' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Penerima / Pengambil Dokumen:
                  </label>
                  <input
                    type="text"
                    value={takenByInput}
                    onChange={(e) => setTakenByInput(e.target.value)}
                    placeholder="Nama pengambil (sendiri atau nama penerima kuasa)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {newStatus === 'rejected' && (
                <div>
                  <label className="block text-rose-300 font-semibold mb-1">
                    Alasan Penolakan:
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionInput}
                    onChange={(e) => setRejectionInput(e.target.value)}
                    placeholder="Misal: Nomor Ijazah tidak terdaftar pada buku induk atau berkas fotokopi buram."
                    className="w-full bg-slate-800 border border-rose-800/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Catatan Petugas Tata Usaha (Bisa Dilihat Pemohon Saat Tracking):
                </label>
                <textarea
                  rows={3}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Instruksi pengambilan, verifikasi buku induk, atau jadwal..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStatusUpdate}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
              >
                Simpan & Perbarui Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL LENGKAP PERMOHONAN (ADMIN) */}
      {viewDetailModal && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Rincian Arsip Permohonan Legalisir
                </h3>
                <div className="text-xs text-indigo-400 font-mono mt-0.5">
                  Nomor Tiket: {selectedReq.ticketNumber}
                </div>
              </div>
              <button
                onClick={() => setViewDetailModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-slate-400">Nama Pemohon:</div>
                <div className="font-bold text-white text-sm">{selectedReq.applicantName}</div>
                <div className="text-slate-400">NISN / NIS:</div>
                <div className="font-mono text-slate-200">{selectedReq.nisn || '-'} / {selectedReq.nis || '-'}</div>
                <div className="text-slate-400">Tahun Kelulusan:</div>
                <div className="font-semibold text-slate-200">Tahun {selectedReq.graduationYear}</div>
                <div className="text-slate-400">WhatsApp:</div>
                <div className="font-mono text-emerald-400">{selectedReq.phone}</div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="text-slate-400">Dokumen yang Dilegalisir:</div>
                <div className="font-bold text-white text-sm">{selectedReq.documentName}</div>
                <div className="text-slate-400">Nomor Seri Blanko:</div>
                <div className="font-mono text-slate-200">{selectedReq.documentNumber || '-'}</div>
                <div className="text-slate-400">Jumlah Eksemplar:</div>
                <div className="font-bold text-indigo-300">{selectedReq.numberOfCopies} Lembar</div>
                <div className="text-slate-400">Status Terkini:</div>
                <div>{getStatusBadge(selectedReq.status)}</div>
              </div>
            </div>

            {selectedReq.fileUrl && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">Lampiran Scan Dokumen Fisik:</div>
                <div className="border border-slate-800 rounded-xl p-3 bg-slate-950 text-center">
                  <img 
                    src={selectedReq.fileUrl} 
                    alt="Scan Dokumen Asli" 
                    className="max-h-64 max-w-full rounded object-contain mx-auto"
                  />
                </div>
              </div>
            )}

            <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs space-y-1">
              <div className="text-slate-400">Keperluan Pengesahan:</div>
              <div className="text-slate-200 font-semibold">{selectedReq.purpose}</div>
              {selectedReq.destinationInstitution && (
                <div className="text-slate-400">Tujuan: {selectedReq.destinationInstitution}</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedReq)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Tanda Terima</span>
                </button>

                <button
                  type="button"
                  onClick={() => executeAdminAction(() => handlePrintCertificate(selectedReq))}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  title={!isCurrentAdmin ? "Khusus Admin TU" : ""}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Surat Pengesahan</span>
                  {!isCurrentAdmin && <Lock className="w-3 h-3 text-indigo-300" />}
                </button>

                <button
                  type="button"
                  onClick={() => executeAdminAction(() => handlePrintStampLabels(selectedReq))}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                  title={!isCurrentAdmin ? "Khusus Admin TU" : ""}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Label Stempel</span>
                  {!isCurrentAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => executeAdminAction(() => {
                    setViewDetailModal(false);
                    handleOpenStatusModal(selectedReq);
                  })}
                  className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-500/30"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Ubah Status</span>
                  {!isCurrentAdmin && <Lock className="w-3 h-3" />}
                </button>

                {isCurrentAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(selectedReq)}
                    className="px-3 py-2 bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-800/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewDetailModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin PIN Quick Authentication Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => {
          setIsAdminPinModalOpen(false);
          setPendingAdminAction(null);
        }}
        onSuccess={handleAdminAuthSuccess}
        title="Verifikasi Akses Admin Loket TU"
        subtitle="Fitur Aksi Layanan (Verifikasi berkas, Update status, Cetak surat pengesahan resmi & label stempel) diproteksi khusus Petugas Tata Usaha. Masukkan PIN Admin."
      />

      {/* Mobile Bottom Navigation for Standalone Legalisir (Public Mode) */}
      {!isAdmin && (
        <nav 
          id="legalisir-mobile-bottom-nav"
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0A0E1A]/94 backdrop-blur-2xl border-t border-slate-800/90 shadow-[0_-10px_35px_rgba(0,0,0,0.85)] pb-[env(safe-area-inset-bottom)] print:hidden select-none"
        >
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent"></div>
          <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around relative">
            <button
              type="button"
              onClick={() => {
                setActiveTab('form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all text-[10px] min-w-[56px] ${
                activeTab === 'form' ? "text-indigo-400 font-bold bg-indigo-500/15" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-5 h-5 mb-0.5" />
              <span>Formulir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('tracking');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all text-[10px] min-w-[56px] ${
                activeTab === 'tracking' ? "text-indigo-400 font-bold bg-indigo-500/15" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Search className="w-5 h-5 mb-0.5" />
              <span>Lacak</span>
            </button>

            {/* Center Home Link */}
            <Link
              to="/"
              className="flex flex-col items-center justify-center -mt-4 py-1.5 px-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-950/70 border border-indigo-400/40 min-w-[60px] active:scale-95 transition-transform"
              title="Kembali ke Beranda Surat (Portal 1)"
            >
              <Sparkles className="w-4 h-4 mb-0.5 text-amber-200" />
              <span className="text-[10px] font-bold">Portal 1</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setActiveTab('guide');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all text-[10px] min-w-[56px] ${
                activeTab === 'guide' ? "text-indigo-400 font-bold bg-indigo-500/15" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <HelpCircle className="w-5 h-5 mb-0.5" />
              <span>Alur</span>
            </button>

            {isCurrentAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all text-[10px] min-w-[56px] ${
                  activeTab === 'admin' ? "text-amber-400 font-bold bg-amber-500/15" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-5 h-5 mb-0.5 text-amber-400" />
                <span>Loket TU</span>
              </button>
            ) : (
              <div className="flex items-center justify-center px-1">
                <SecretAdminMarker
                  variant="dot"
                  onTrigger={() => {
                    executeAdminAction(() => {
                      setActiveTab('admin');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                  }}
                />
              </div>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
