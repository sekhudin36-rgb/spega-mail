import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Letter, COMMON_LETTER_CODES, seedCompleteSchoolData } from '../lib/db';
import { Search, Plus, Archive, X, FileText, ArrowDownRight, ArrowUpRight, Download, Upload, Printer, FileSpreadsheet, FileIcon, Bookmark, ClipboardCheck, Edit, Trash, Trash2, Eye, Filter, Sparkles, QrCode as QrCodeIcon, CheckCircle2, Cloud, Database, AlertCircle, ShieldCheck, MessageCircle, Users, Briefcase, Phone, Layers, Hash, Tag, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { useConfirm } from '../components/ConfirmProvider';
import LetterTemplateWizard from '../components/LetterTemplateWizard';
import GoogleDriveModal from '../components/GoogleDriveModal';
import GoogleDriveDatabaseModal from '../components/GoogleDriveDatabaseModal';
import PrintPreviewModal from '../components/PrintPreviewModal';
import QuickAgendaModal from '../components/QuickAgendaModal';
import CanvaPosterModal from '../components/CanvaPosterModal';
import { triggerBackgroundDriveDatabaseSync } from '../lib/googleDriveDatabase';
import { 
  getSchoolConfig, 
  generateDisposisiHTML, 
  generateKartuKendaliHTML, 
  generateAgendaReportHTML, 
  exportAgendaReportPDF,
  generateOfficialLetterHTML,
  generateOfficialLetterPDF,
  downloadLetterDocument,
  generateSuratPermohonanHTML,
  generateSuratDinasResmiHTML,
  generateCombinedDraftHTML,
  generateSuratPermohonanPDF,
  generateSuratDinasResmiPDF,
  generateCombinedDraftPDF,
  generateAgendaSlipHTML
} from '../lib/printHelper';
import { 
  getLatestAgendaInfo, 
  getTemplateClassification, 
  buildOfficialLetterNumber 
} from '../lib/agendaHelper';
import { isAutoSyncEnabled, getGoogleAccessToken, uploadLetterToGoogleDrive } from '../lib/googleDrive';

const LETTER_CATEGORIES = [
  'Kepegawaian', 'Kesiswaan', 'Keuangan', 'Kurikulum', 
  'Sarana Prasarana', 'Persuratan (SK/Tugas)', 'Sertifikat / Piagam', 'Laporan & Jurnal', 'Aset & Inventaris', 'Lainnya'
];

export default function Letters() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'inbox' | 'outbox' | 'guru_wali'>('all'); // essentially "Jenis Surat"
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [viewingLetter, setViewingLetter] = useState<Letter | null>(null);
  const [viewingQrUrl, setViewingQrUrl] = useState<string>('');
  const [formLetterType, setFormLetterType] = useState<'inbox' | 'outbox'>('inbox');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isDriveDbModalOpen, setIsDriveDbModalOpen] = useState(false);
  const [driveModalLetter, setDriveModalLetter] = useState<Letter | null>(null);
  const [driveModalMode, setDriveModalMode] = useState<'single' | 'batch' | 'syncAll'>('single');
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    htmlContent: string;
    orientation?: 'landscape' | 'portrait';
    onDownloadPdf?: () => void;
    onDownloadWord?: () => void;
  }>({
    isOpen: false,
    title: '',
    htmlContent: '',
    orientation: 'portrait'
  });

  const [numberAssignModal, setNumberAssignModal] = useState<{
    isOpen: boolean;
    letter: Letter | null;
    newRefNumber: string;
    newDocumentDate: string;
    autoApprove: boolean;
    autoPrint: boolean;
  }>({
    isOpen: false,
    letter: null,
    newRefNumber: '',
    newDocumentDate: format(new Date(), 'yyyy-MM-dd'),
    autoApprove: true,
    autoPrint: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm } = useConfirm();

  const handleOpenDriveModalSingle = (letter: Letter) => {
    setDriveModalLetter(letter);
    setDriveModalMode('single');
    setIsDriveModalOpen(true);
  };

  const handleOpenDriveModalBatch = () => {
    if (selectedIds.length === 0) return;
    setDriveModalMode('batch');
    setIsDriveModalOpen(true);
  };

  useEffect(() => {
    if (viewingLetter) {
      const qrData = `VERIFIKASI-SPEGA:${viewingLetter.referenceNumber}|TGL:${viewingLetter.date}|${viewingLetter.title}|SMPN3-KRAS`;
      QRCode.toDataURL(qrData, { width: 120, margin: 1, color: { dark: '#0F172A', light: '#FFFFFF' } })
        .then(url => setViewingQrUrl(url))
        .catch(() => setViewingQrUrl(''));
    } else {
      setViewingQrUrl('');
    }
  }, [viewingLetter]);

  const rawLetters = useLiveQuery(() => db.letters.toArray()) || [];
  const teachers = useLiveQuery(() => db.teachers.toArray()) || [];
  const [isQuickAgendaModalOpen, setIsQuickAgendaModalOpen] = useState(false);
  const [isCanvaModalOpen, setIsCanvaModalOpen] = useState(false);

  // Hitung nomor urut agenda surat keluar terakhir & berikutnya secara otomatis
  const outboxAgenda = getLatestAgendaInfo(rawLetters, 'outbox');

  const handlePrintAgendaSlipDirect = (letter: Letter) => {
    const slipHtml = generateAgendaSlipHTML(letter);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bukti Registrasi Nomor Agenda - ${letter.referenceNumber}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: 'Times New Roman', Times, serif; }
              @media print {
                body { padding: 0; }
                @page { margin: 1.5cm; }
              }
            </style>
          </head>
          <body>
            ${slipHtml}
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const getNextSequenceNumber = (type: 'inbox' | 'outbox') => {
    return getLatestAgendaInfo(rawLetters, type).formattedNext;
  };

  const handleOpenNumberAssignModal = (letter: Letter, autoPrint: boolean = true) => {
    const currentYear = new Date().getFullYear();
    const agendaInfo = getLatestAgendaInfo(rawLetters, 'outbox');
    const nextSeq = agendaInfo.formattedNext;
    const templateConfig = getTemplateClassification(letter.templateType || '');

    let initialRef = letter.referenceNumber || '';
    if (!initialRef || initialRef.includes('DRAF') || initialRef.includes('....') || initialRef.includes('421/DRAF/')) {
      initialRef = buildOfficialLetterNumber(templateConfig.code, nextSeq, templateConfig.instansiCode, currentYear);
    }

    setNumberAssignModal({
      isOpen: true,
      letter,
      newRefNumber: initialRef,
      newDocumentDate: letter.documentDate || letter.date || format(new Date(), 'yyyy-MM-dd'),
      autoApprove: true,
      autoPrint
    });
  };

  const handleSaveAssignedNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numberAssignModal.letter || !numberAssignModal.letter.id) return;
    const finalNumber = numberAssignModal.newRefNumber.trim();
    if (!finalNumber) {
      toast.error('Silakan isi nomor surat resmi');
      return;
    }

    try {
      const targetLetter = numberAssignModal.letter;
      let extractedSeq = '';
      const match = finalNumber.match(/\/(?:DRAF-)?(\d{1,4})\//);
      if (match && match[1]) {
        extractedSeq = match[1];
      }

      const updatedData: Partial<Letter> = {
        referenceNumber: finalNumber,
        sequenceNumber: extractedSeq || targetLetter.sequenceNumber || outboxAgenda.formattedNext,
        code: finalNumber.split('/')[0] || targetLetter.code || '420.3',
        documentDate: numberAssignModal.newDocumentDate,
        date: numberAssignModal.newDocumentDate,
        submissionStatus: numberAssignModal.autoApprove ? 'approved' : targetLetter.submissionStatus,
        isDraft: false,
        status: 'active'
      };

      await db.letters.update(targetLetter.id, updatedData);
      
      // Update viewing modal if open
      const updatedLetter: Letter = { ...targetLetter, ...updatedData } as Letter;
      setViewingLetter(prev => prev && prev.id === targetLetter.id ? updatedLetter : prev);

      // Auto archive synchronization
      const existingArchive = await db.archives.where('referenceNumber').equals(targetLetter.referenceNumber).first();
      if (existingArchive && existingArchive.id) {
        await db.archives.update(existingArchive.id, {
          referenceNumber: finalNumber,
          date: numberAssignModal.newDocumentDate,
          status: 'Aktif'
        });
      } else {
        await db.archives.add({
          title: targetLetter.title,
          classificationCode: targetLetter.code || '420.3',
          category: targetLetter.category || 'Persuratan (SK/Tugas)',
          referenceNumber: finalNumber,
          date: numberAssignModal.newDocumentDate,
          developmentLevel: 'Asli',
          amount: targetLetter.attachment || '1 Berkas',
          condition: 'Baik',
          storageLocation: targetLetter.type === 'inbox' ? 'Lemari Surat Masuk' : 'Lemari Surat Keluar',
          status: 'Aktif',
          description: targetLetter.description || `Surat resmi ${targetLetter.title}`,
          createdAt: new Date().toISOString()
        });
      }

      // Catat di System Logs
      await db.systemLogs.add({
        timestamp: new Date().toISOString(),
        action: 'Penetapan Nomor Surat',
        category: 'Persuratan',
        level: 'info',
        user: 'Admin Tata Usaha',
        details: `Nomor surat '${targetLetter.title}' resmi ditetapkan menjadi ${finalNumber} (Agenda #${updatedData.sequenceNumber}).`
      });

      setNumberAssignModal(prev => ({ ...prev, isOpen: false, letter: null }));
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      toast.success(`Nomor surat resmi "${finalNumber}" (Agenda #${updatedData.sequenceNumber}) berhasil ditetapkan & disetujui!`);

      if (numberAssignModal.autoPrint) {
        await handlePreviewOfficialLetter(updatedLetter, 'resmi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menetapkan nomor surat');
    }
  };

  const handleBatchRegisterPendingSubmissions = async () => {
    const pendingSubmissions = rawLetters.filter(l => 
      (l.source === 'portal_guru_wali' || Boolean(l.applicantName)) && 
      l.submissionStatus === 'pending_approval'
    ).sort((a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime());

    if (pendingSubmissions.length === 0) {
      toast('Tidak ada permohonan surat guru/wali yang berstatus pending.', { icon: 'ℹ️' });
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      let currentSeqNumber = outboxAgenda.nextSeq;
      let count = 0;

      for (const letter of pendingSubmissions) {
        if (!letter.id) continue;
        const seqStr = String(currentSeqNumber).padStart(3, '0');
        const cls = getTemplateClassification(letter.templateType || '');
        
        let officialRef = letter.referenceNumber;
        if (!officialRef || officialRef.includes('DRAF') || !officialRef.includes('/')) {
          officialRef = buildOfficialLetterNumber(cls.code, seqStr, cls.instansiCode, currentYear);
        }

        await db.letters.update(letter.id, {
          referenceNumber: officialRef,
          sequenceNumber: seqStr,
          code: officialRef.split('/')[0] || cls.code,
          submissionStatus: 'approved',
          isDraft: false,
          status: 'active'
        });

        // Log ke Riwayat Sistem
        await db.systemLogs.add({
          timestamp: new Date().toISOString(),
          action: 'Persetujuan & Registrasi Agenda',
          category: 'Persuratan',
          level: 'info',
          user: 'Admin Tata Usaha',
          details: `Pengajuan '${letter.title}' dari ${letter.applicantName} disetujui & diregistrasi dengan No. Agenda #${seqStr} (${officialRef}).`
        });

        currentSeqNumber++;
        count++;
      }

      confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
      toast.success(`Berhasil meregistrasi nomor agenda otomatis & menerbitkan ${count} permohonan surat!`, { duration: 6000 });
    } catch (err) {
      console.error(err);
      toast.error('Gagal meregistrasi agenda otomatis');
    }
  };
  
  const handleApproveSubmission = async (letter: Letter, autoPrint: boolean = false) => {
    if (!letter.id) return;
    
    // If the letter has a temporary draft number or is a portal submission, open the number assignment modal for Admin
    if (
      letter.referenceNumber.includes('DRAF') || 
      letter.referenceNumber.includes('....') || 
      letter.source === 'portal_guru_wali' ||
      letter.submissionStatus === 'pending_approval'
    ) {
      handleOpenNumberAssignModal(letter, autoPrint);
      return;
    }

    try {
      const updatedData: Partial<Letter> = {
        submissionStatus: 'approved',
        isDraft: false,
        status: 'active'
      };
      
      await db.letters.update(letter.id, updatedData);
      const updatedLetter = { ...letter, ...updatedData };
      setViewingLetter(prev => prev && prev.id === letter.id ? updatedLetter : prev);
      
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      toast.success('Draf pengajuan surat telah disetujui & resmi diterbitkan!');

      if (autoPrint) {
        // Automatically open official letter print preview for Admin
        await handlePreviewOfficialLetter(updatedLetter, 'resmi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui status verifikasi');
    }
  };
  
  const handleSeedData = async () => {
    try {
      const result = await seedCompleteSchoolData(false);
      if (result.lettersCount > 0 || result.archivesCount > 0) {
        toast.success(`Berhasil memuat ${result.lettersCount} surat dan ${result.archivesCount} arsip resmi!`);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } else {
        toast.success('Semua data register surat & arsip resmi sekolah sudah lengkap!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui data surat & arsip');
    }
  };

  const availableYears = Array.from(new Set(rawLetters.map(a => new Date(a.date).getFullYear().toString()))).sort((a,b)=>b.localeCompare(a));

  const letters = rawLetters
    .filter(a => {
      const matchSearch = search ? (
        a.title.toLowerCase().includes(search.toLowerCase()) || 
        a.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
        a.senderOrRecipient.toLowerCase().includes(search.toLowerCase()) ||
        (a.applicantName && a.applicantName.toLowerCase().includes(search.toLowerCase())) ||
        (a.applicantPhone && a.applicantPhone.includes(search))
      ) : true;
      const matchType = filterType === 'all' 
        ? true 
        : filterType === 'guru_wali'
          ? (a.source === 'portal_guru_wali' || Boolean(a.applicantName))
          : a.type === filterType;
      const matchCategory = selectedCategory === 'all' || a.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || (a.status || 'active') === selectedStatus;
      const matchYear = selectedYear === 'all' || new Date(a.date).getFullYear().toString() === selectedYear;
      return matchSearch && matchType && matchCategory && matchStatus && matchYear;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
      return 0;
    });

  const handleSaveLetter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      type: formData.get('type') as 'inbox' | 'outbox',
      category: formData.get('category') as string || '',
      referenceNumber: formData.get('referenceNumber') as string,
      title: formData.get('title') as string,
      senderOrRecipient: formData.get('senderOrRecipient') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      indexData: formData.get('indexData') as string || '',
      sequenceNumber: formData.get('sequenceNumber') as string || '',
      code: formData.get('code') as string || '',
      attachment: formData.get('attachment') as string || '',
      documentDate: formData.get('documentDate') as string || '',
      addressedTo: formData.get('addressedTo') as string || '',
      disposition: formData.get('disposition') as string || '',
      urgency: formData.get('urgency') as string || 'Biasa',
      securityStyle: formData.get('securityStyle') as string || 'Biasa',
      processingUnit: formData.get('processingUnit') as string || '',
      receivedBy: formData.get('receivedBy') as string || '',
      status: editingLetter ? editingLetter.status : 'active',
      createdAt: editingLetter ? editingLetter.createdAt : new Date().toISOString()
    };

    if (editingLetter && editingLetter.id) {
      await db.letters.update(editingLetter.id, data as Letter);
      toast.success('Berhasil memperbarui data surat');
      triggerBackgroundDriveDatabaseSync();
    } else {
      await db.letters.add(data as Letter);
      
      // Secara otomatis menambahkan data surat baru ke dalam Arsip Dokumen
      const archiveData = {
        title: data.title,
        classificationCode: data.code,
        category: data.category || 'Persuratan (SK/Tugas)',
        referenceNumber: data.referenceNumber,
        date: data.date,
        developmentLevel: 'Asli',
        amount: data.attachment ? data.attachment : '1 Berkas',
        condition: 'Baik',
        storageLocation: data.type === 'inbox' ? 'Lemari Surat Masuk' : 'Lemari Surat Keluar',
        status: 'Aktif',
        description: data.description || `Surat ${data.type === 'inbox' ? 'Masuk' : 'Keluar'} dari/ke ${data.senderOrRecipient}`,
        createdAt: new Date().toISOString()
      };
      await db.archives.add(archiveData);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      toast.success('Surat baru berhasil diregistrasi & diarsipkan');

      // Sinkronisasi database ke Google Drive
      triggerBackgroundDriveDatabaseSync();

      // Auto-sync ke Google Drive jika diaktifkan di Pengaturan
      if (isAutoSyncEnabled()) {
        getGoogleAccessToken().then(tok => {
          if (tok) {
            uploadLetterToGoogleDrive(data as Letter, tok)
              .then(res => {
                toast.success(`Tersimpan ke Google Drive: ${res.folderName}`, { icon: '☁️' });
              })
              .catch(err => {
                console.warn('Auto-sync ke Google Drive dilewati:', err);
              });
          }
        });
      }
    }
    
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLetter(null);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    const isConfirmed = await confirm({
      title: 'Hapus Dokumen Surat',
      message: 'Apakah Anda yakin ingin menghapus dokumen surat ini secara permanen?',
      confirmLabel: 'Hapus',
      variant: 'danger'
    });
    if (isConfirmed) {
      await db.letters.delete(id);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      toast.success('Dokumen surat berhasil dihapus');
      triggerBackgroundDriveDatabaseSync();
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const isConfirmed = await confirm({
      title: 'Hapus Surat Terpilih',
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} dokumen surat yang dipilih secara permanen?`,
      confirmLabel: 'Hapus Semua',
      variant: 'danger'
    });
    if (isConfirmed) {
      await db.letters.bulkDelete(selectedIds);
      setSelectedIds([]);
      toast.success(`${selectedIds.length} dokumen surat berhasil dihapus`);
      triggerBackgroundDriveDatabaseSync();
    }
  };

  const toggleSelectAll = () => {
    if (letters && selectedIds.length === letters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(letters?.map(l => l.id as number) || []);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleEditClick = (letter: Letter) => {
    setEditingLetter(letter);
    setFormLetterType(letter.type);
    setIsModalOpen(true);
  };

  const handleDownloadLetterDocument = async (letter: Letter) => {
    try {
      toast.loading('Menyiapkan file dokumen surat...', { id: 'dl-letter' });
      await downloadLetterDocument(letter);
      toast.success(`Dokumen "${letter.title}" berhasil diunduh!`, { id: 'dl-letter' });
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh dokumen surat', { id: 'dl-letter' });
    }
  };

  const handlePreviewOfficialLetter = async (letter: Letter, docType: 'resmi' | 'permohonan' | 'combined' = 'resmi') => {
    try {
      const config = getSchoolConfig();
      const isDraftSubmission = letter.source === 'portal_guru_wali' || letter.isDraft;
      
      let htmlContent = '';
      let title = '';
      let subtitle = '';

      if (isDraftSubmission) {
        if (docType === 'permohonan') {
          htmlContent = generateSuratPermohonanHTML(letter, config);
          title = `Naskah Surat Permohonan - ${letter.referenceNumber}`;
          subtitle = `Pengajuan oleh: ${letter.applicantName || letter.receivedBy || 'Guru / Wali'} (${letter.applicantPhone || '-'}) • ${letter.title}`;
        } else if (docType === 'resmi') {
          htmlContent = await generateSuratDinasResmiHTML(letter, config, teachers);
          title = `Naskah Surat Resmi Sekolah - ${letter.referenceNumber}`;
          subtitle = `Dokumen Resmi SMPN 3 Kras • Ditujukan ke: ${letter.senderOrRecipient} • Status: ${letter.submissionStatus === 'approved' ? 'Disetujui' : 'Draf Resmi'}`;
        } else {
          htmlContent = await generateCombinedDraftHTML(letter, config, teachers);
          title = `Paket Draf Lengkap (Permohonan & Surat Resmi) - ${letter.referenceNumber}`;
          subtitle = `Pengajuan oleh: ${letter.applicantName || letter.receivedBy || 'Guru / Wali'} (${letter.applicantPhone || '-'}) • ${letter.title}`;
        }
      } else {
        htmlContent = await generateOfficialLetterHTML(letter, config, teachers);
        title = `Naskah Surat Resmi - ${letter.referenceNumber}`;
        subtitle = `${letter.title} (${letter.type === 'inbox' ? 'Surat Masuk' : 'Surat Keluar'})`;
      }

      setPrintModalState({
        isOpen: true,
        title,
        subtitle,
        htmlContent,
        onDownloadPdf: async () => {
          if (isDraftSubmission) {
            if (docType === 'permohonan') {
              generateSuratPermohonanPDF(letter, config);
              toast.success('Surat Permohonan (PDF) berhasil diunduh');
            } else if (docType === 'resmi') {
              await generateSuratDinasResmiPDF(letter, config, true, teachers);
              toast.success('Surat Dinas Resmi Sekolah (PDF) berhasil diunduh');
            } else {
              await generateCombinedDraftPDF(letter, config, teachers);
              toast.success('Paket Draf Lengkap (PDF) berhasil diunduh');
            }
          } else {
            handleDownloadLetterDocument(letter);
          }
        },
        onDownloadWord: () => {
          const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${isDraftSubmission ? (docType === 'permohonan' ? 'Surat_Permohonan' : 'Surat_Resmi') : 'Surat_Resmi'}_${(letter.referenceNumber || 'Dinas').replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('Naskah surat berhasil diekspor ke Word');
        }
      });
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat pratinjau surat resmi');
    }
  };

  const toggleArchive = async (letter: Letter) => {
    if (!letter.id) return;
    const newStatus = letter.status === 'active' ? 'archived' : 'active';
    await db.letters.update(letter.id, {
      status: newStatus
    });
    toast.success(newStatus === 'archived' ? 'Surat berhasil dipindahkan ke arsip' : 'Surat berhasil diaktifkan kembali');
  };

  const handleExport = async () => {
    try {
      const allData = await db.letters.toArray();
      const json = JSON.stringify(allData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-surat-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Gagal mengekspor data.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExtension === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          const itemsToImport = data.map(item => {
            const { id, ...rest } = item;
            return rest;
          });
          await db.letters.bulkAdd(itemsToImport as Letter[]);

          // Tambah juga data impor ke dalam Arsip Dokumen
          const archivesToImport = itemsToImport.map(data => ({
            title: data.title,
            classificationCode: data.code,
            category: data.category || 'Persuratan (SK/Tugas)',
            referenceNumber: data.referenceNumber,
            date: data.date,
            developmentLevel: 'Asli',
            amount: data.attachment ? data.attachment : '1 Berkas',
            condition: 'Baik',
            storageLocation: data.type === 'inbox' ? 'Lemari Surat Masuk' : 'Lemari Surat Keluar',
            status: 'Aktif',
            description: data.description || `Surat ${data.type === 'inbox' ? 'Masuk' : 'Keluar'} dari/ke ${data.senderOrRecipient}`,
            createdAt: new Date().toISOString()
          }));
          await db.archives.bulkAdd(archivesToImport);

          alert('Data surat berhasil diimpor!');
        } else {
          alert('Format file JSON tidak valid. Harap gunakan file hasil ekspor sistem.');
        }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<any>(worksheet);
        
        if (Array.isArray(data) && data.length > 0) {
          const itemsToImport = data.map(item => ({
            referenceNumber: item['No. Referensi'] || item.referenceNumber || `IMP-${Math.floor(Math.random() * 1000)}`,
            title: item['Perihal'] || item.title || 'Dokumen Impor Kelompok',
            category: item['Kategori'] || item.category || '',
            senderOrRecipient: item['Pengirim/Penerima'] || item.senderOrRecipient || '-',
            date: item['Tanggal'] ? new Date(item['Tanggal']).toISOString() : new Date().toISOString(),
            type: (item['Tipe']?.toLowerCase() === 'keluar' || item.type === 'outbox') ? 'outbox' : 'inbox',
            status: (item['Status']?.toLowerCase() === 'arsip' || item.status === 'archived') ? 'archived' : 'active',
            description: item['Keterangan'] || item.description || '',
            indexData: item['Indeks'] || item.indexData || '',
            sequenceNumber: item['No. Urut'] || item.sequenceNumber || '',
            code: item['Kode'] || item.code || '',
            attachment: item['Lampiran'] || item.attachment || '',
            documentDate: item['Tanggal Surat'] ? new Date(item['Tanggal Surat']).toISOString() : (item['Tanggal Naskah'] ? new Date(item['Tanggal Naskah']).toISOString() : ''),
            addressedTo: item['Ditujukan'] || item.addressedTo || '',
            disposition: item['Disposisi'] || item.disposition || ''
          }));
          await db.letters.bulkAdd(itemsToImport as Letter[]);

          // Tambah juga data impor ke dalam Arsip Dokumen
          const archivesToImport = itemsToImport.map(data => ({
            title: data.title,
            classificationCode: data.code,
            category: data.category || 'Persuratan (SK/Tugas)',
            referenceNumber: data.referenceNumber,
            date: data.date,
            developmentLevel: 'Asli',
            amount: data.attachment ? data.attachment : '1 Berkas',
            condition: 'Baik',
            storageLocation: data.type === 'inbox' ? 'Lemari Surat Masuk' : 'Lemari Surat Keluar',
            status: 'Aktif',
            description: data.description || `Surat ${data.type === 'inbox' ? 'Masuk' : 'Keluar'} dari/ke ${data.senderOrRecipient}`,
            createdAt: new Date().toISOString()
          }));
          await db.archives.bulkAdd(archivesToImport);

          alert('Data surat berhasil diimpor massal dari file Excel!');
        } else {
          alert('Data tabel Excel kosong atau tidak sesuai dengan spesifikasi kolom/template.');
        }
      } else if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
        alert(`Tipe Format [${fileExtension.toUpperCase()}] Terdeteksi! \\n\\nFitur Parsing terstruktur dari Word dan PDF belum stabil secara lokal karena perbedaan layout paragraf yang drastis. \\nSilakan konversi (Save As) dokumen tersebut ke wujud tabel Excel (.xlsx) sebelum melakukan impor agar datanya tidak rusak dan dapat terbaca sempurna oleh database.`);
      } else {
         alert('Format lampiran tersebut tidak didukung oleh prosesor ini.');
      }
    } catch (error) {
      console.error('Failed to import:', error);
      alert('Terjadi kesalahan parsial saat membedah data impor.');
    } finally {
      if (e.target) e.target.value = ''; // reset file input
    }
  };

  const handlePrint = async () => {
    try {
      const dataToPrint = letters && letters.length > 0 ? letters : await db.letters.toArray();
      if (dataToPrint.length === 0) {
        toast.error('Tidak ada data surat untuk dicetak');
        return;
      }
      const typeLabel = filterType === 'inbox' ? 'Surat Masuk' : filterType === 'outbox' ? 'Surat Keluar' : 'Seluruh Arsip & Surat';
      const repType = filterType === 'outbox' ? 'outbox' : 'inbox';
      const startDate = dataToPrint[dataToPrint.length - 1]?.date ? new Date(dataToPrint[dataToPrint.length - 1].date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const htmlContent = generateAgendaReportHTML(repType, dataToPrint, startDate, endDate);

      setPrintModalState({
        isOpen: true,
        title: `Rekapitulasi Daftar ${typeLabel}`,
        subtitle: `Pratinjau Cetak Resmi (${dataToPrint.length} Dokumen)`,
        htmlContent,
        onDownloadPdf: () => {
          exportAgendaReportPDF(repType, dataToPrint, startDate, endDate);
          toast.success('Rekap surat berhasil diunduh (PDF)');
        },
        onDownloadWord: () => {
          const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Rekap_${typeLabel.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.doc`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('Rekap surat berhasil diekspor ke Word');
        }
      });
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyiapkan pratinjau cetak');
    }
  };

  const handleExportExcel = async () => {
    try {
      const allData = await db.letters.toArray();
      const formattedData = allData.map(item => ({
        'No. Referensi': item.referenceNumber,
        'Perihal': item.title,
        'Kategori': item.category || '-',
        'Pengirim/Penerima': item.senderOrRecipient,
        'Tanggal': format(new Date(item.date), 'dd MMM yyyy', { locale: id }),
        'Tipe': item.type === 'inbox' ? 'Masuk' : 'Keluar',
        'Status': item.status === 'active' ? 'Aktif' : 'Arsip',
        'Keterangan': item.description || '-',
        'Indeks': item.indexData || '-',
        'No. Urut': item.sequenceNumber || '-',
        'Kode': item.code || '-',
        'Lampiran': item.attachment || '-',
        'Tanggal Surat': item.documentDate ? format(new Date(item.documentDate), 'dd MMM yyyy', { locale: id }) : '-',
        'Ditujukan': item.addressedTo || '-',
        'Disposisi': item.disposition || '-'
      }));
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Surat");
      XLSX.writeFile(workbook, `Rekap_Surat_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (e) {
      console.error(e);
      alert('Gagal mengekspor Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      const allData = await db.letters.toArray();
      const doc = new jsPDF();
      doc.text("Daftar Surat & Arsip", 14, 15);
      const tableColumn = ["No. Referensi", "Perihal", "Kategori", "Pengirim/Penerima", "Tanggal", "Tipe", "Status"];
      const tableRows: any = [];
      allData.forEach(item => {
        tableRows.push([
          item.referenceNumber,
          item.title,
          item.category || '-',
          item.senderOrRecipient,
          format(new Date(item.date), 'dd MMM yyyy', { locale: id }),
          item.type === 'inbox' ? 'Masuk' : 'Keluar',
          item.status === 'active' ? 'Aktif' : 'Arsip'
        ]);
      });
      autoTable(doc, { 
        head: [tableColumn], 
        body: tableRows, 
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [14, 165, 233] },
      });
      doc.save(`Rekap_Surat_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Gagal mengekspor PDF');
    }
  };

  const handleExportWord = async () => {
    try {
      const allData = await db.letters.toArray();
      let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Daftar Surat & Arsip</title></head><body>
        <h1>Daftar Surat & Arsip</h1>
        <table border="1" style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr>
              <th>No. Referensi</th>
              <th>Perihal</th>
              <th>Kategori</th>
              <th>Pengirim/Penerima</th>
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;
      allData.forEach(item => {
        htmlContent += `
          <tr>
            <td>${item.referenceNumber}</td>
            <td>${item.title}</td>
            <td>${item.category || '-'}</td>
            <td>${item.senderOrRecipient}</td>
            <td>${format(new Date(item.date), 'dd MMM yyyy', { locale: id })}</td>
            <td>${item.type === 'inbox' ? 'Masuk' : 'Keluar'}</td>
            <td>${item.status === 'active' ? 'Aktif' : 'Arsip'}</td>
          </tr>
        `;
      });
      htmlContent += `</tbody></table></body></html>`;
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rekap_Surat_${format(new Date(), 'yyyy-MM-dd')}.doc`;
      link.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      console.error(e);
      alert('Gagal mengekspor Word');
    }
  };

  const generateKendaliPDFDoc = (letter: Letter) => {
    const config = getSchoolConfig();
    const doc = new jsPDF('p', 'mm', 'a4');
    const copies = ["Lembar 1 (Putih) - Untuk Unit Pengolah", "Lembar 2 (Kuning) - Untuk Penata Arsip / TU", "Lembar 3 (Merah Muda) - Untuk Pengirim"];
    
    for (let i = 0; i < 3; i++) {
      const offsetY = i * 98;
      if (i < 2) {
        doc.setLineDashPattern([2, 2], 0);
        doc.setDrawColor(180);
        doc.line(0, 98 + offsetY, 210, 98 + offsetY);
        doc.setLineDashPattern([], 0);
        doc.setDrawColor(0);
      }

      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(copies[i], 195, 4.5 + offsetY, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      
      const kopLines = (config.schoolKop || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN').toUpperCase().split('\n');
      doc.text(kopLines[0], 105, 8.5 + offsetY, { align: "center" });
      if (kopLines.length > 1) {
        doc.text(kopLines[1], 105, 12 + offsetY, { align: "center" });
      }

      doc.setFontSize(9.5);
      doc.text((config.schoolName || 'SMP NEGERI 1 NGASEM').toUpperCase(), 105, 15.8 + offsetY, { align: "center" });
      
      doc.setLineWidth(0.6);
      doc.line(12, 18 + offsetY, 198, 18 + offsetY);
      doc.setLineWidth(0.2);
      doc.line(12, 18.8 + offsetY, 198, 18.8 + offsetY);
      
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.text(`KARTU KENDALI ${letter.type === 'inbox' ? 'SURAT MASUK' : 'SURAT KELUAR'}`, 105, 23 + offsetY, { align: "center" });
      
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.rect(12, 25.5 + offsetY, 186, 49); 
      
      // Horizontal dividers
      doc.line(12, 34 + offsetY, 198, 34 + offsetY);
      doc.line(12, 45 + offsetY, 198, 45 + offsetY);
      doc.line(12, 54 + offsetY, 198, 54 + offsetY);
      doc.line(12, 63 + offsetY, 198, 63 + offsetY);
      
      // Vertical dividers
      doc.line(75, 25.5 + offsetY, 75, 34 + offsetY);
      doc.line(135, 25.5 + offsetY, 135, 34 + offsetY);
      doc.line(105, 45 + offsetY, 105, 74.5 + offsetY);
      
      // Row 1: Indeks, Kode, No Urut
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("INDEKS / SUB MASALAH:", 14, 28 + offsetY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(letter.indexData || (letter.type === 'inbox' ? 'Umum / Masuk' : 'Surat Keluar'), 14, 32 + offsetY, { maxWidth: 58 });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("KODE KLASIFIKASI:", 77, 28 + offsetY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(letter.code || "-", 77, 32 + offsetY);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("NO. URUT / AGENDA:", 137, 28 + offsetY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(letter.sequenceNumber || "-", 137, 32 + offsetY);
      
      // Row 2: Isi Ringkas
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("ISI RINGKAS (PERIHAL):", 14, 37 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(letter.title || "-", 14, 41 + offsetY, { maxWidth: 182 });
      
      // Row 3: Pengirim/Tujuan & No/Tgl Surat
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      const termSenderRecipient = letter.type === 'inbox' ? "DARI / PENGIRIM:" : "KEPADA / TUJUAN:";
      doc.text(termSenderRecipient, 14, 48 + offsetY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(letter.senderOrRecipient || "-", 14, 52 + offsetY, { maxWidth: 88 });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("NOMOR & TANGGAL SURAT:", 107, 48 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const docDateStr = letter.documentDate ? format(new Date(letter.documentDate), 'dd MMM yyyy', { locale: id }) : '-';
      doc.text(`${letter.referenceNumber || '-'} (Tgl: ${docDateStr})`, 107, 52 + offsetY, { maxWidth: 88 });
      
      // Row 4: Sifat Keamanan & Tingkat Kecepatan
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("SIFAT KEAMANAN:", 14, 57 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      
      const style = letter.securityStyle || 'Biasa';
      const styleOptions = ["Biasa", "Terbatas", "Rahasia"];
      let xOffset = 14;
      styleOptions.forEach(opt => {
        const isChecked = style === opt;
        doc.rect(xOffset, 59 + offsetY, 2.2, 2.2);
        if (isChecked) {
          doc.setFont("helvetica", "bold");
          doc.text("v", xOffset + 0.4, 60.8 + offsetY);
          doc.setFont("helvetica", "normal");
        }
        doc.text(opt, xOffset + 3.5, 60.8 + offsetY);
        xOffset += 24;
      });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("TINGKAT KECEPATAN & LAMPIRAN:", 107, 57 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      
      const urg = letter.urgency || 'Biasa';
      const urgOptions = ["Biasa", "Segera", "Sgt Segera"];
      let xOffsetUrg = 107;
      urgOptions.forEach(opt => {
        let checkOpt = opt;
        if (opt === 'Sgt Segera') checkOpt = 'Sangat Segera';
        const isChecked = urg === checkOpt;
        doc.rect(xOffsetUrg, 59 + offsetY, 2.2, 2.2);
        if (isChecked) {
          doc.setFont("helvetica", "bold");
          doc.text("v", xOffsetUrg + 0.4, 60.8 + offsetY);
          doc.setFont("helvetica", "normal");
        }
        doc.text(opt, xOffsetUrg + 3.5, 60.8 + offsetY);
        xOffsetUrg += 22;
      });
      doc.text(`• Lamp: ${letter.attachment || '-'}`, xOffsetUrg + 2, 60.8 + offsetY);
      
      // Row 5: Unit Pengolah & Tgl Pencatatan
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("UNIT PENGOLAH:", 14, 66 + offsetY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const unitStr = letter.processingUnit || letter.addressedTo || 'Tata Usaha (TU)';
      doc.text(unitStr, 14, 70.5 + offsetY, { maxWidth: 88 });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      const actionDateTerm = letter.type === 'inbox' ? "TGL DITERUSKAN / PENERIMA:" : "TGL PENCATATAN / PENERIMA:";
      doc.text(actionDateTerm, 107, 66 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const actionDateStr = format(new Date(letter.date), 'dd MMM yyyy', { locale: id });
      const receiverStr = letter.receivedBy || config.adminName || '-';
      doc.text(`${actionDateStr} • Penerima: ${receiverStr}`, 107, 70.5 + offsetY, { maxWidth: 88 });

      // Signatures below card
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text("Penerima / Unit Pengolah,", 55, 78 + offsetY, { align: "center" });
      doc.text("( .................................................... )", 55, 89 + offsetY, { align: "center" });

      doc.text("Penata Arsip / Pengelola Persuratan,", 155, 78 + offsetY, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(config.adminName || 'Admin', 155, 87 + offsetY, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(`NIP. ${config.adminNip || '-'}`, 155, 90 + offsetY, { align: "center" });
    }
    return doc;
  };

  const generateDisposisiPDFDoc = (letter: Letter) => {
    const config = getSchoolConfig();
    const doc = new jsPDF('p', 'mm', 'a4');
    
    for (let i = 0; i < 2; i++) {
      const offsetY = i * 148.5;
      if (i === 1) {
        doc.setLineDashPattern([2, 2], 0);
        doc.setDrawColor(180);
        doc.line(0, 148.5, 210, 148.5);
        doc.setLineDashPattern([], 0);
        doc.setDrawColor(0);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      
      const kopLines = (config.schoolKop || 'PEMERINTAH KABUPATEN KEDIRI\nDINAS PENDIDIKAN').toUpperCase().split('\n');
      doc.text(kopLines[0], 105, 9 + offsetY, { align: "center" });
      if (kopLines.length > 1) {
        doc.text(kopLines[1], 105, 12.5 + offsetY, { align: "center" });
      }

      doc.setFontSize(9.5);
      doc.text((config.schoolName || 'SMP NEGERI 1 NGASEM').toUpperCase(), 105, 16.5 + offsetY, { align: "center" });
      
      doc.setLineWidth(0.6);
      doc.line(12, 19 + offsetY, 198, 19 + offsetY);
      doc.setLineWidth(0.2);
      doc.line(12, 19.8 + offsetY, 198, 19.8 + offsetY);

      doc.setFontSize(11.5);
      doc.setFont("helvetica", "bold");
      doc.text("LEMBAR DISPOSISI SURAT MASUK", 105, 25 + offsetY, { align: "center" });
      
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.rect(12, 27.5 + offsetY, 186, 91);
      
      // Horizontal dividers
      doc.line(12, 36.5 + offsetY, 198, 36.5 + offsetY);
      doc.line(12, 46.5 + offsetY, 198, 46.5 + offsetY);
      doc.line(12, 57.5 + offsetY, 198, 57.5 + offsetY);
      doc.line(12, 66.5 + offsetY, 198, 66.5 + offsetY);
      
      // Vertical dividers
      doc.line(105, 27.5 + offsetY, 105, 46.5 + offsetY);
      doc.line(105, 57.5 + offsetY, 105, 66.5 + offsetY);
      doc.line(105, 66.5 + offsetY, 105, 118.5 + offsetY);
      
      // Row 1: Surat Dari & No Agenda / Tgl Terima
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("SURAT DARI:", 14, 30.5 + offsetY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(letter.senderOrRecipient || "-", 14, 34.5 + offsetY, { maxWidth: 88 });
      
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("NO. AGENDA / URUT:", 107, 30.5 + offsetY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(letter.sequenceNumber || "-", 148, 30.5 + offsetY);
      
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("TANGGAL TERIMA:", 107, 34.5 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const recvDateStr = format(new Date(letter.date), 'dd MMMM yyyy', { locale: id });
      doc.text(recvDateStr, 148, 34.5 + offsetY);
      
      // Row 2: No Surat & Tgl Surat
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("NOMOR SURAT:", 14, 39.5 + offsetY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(letter.referenceNumber || "-", 14, 43.5 + offsetY, { maxWidth: 88 });
      
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("TANGGAL SURAT:", 107, 39.5 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const docDateStr2 = letter.documentDate ? format(new Date(letter.documentDate), 'dd MMMM yyyy', { locale: id }) : '-';
      doc.text(docDateStr2, 107, 43.5 + offsetY);
      
      // Row 3: Perihal
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("PERIHAL (ISI RINGKAS):", 14, 49.5 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(letter.title || "-", 14, 53.5 + offsetY, { maxWidth: 182 });
      
      // Row 4: Sifat Keamanan & Tingkat Kecepatan
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("SIFAT KEAMANAN:", 14, 60.5 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const style = letter.securityStyle || 'Biasa';
      const styleOptions = ["Biasa", "Terbatas", "Rahasia"];
      let styleX = 42;
      styleOptions.forEach(opt => {
        const isChecked = style === opt;
        doc.rect(styleX, 62 + offsetY, 2.2, 2.2);
        if (isChecked) {
          doc.setFont("helvetica", "bold");
          doc.text("v", styleX + 0.4, 63.8 + offsetY);
          doc.setFont("helvetica", "normal");
        }
        doc.text(opt, styleX + 3.5, 63.8 + offsetY);
        styleX += 20;
      });
      
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("TINGKAT KECEPATAN:", 107, 60.5 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const urg = letter.urgency || 'Biasa';
      const urgOptions = ["Biasa", "Segera", "Sgt Segera"];
      let urgX = 142;
      urgOptions.forEach(opt => {
        let checkOpt = opt;
        if (opt === 'Sgt Segera') checkOpt = 'Sangat Segera';
        const isChecked = urg === checkOpt;
        doc.rect(urgX, 62 + offsetY, 2.2, 2.2);
        if (isChecked) {
          doc.setFont("helvetica", "bold");
          doc.text("v", urgX + 0.4, 63.8 + offsetY);
          doc.setFont("helvetica", "normal");
        }
        doc.text(opt, urgX + 3.5, 63.8 + offsetY);
        urgX += 18;
      });
      
      // Row 5: Diteruskan & Disposisi
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("DITERUSKAN KEPADA YTH:", 14, 70 + offsetY);
      doc.text("PETUNJUK / DISPOSISI KEPALA SEKOLAH:", 107, 70 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      
      const addressed = (letter.addressedTo || "").toLowerCase();
      const officers = [
        { name: "Kepala Urusan Tata Usaha (Kaur TU)", matches: ["tu", "tata usaha", "kaur tu", "kepala tu"] },
        { name: "Wakil Kepala Sekolah Bid. Kurikulum", matches: ["kurikulum", "waka kurikulum"] },
        { name: "Wakil Kepala Sekolah Bid. Kesiswaan", matches: ["kesiswaan", "waka kesiswaan"] },
        { name: "Wakil Kepala Sekolah Bid. Sarpras", matches: ["sarpras", "waka sarpras"] },
        { name: "Wakil Kepala Sekolah Bid. Humas", matches: ["humas", "waka humas"] },
        { name: "Bendahara Sekolah", matches: ["bendahara", "keuangan"] },
        { name: "Guru Bimbingan Konseling (BK)", matches: ["bk", "konseling", "bimbingan"] }
      ];
      
      let checkedAnyOfficer = false;
      officers.forEach((off, idx) => {
        const isChecked = off.matches.some(m => addressed.includes(m));
        if (isChecked) checkedAnyOfficer = true;
        const yPos = 74.5 + (idx * 4.8) + offsetY;
        doc.rect(14, yPos - 2.2, 2.2, 2.2);
        if (isChecked) {
          doc.setFont("helvetica", "bold");
          doc.text("v", 14.4, yPos - 0.4);
          doc.setFont("helvetica", "normal");
        }
        doc.text(off.name, 18, yPos);
      });
      
      doc.setFont("helvetica", "normal");
      const customAddr = checkedAnyOfficer ? "..................................................." : (letter.addressedTo || "-");
      doc.text(`Lainnya: ${customAddr}`, 14, 114 + offsetY, { maxWidth: 88 });
      
      const dispositionText = (letter.disposition || "").toLowerCase();
      const workflows = [
        { name: "Tanggapi dan Beri Saran / Masukan", matches: ["tanggapan", "saran", "masukan"] },
        { name: "Proses Lebih Lanjut / Selesaikan", matches: ["laksana", "jalankan", "proses", "selesaikan"] },
        { name: "Koordinasikan / Bicarakan Bersama", matches: ["koordinasi", "rapat", "bicarakan"] },
        { name: "Tindak Lanjuti Sesuai Ketentuan", matches: ["tindak", "ketentuan", "tindak lanjuti"] },
        { name: "Jawab / Balas / Buatkan Surat", matches: ["jawab", "balas", "surati"] },
        { name: "Simpan / Arsipkan (File)", matches: ["arsip", "simpan", "file"] }
      ];
      
      workflows.forEach((wf, idx) => {
        const isChecked = wf.matches.some(m => dispositionText.includes(m));
        const yPos = 74.5 + (idx * 4.8) + offsetY;
        doc.rect(107, yPos - 2.2, 2.2, 2.2);
        if (isChecked) {
          doc.setFont("helvetica", "bold");
          doc.text("v", 107.4, yPos - 0.4);
          doc.setFont("helvetica", "normal");
        }
        doc.text(wf.name, 111, yPos);
      });
      
      // Catatan Box
      doc.setDrawColor(180);
      doc.rect(107, 104 + offsetY, 88, 12);
      doc.setDrawColor(0);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("Catatan Khusus / Instruksi Tambahan:", 109, 107 + offsetY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      if (letter.disposition) {
        doc.text(letter.disposition, 109, 111 + offsetY, { maxWidth: 84 });
      } else {
        doc.setTextColor(150);
        doc.text("........................................................................................", 109, 111 + offsetY);
        doc.setTextColor(0);
      }
      
      // Tanda Tangan
      doc.setFontSize(8);
      const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: id });
      
      doc.text("Mengetahui,", 55, 122 + offsetY, { align: "center" });
      doc.text("Kepala Sekolah,", 55, 125.5 + offsetY, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(config.headmaster || 'Kepala Sekolah', 55, 137 + offsetY, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      if (config.headmasterNip) {
        doc.text(`NIP. ${config.headmasterNip}`, 55, 140.5 + offsetY, { align: "center" });
      }
      
      doc.setFontSize(8);
      doc.text(`Kediri, ${currentDate}`, 155, 122 + offsetY, { align: "center" });
      doc.text("Penerima / Petugas Tata Usaha,", 155, 125.5 + offsetY, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(config.adminName || 'Admin', 155, 137 + offsetY, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      if (config.adminNip) {
        doc.text(`NIP. ${config.adminNip}`, 155, 140.5 + offsetY, { align: "center" });
      }
    }
    return doc;
  };

  const handleCetakKendali = (letter: Letter) => {
    try {
      const htmlContent = generateKartuKendaliHTML(letter);
      setPrintModalState({
        isOpen: true,
        title: `Kartu Kendali Surat - ${letter.referenceNumber}`,
        subtitle: `Pratinjau Kartu Kendali 3-ply resmi (${letter.type === 'inbox' ? 'Surat Masuk' : 'Surat Keluar'})`,
        htmlContent,
        orientation: 'portrait',
        onDownloadPdf: () => {
          const doc = generateKendaliPDFDoc(letter);
          doc.save(`Kartu_Kendali_${letter.referenceNumber.replace(/[\/\\:]/g, '_')}.pdf`);
          toast.success('Kartu Kendali berhasil diunduh (PDF)');
        },
        onDownloadWord: () => {
          const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Kartu_Kendali_${letter.referenceNumber.replace(/[\/\\:]/g, '_')}.doc`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('Kartu Kendali berhasil diekspor ke Word');
        }
      });
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyiapkan Kartu Kendali');
    }
  };

  const handleCetakDisposisi = (letter: Letter) => {
    try {
      const htmlContent = generateDisposisiHTML(letter);
      setPrintModalState({
        isOpen: true,
        title: `Lembar Disposisi - ${letter.referenceNumber}`,
        subtitle: `Pratinjau Lembar Disposisi Resmi Surat Masuk`,
        htmlContent,
        orientation: 'portrait',
        onDownloadPdf: () => {
          const doc = generateDisposisiPDFDoc(letter);
          doc.save(`Lembar_Disposisi_${letter.referenceNumber.replace(/[\/\\:]/g, '_')}.pdf`);
          toast.success('Lembar Disposisi berhasil diunduh (PDF)');
        },
        onDownloadWord: () => {
          const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Lembar_Disposisi_${letter.referenceNumber.replace(/[\/\\:]/g, '_')}.doc`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('Lembar Disposisi berhasil diekspor ke Word');
        }
      });
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyiapkan Lembar Disposisi');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="print:hidden">
          <h2 className="text-3xl font-light tracking-tight text-white mb-2">Surat & Arsip</h2>
          <p className="text-slate-400">Kelola surat masuk, surat keluar, dan pengarsipan.</p>
        </div>
        
        {/* Print Only Header */}
        <div className="hidden print:block w-full text-center border-b border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold text-black uppercase">Daftar Surat & Arsip</h1>
          <p className="text-sm text-gray-600">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto print:hidden overflow-x-auto no-scrollbar pb-1 sm:pb-0 flex-nowrap sm:flex-wrap">
          {selectedIds.length > 0 && (
            <>
              <button 
                onClick={handleOpenDriveModalBatch} 
                className="glass-button flex items-center justify-center gap-2 shrink-0 !bg-sky-600 hover:!bg-sky-500 text-white font-medium shadow" 
                title="Cadangkan Surat Terpilih ke Google Drive"
              >
                <Cloud className="w-4 h-4" />
                <span>Drive ({selectedIds.length})</span>
              </button>
              <button onClick={handleBulkDelete} className="glass-button flex items-center justify-center gap-2 shrink-0 !bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20" title="Hapus Terpilih">
                <Trash className="w-4 h-4" />
                <span>Hapus ({selectedIds.length})</span>
              </button>
            </>
          )}
          <button 
            type="button" 
            onClick={() => setIsDriveDbModalOpen(true)} 
            className="glass-button flex items-center justify-center gap-2 shrink-0 !bg-sky-500/15 hover:!bg-sky-500/25 text-sky-300 border-sky-500/40 shadow-sm" 
            title="Database Google Drive (Pusat Sinkronisasi & Cadangan Cloud)"
          >
            <Cloud className="w-4 h-4 text-sky-400" />
            <span className="font-semibold">Database Drive</span>
          </button>
          <button 
            type="button" 
            onClick={handleSeedData} 
            className="glass-button flex items-center justify-center gap-2 shrink-0 !bg-amber-500/15 hover:!bg-amber-500/25 text-amber-300 border-amber-500/30 shadow-sm" 
            title="Lengkapi & Perbarui Data Register Surat & Arsip SMPN 3 Kras"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline font-medium">Lengkapi Data Contoh</span>
            <span className="sm:hidden font-medium">Contoh</span>
          </button>
          <input 
            type="file" 
            accept=".json,.xlsx,.xls,.pdf,.doc,.docx" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <button onClick={() => fileInputRef.current?.click()} className="glass-button !bg-slate-500/20 flex items-center justify-center gap-2 shrink-0" title="Impor Data File">
            <Upload className="w-4 h-4" />
            <span className="hidden xl:inline">Impor</span>
          </button>
          <button onClick={handleExportPDF} className="glass-button flex items-center justify-center gap-2 shrink-0 !bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20" title="Ekspor PDF">
            <FileIcon className="w-4 h-4" />
            <span className="hidden xl:inline">PDF</span>
          </button>
          <button onClick={handleExportExcel} className="glass-button flex items-center justify-center gap-2 shrink-0 !bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20" title="Ekspor Excel">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden xl:inline">Excel</span>
          </button>
          <button onClick={handleExportWord} className="glass-button flex items-center justify-center gap-2 shrink-0 !bg-sky-500/10 text-sky-300 border-sky-500/20 hover:bg-sky-500/20" title="Ekspor Word">
            <FileText className="w-4 h-4" />
            <span className="hidden xl:inline">Word</span>
          </button>
          <button onClick={handlePrint} className="glass-button flex items-center justify-center gap-2 shrink-0" title="Cetak Daftar Surat">
            <Printer className="w-4 h-4" />
            <span className="hidden xl:inline">Cetak</span>
          </button>
          <button type="button" onClick={() => setIsWizardOpen(true)} className="glass-button flex items-center justify-center gap-2 shrink-0 !bg-sky-500 hover:!bg-sky-600 !text-white border-none shadow-md font-semibold" title="Buat Draf Surat Resmi Otomatis">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Buat Draf</span>
          </button>
          <button type="button" onClick={() => { setFormLetterType('inbox'); setIsModalOpen(true); }} className="glass-button flex items-center justify-center gap-2 shrink-0 !bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 font-semibold">
            <Plus className="w-4 h-4" />
            <span>Registrasi</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Register Surat</p>
            <p className="text-xl font-bold text-white">{rawLetters.length}</p>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Surat Masuk (Inbox)</p>
            <p className="text-xl font-bold text-cyan-300">{rawLetters.filter(l => l.type === 'inbox').length}</p>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Surat Keluar (Outbox)</p>
            <p className="text-xl font-bold text-emerald-300">{rawLetters.filter(l => l.type === 'outbox').length}</p>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Urgensi Segera / Penting</p>
            <p className="text-xl font-bold text-amber-300">{rawLetters.filter(l => l.urgency === 'Segera' || l.urgency === 'Sangat Segera' || l.urgency === 'Penting').length}</p>
          </div>
        </div>
      </div>

      {/* BANNER REGISTRASI NOMOR AGENDA SURAT OTOMATIS */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0B152B] via-[#0F1B38] to-[#0A1326] border border-sky-500/30 shadow-lg print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold shrink-0 shadow-md shadow-sky-500/20">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-wide">Registrasi Nomor Agenda Surat Keluar Otomatis</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Aktif Berkelanjutan
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Nomor agenda surat keluar otomatis meneruskan urutan nomor register terakhir di buku agenda sekolah.
              </p>
            </div>
          </div>

          {/* Kartu Status Nomor Agenda Sebelumnya & Berikutnya */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/70">
              <span className="text-[10px] text-slate-400 font-medium">Agenda Sebelumnya:</span>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                #{outboxAgenda.formattedLast}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-950/60 border border-sky-500/40">
              <span className="text-[10px] text-sky-300 font-medium">Agenda Berikutnya:</span>
              <span className="text-xs font-mono font-bold text-sky-200 bg-sky-500/25 px-1.5 py-0.5 rounded border border-sky-500/40 animate-pulse">
                #{outboxAgenda.formattedNext}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsQuickAgendaModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
              title="Keluarkan nomor agenda keluar resmi secara langsung untuk guru yang meminta nomor"
            >
              <Tag className="w-3.5 h-3.5 text-slate-950" />
              <span>Beri No. Agenda Guru</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCanvaModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all shadow-sm"
              title="Lihat desain poster panduan guru & kit Canva untuk dicetak di mading TU"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Poster Panduan Canva</span>
            </button>

            {/* Tombol Batch Registrasi jika ada pengajuan pending */}
            {rawLetters.filter(l => (l.source === 'portal_guru_wali' || Boolean(l.applicantName)) && l.submissionStatus === 'pending_approval').length > 0 && (
              <button
                type="button"
                onClick={handleBatchRegisterPendingSubmissions}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                title="Registrasi Nomor Agenda Otomatis & Terbitkan Semua Pengajuan Guru/Wali yang Pending"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Registrasi Otomatis ({rawLetters.filter(l => (l.source === 'portal_guru_wali' || Boolean(l.applicantName)) && l.submissionStatus === 'pending_approval').length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 flex flex-col gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nomor surat, perihal..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-10"
            />
          </div>

          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`glass-panel px-4 py-2 flex items-center gap-2 transition-colors ${isFiltersOpen ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"}`}
          >
            <Filter className="w-5 h-5" />
            Filter { (selectedCategory !== 'all' || selectedStatus !== 'all' || selectedYear !== 'all' || sortBy !== 'date-desc') && <span className="w-2 h-2 rounded-full bg-sky-400"></span> }
          </button>
          
          <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5 w-full sm:w-auto overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap shrink-0">
            {(['all', 'inbox', 'outbox', 'guru_wali'] as const).map(type => {
              const count = type === 'guru_wali' 
                ? rawLetters.filter(l => l.source === 'portal_guru_wali' || Boolean(l.applicantName)).length 
                : 0;
              const pendingCount = type === 'guru_wali' 
                ? rawLetters.filter(l => (l.source === 'portal_guru_wali' || Boolean(l.applicantName)) && l.submissionStatus === 'pending_approval').length
                : 0;

              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap ${
                    filterType === type 
                      ? type === 'guru_wali'
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                        : 'bg-sky-500/20 text-sky-300 shadow-sm font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type === 'all' ? 'Semua' : type === 'inbox' ? 'Masuk' : type === 'outbox' ? 'Keluar' : 'Draf Guru/Wali'}
                  {type === 'guru_wali' && count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      pendingCount > 0 
                        ? 'bg-rose-500 text-white animate-pulse' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Kategori</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full glass-input bg-slate-900/50"
                  >
                    <option value="all" className="text-black">Semua</option>
                    {LETTER_CATEGORIES.map((cat) => (
                       <option key={cat} value={cat} className="text-black">{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Status</label>
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full glass-input bg-slate-900/50"
                  >
                    <option value="all" className="text-black">Semua</option>
                    <option value="active" className="text-black">Aktif</option>
                    <option value="archived" className="text-black">Arsip</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Tahun</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full glass-input bg-slate-900/50"
                  >
                    <option value="all" className="text-black">Semua Tahun</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year} className="text-black">{year}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Urutkan</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full glass-input bg-slate-900/50"
                  >
                    <option value="date-desc" className="text-black">Tanggal Terbaru</option>
                    <option value="date-asc" className="text-black">Tanggal Terlama</option>
                    <option value="title-asc" className="text-black">Perihal (A-Z)</option>
                    <option value="title-desc" className="text-black">Perihal (Z-A)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass-panel overflow-hidden">
        {/* Mobile Card List View (Visible on small screens) */}
        <div className="block md:hidden print:hidden divide-y divide-white/5">
          {letters?.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-slate-300 font-medium mb-1">Belum ada data surat yang terdaftar.</p>
              <p className="text-xs text-slate-400 mb-4">Klik tombol di bawah untuk memuat paket data register surat resmi sekolah.</p>
              <button 
                type="button"
                onClick={handleSeedData}
                className="glass-button !bg-sky-500 hover:!bg-sky-600 !text-white text-xs font-semibold px-4 py-2"
              >
                <Database className="w-3.5 h-3.5 mr-1.5" />
                Muat Contoh Data Surat
              </button>
            </div>
          ) : (
            letters?.map(letter => {
              const isSelected = selectedIds.includes(letter.id as number);
              const isPending = (letter.applicantName || letter.source === 'portal_guru_wali') && letter.submissionStatus === 'pending_approval';

              return (
                <div key={letter.id} className={`p-4 space-y-2.5 transition-colors ${isSelected ? 'bg-sky-500/10' : 'hover:bg-white/[0.02]'}`}>
                  {/* Card Header: Checkbox, Badges, Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-600 bg-slate-800/50 text-sky-500 focus:ring-sky-500/50"
                        checked={isSelected}
                        onChange={() => toggleSelect(letter.id as number)}
                      />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        letter.type === 'inbox'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {letter.type === 'inbox' ? 'Masuk' : 'Keluar'}
                      </span>
                      {letter.urgency && letter.urgency !== 'Biasa' && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                          letter.urgency === 'Sangat Segera'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}>
                          {letter.urgency}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {format(new Date(letter.date), 'dd/MM/yyyy')}
                    </span>
                  </div>

                  {/* Reference Number & Quick Status */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenNumberAssignModal(letter, false)}
                      className="font-mono text-xs font-bold text-sky-300 hover:text-sky-200 underline flex items-center gap-1"
                      title="Ubah Nomor Surat"
                    >
                      <Hash className="w-3 h-3 text-sky-400" />
                      <span>{letter.referenceNumber}</span>
                    </button>

                    {letter.isDraft && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Draf
                      </span>
                    )}

                    {letter.isAgendaOnly && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Tag className="w-2.5 h-2.5 text-amber-400" /> Agenda
                      </span>
                    )}

                    {isPending && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                        Menunggu ACC
                      </span>
                    )}
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                      {letter.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-slate-300">
                        {letter.category || '-'}
                      </span>
                      {letter.processingUnit && (
                        <span className="text-[10px] text-slate-400 truncate">
                          Unit: {letter.processingUnit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sender / Applicant */}
                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/5">
                    {letter.applicantName ? (
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-medium text-white truncate max-w-[150px]">{letter.applicantName}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-bold font-mono">
                          {letter.applicantRole === 'guru' ? 'Guru' : letter.applicantRole === 'wali' ? 'Wali' : 'Pemohon'}
                        </span>
                        {letter.applicantPhone && (
                          <a
                            href={`https://wa.me/${letter.applicantPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono hover:underline"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-400" />
                            <span>{letter.applicantPhone}</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="truncate max-w-[200px] text-slate-400">
                        {letter.type === 'inbox' ? 'Dari: ' : 'Kepada: '}
                        <strong className="text-slate-300">{letter.senderOrRecipient || '-'}</strong>
                      </span>
                    )}

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      letter.status === 'active'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {letter.status === 'active' ? 'Aktif' : 'Arsip'}
                    </span>
                  </div>

                  {/* Mobile Actions Toolbar */}
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-1">
                    {/* Primary actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleApproveSubmission(letter, true)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                          title="Setujui & Terbitkan"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ACC & Cetak</span>
                        </button>
                      )}

                      <button 
                        onClick={() => handlePreviewOfficialLetter(letter, 'resmi')}
                        className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1"
                        title="Cetak Surat Resmi"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Resmi</span>
                      </button>

                      {(letter.applicantName || letter.source === 'portal_guru_wali') && (
                        <button 
                          onClick={() => handlePreviewOfficialLetter(letter, 'permohonan')}
                          className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-semibold flex items-center gap-1"
                          title="Cetak Permohonan"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Permohonan</span>
                        </button>
                      )}

                      {letter.isAgendaOnly && (
                        <button 
                          onClick={() => handlePrintAgendaSlipDirect(letter)}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold flex items-center gap-1"
                          title="Cetak Slip Agenda"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Slip Agenda</span>
                        </button>
                      )}

                      {letter.type === 'inbox' && (
                        <button 
                          onClick={() => handleCetakDisposisi(letter)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1"
                          title="Cetak Lembar Disposisi"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>Disposisi</span>
                        </button>
                      )}
                    </div>

                    {/* Secondary utility icons */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleDownloadLetterDocument(letter)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                        title="Unduh PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleOpenDriveModalSingle(letter)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sky-400"
                        title="Google Drive"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => toggleArchive(letter)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                        title={letter.status === 'active' ? 'Arsipkan' : 'Aktifkan'}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleEditClick(letter)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sky-400"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(letter.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Print View: Table (Hidden on small screens) */}
        <div className="hidden md:block print:block overflow-x-auto overflow-y-auto custom-scrollbar max-h-[calc(100vh-280px)] min-h-[300px]">
          <table className="glass-table relative">
            <thead>
              <tr className="print:border-b print:border-black">
                <th className="w-12 text-center print:hidden">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-600 bg-slate-800/50 text-sky-500 focus:ring-sky-500/50"
                    checked={letters?.length ? selectedIds.length === letters.length : false}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="print:text-black">No. Referensi</th>
                <th className="print:text-black">Perihal</th>
                <th className="print:text-black">Kategori</th>
                <th className="print:text-black">Pengirim/Penerima</th>
                <th className="print:text-black">Tanggal</th>
                <th className="print:text-black">Tipe</th>
                <th className="print:text-black">Status</th>
                <th className="print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="print:text-black">
              {letters?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 print:text-black">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20 print:hidden" />
                    <p className="text-slate-300 font-medium mb-1">Belum ada data surat yang terdaftar.</p>
                    <p className="text-xs text-slate-400 mb-4">Klik tombol di bawah untuk memuat paket data register surat resmi sekolah.</p>
                    <button 
                      type="button"
                      onClick={handleSeedData}
                      className="glass-button !bg-sky-500 hover:!bg-sky-600 !text-white text-xs font-semibold px-4 py-2"
                    >
                      <Database className="w-3.5 h-3.5 mr-1.5" />
                      Muat Contoh Data Surat Resmi
                    </button>
                  </td>
                </tr>
              ) : (
                letters?.map(letter => (
                  <tr key={letter.id} className={`${letter.status === 'archived' ? 'opacity-60 print:opacity-100' : ''} ${selectedIds.includes(letter.id as number) ? 'bg-sky-500/5' : ''} print:border-b print:border-gray-200`}>
                    <td className="text-center print:hidden">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-600 bg-slate-800/50 text-sky-500 focus:ring-sky-500/50"
                        checked={selectedIds.includes(letter.id as number)}
                        onChange={() => toggleSelect(letter.id as number)}
                      />
                    </td>
                    <td className="print:text-black">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenNumberAssignModal(letter, false)}
                          className="font-mono text-sm text-sky-300 hover:text-sky-200 font-semibold print:text-black hover:underline text-left inline-flex items-center gap-1"
                          title="Klik untuk Isi / Ubah Nomor Surat Resmi"
                        >
                          <Hash className="w-3 h-3 text-sky-400 opacity-60" />
                          <span>{letter.referenceNumber}</span>
                        </button>
                        {letter.isDraft && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Draf
                          </span>
                        )}
                        {letter.isAgendaOnly && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Tag className="w-2.5 h-2.5 text-amber-400" /> Agenda Saja
                          </span>
                        )}
                      </div>
                      {letter.code && (
                        <div className="text-[11px] font-mono text-slate-400">
                          Kode: <span className="text-amber-400">{letter.code}</span> {letter.sequenceNumber && `| Urut: ${letter.sequenceNumber}`}
                        </div>
                      )}
                    </td>
                    <td className="font-medium print:text-black max-w-[260px]">
                      <div className="truncate" title={letter.title}>{letter.title}</div>
                      {letter.processingUnit && (
                        <div className="text-[11px] text-slate-400 font-normal truncate">
                          Unit: {letter.processingUnit}
                        </div>
                      )}
                    </td>
                    <td className="text-slate-300 print:text-black">
                      <span className="px-2 py-0.5 rounded text-xs bg-white/5 border border-white/10 text-slate-300">
                        {letter.category || '-'}
                      </span>
                    </td>
                    <td className="print:text-black text-slate-300 text-sm max-w-[200px]">
                      {letter.applicantName ? (
                        <div>
                          <div className="text-white font-medium flex items-center gap-1.5 flex-wrap">
                            <span>{letter.applicantName}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-bold font-mono">
                              {letter.applicantRole === 'guru' ? 'Guru' : letter.applicantRole === 'wali' ? 'Wali' : 'Pemohon'}
                            </span>
                          </div>
                          {letter.applicantPhone && (
                            <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 shrink-0" />
                              <span>{letter.applicantPhone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="truncate" title={letter.senderOrRecipient}>
                          {letter.senderOrRecipient}
                        </div>
                      )}
                    </td>
                    <td className="text-slate-400 print:text-black whitespace-nowrap">
                      {format(new Date(letter.date), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="print:text-black">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                          letter.type === 'inbox'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {letter.type === 'inbox' ? 'Masuk' : 'Keluar'}
                        </span>
                        {letter.submissionStatus === 'pending_approval' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Menunggu Verifikasi TU
                          </span>
                        )}
                        {letter.urgency && letter.urgency !== 'Biasa' && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                            letter.urgency === 'Sangat Segera'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {letter.urgency}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="print:text-black">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        letter.status === 'active'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 print:bg-transparent print:border-black print:text-black'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20 print:bg-transparent print:border-black print:text-black'
                      }`}>
                        {letter.status === 'active' ? 'Aktif' : 'Arsip'}
                      </span>
                    </td>
                    <td className="print:hidden">
                      <div className="flex gap-1 justify-end items-center flex-wrap">
                        {/* Quick Assign / Edit Official Letter Number */}
                        <button
                          type="button"
                          onClick={() => handleOpenNumberAssignModal(letter, false)}
                          className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors"
                          title="Isi / Tetapkan Nomor Surat Resmi"
                        >
                          <Hash className="w-4 h-4" />
                        </button>

                        {/* Quick Approve button for pending guru/wali draft */}
                        {(letter.applicantName || letter.source === 'portal_guru_wali') && letter.submissionStatus === 'pending_approval' && (
                          <button
                            type="button"
                            onClick={() => handleApproveSubmission(letter, true)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm shadow-emerald-950/40 transition-all mr-1"
                            title="Setujui Draf, Tetapkan Nomor & Langsung Buka Cetak Surat Resmi"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Setujui & Cetak</span>
                          </button>
                        )}

                        {letter.applicantPhone && (
                          <a
                            href={`https://wa.me/${letter.applicantPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                            title={`Chat WhatsApp dengan ${letter.applicantName || 'Pemohon'}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        {/* Cetak Bukti / Slip Registrasi Nomor Agenda Khusus Guru */}
                        {letter.isAgendaOnly && (
                          <button 
                            onClick={() => handlePrintAgendaSlipDirect(letter)}
                            className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors"
                            title="Cetak Bukti / Slip Registrasi Nomor Agenda Guru"
                          >
                            <Printer className="w-4 h-4 text-amber-400" />
                          </button>
                        )}

                        {/* Cetak Surat Resmi Langsung oleh Admin */}
                        <button 
                          onClick={() => handlePreviewOfficialLetter(letter, 'resmi')}
                          className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Cetak Langsung Naskah Surat Dinas Resmi"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Cetak Surat Permohonan Pemohon jika dari portal */}
                        {(letter.applicantName || letter.source === 'portal_guru_wali') && (
                          <button 
                            onClick={() => handlePreviewOfficialLetter(letter, 'permohonan')}
                            className="p-2 rounded-lg hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 transition-colors"
                            title="Cetak Surat Permohonan Pemohon"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        <button 
                          onClick={() => handleDownloadLetterDocument(letter)}
                          className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Unduh Dokumen Surat (PDF)"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => setViewingLetter(letter)}
                          className="p-2 rounded-lg hover:bg-sky-500/20 text-sky-400/70 hover:text-sky-300 transition-colors"
                          title="Lihat Detail Data"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {letter.type === 'outbox' && (
                          <button 
                            onClick={() => handleCetakKendali(letter)}
                            className="p-2 rounded-lg hover:bg-sky-500/20 text-sky-400/70 hover:text-sky-300 transition-colors"
                            title="Cetak Kartu Kendali"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        )}
                        {letter.type === 'inbox' && (
                          <button 
                            onClick={() => handleCetakDisposisi(letter)}
                            className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400/70 hover:text-emerald-300 transition-colors"
                            title="Cetak Lembar Disposisi"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenDriveModalSingle(letter)}
                          className="p-2 rounded-lg hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 transition-colors"
                          title="Simpan ke Google Drive"
                        >
                          <Cloud className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleArchive(letter)}
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors ml-1"
                          title={letter.status === 'active' ? 'Arsipkan' : 'Aktifkan'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(letter)}
                          className="p-2 rounded-lg hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(letter.id)}
                          className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Surat */}
      <AnimatePresence>
        {viewingLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel w-full max-w-2xl p-0 overflow-hidden relative border-sky-500/20 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/20 shrink-0">
                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-sky-400" /> Detail Surat {viewingLetter.type === 'inbox' ? 'Masuk' : 'Keluar'}
                </h3>
                <button onClick={() => setViewingLetter(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Dedicated Applicant Section for Guru & Wali submissions */}
                {(viewingLetter.applicantName || viewingLetter.source === 'portal_guru_wali') && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-teal-950/40 border border-emerald-500/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          {viewingLetter.applicantRole === 'guru' ? <Briefcase className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                            <span>PENGAJUAN DRAF SURAT DARI {viewingLetter.applicantRole === 'guru' ? 'GURU / TENDIK' : 'WALI MURID'}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              viewingLetter.submissionStatus === 'approved' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {viewingLetter.submissionStatus === 'approved' ? '✓ Disetujui & Diterbitkan' : '⏳ Menunggu Verifikasi TU'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">Diajukan melalui Portal Mandiri Guru & Wali Murid</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {viewingLetter.submissionStatus === 'pending_approval' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveSubmission(viewingLetter, true)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 flex items-center gap-1.5 transition-all"
                              title="Setujui Draf dan langsung buka cetak Surat Resmi"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Setujui & Cetak Resmi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePreviewOfficialLetter(viewingLetter, 'resmi')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-all"
                              title="Cetak Surat Resmi langsung sebagai Admin"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak Resmi (Admin)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePreviewOfficialLetter(viewingLetter, 'permohonan')}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all"
                              title="Cetak Surat Permohonan Pemohon"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Cetak Permohonan</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePreviewOfficialLetter(viewingLetter, 'resmi')}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 transition-all"
                              title="Cetak Naskah Surat Dinas Resmi Sekolah"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak Surat Resmi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePreviewOfficialLetter(viewingLetter, 'permohonan')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600/25 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-all"
                              title="Cetak Naskah Surat Permohonan Pemohon"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Cetak Permohonan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePreviewOfficialLetter(viewingLetter, 'combined')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/25 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-all"
                              title="Cetak Paket Lengkap 2 Dokumen (Permohonan + Surat Resmi)"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Paket 2-in-1</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-mono">Nama Pemohon:</span>
                        <span className="font-semibold text-white">{viewingLetter.applicantName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-mono">Nomor HP / WhatsApp:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-400 font-semibold">{viewingLetter.applicantPhone || '-'}</span>
                          {viewingLetter.applicantPhone && (
                            <a
                              href={`https://wa.me/${viewingLetter.applicantPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Chat WA</span>
                            </a>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-mono">Status Pengajuan:</span>
                        <span className="text-slate-200 capitalize font-medium">
                          {viewingLetter.submissionStatus === 'approved' ? 'Telah Disetujui (Resmi)' : 'Menunggu Persetujuan Admin'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center justify-between">
                        <span>Nomor Referensi Resmi</span>
                        <button
                          type="button"
                          onClick={() => handleOpenNumberAssignModal(viewingLetter, false)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-sans flex items-center gap-1 font-semibold hover:underline"
                          title="Isi / Ubah Nomor Surat Resmi"
                        >
                          <Hash className="w-3.5 h-3.5" />
                          <span>Isi / Ubah Nomor</span>
                        </button>
                      </div>
                      <div className="text-white font-mono font-bold text-base">{viewingLetter.referenceNumber}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">Perihal</div>
                      <div className="text-lg text-sky-300 font-medium">{viewingLetter.title}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">Kategori</div>
                      <div className="text-white">{viewingLetter.category || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">{viewingLetter.type === 'inbox' ? 'Tanggal Diterima' : 'Tanggal Keluar'}</div>
                      <div className="text-white">{format(new Date(viewingLetter.date), 'dd MMMM yyyy', { locale: id })}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">{viewingLetter.type === 'inbox' ? 'Pengirim (Dari)' : 'Penerima (Kepada)'}</div>
                      <div className="text-white">{viewingLetter.senderOrRecipient}</div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                    <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700/50 pb-2 mb-2">Informasi Administratif</h4>
                    <div className="grid grid-cols-2 gap-4 flex-wrap">
                       <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">Indeks</div>
                          <div className="text-white">{viewingLetter.indexData || '-'}</div>
                       </div>
                       <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">Kode</div>
                          <div className="text-white font-mono">{viewingLetter.code || '-'}</div>
                       </div>
                       <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">No. Urut</div>
                          <div className="text-white font-mono">{viewingLetter.sequenceNumber || '-'}</div>
                       </div>
                       <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">Lampiran</div>
                          <div className="text-white">{viewingLetter.attachment || '-'}</div>
                       </div>
                       <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">Sifat Surat</div>
                          <div className="text-white">{viewingLetter.securityStyle || 'Biasa'}</div>
                       </div>
                       <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">Kecepatan</div>
                          <div className="text-white">{viewingLetter.urgency || 'Biasa'}</div>
                       </div>
                       <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">Unit Pengolah</div>
                          <div className="text-white">{viewingLetter.processingUnit || '-'}</div>
                       </div>
                       <div>
                          <div className="text-xs font-medium text-slate-500 uppercase mb-1">Diterima Oleh</div>
                          <div className="text-white">{viewingLetter.receivedBy || '-'}</div>
                       </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">Tanggal Surat</div>
                      <div className="text-white">{viewingLetter.documentDate ? format(new Date(viewingLetter.documentDate), 'dd MMMM yyyy', { locale: id }) : '-'}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-700/50">
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">Ditujukan / Disposisi Ke</div>
                      <div className="text-white">{viewingLetter.addressedTo || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase mb-1">Catatan Disposisi</div>
                      <div className="text-white whitespace-pre-wrap">{viewingLetter.disposition || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-500 uppercase mb-2">Keterangan / Isi Ringkas</div>
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-xs">{viewingLetter.description || 'Tidak ada keterangan tambahan.'}</div>
                  </div>

                  {/* QR Code Verifikasi */}
                  {viewingQrUrl && (
                    <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 shrink-0">
                      <img src={viewingQrUrl} alt="QR Verifikasi" className="w-16 h-16 rounded bg-white p-1" />
                      <div className="text-[10px] space-y-0.5 font-mono text-slate-400">
                        <p className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> DIGITAL VERIFIED
                        </p>
                        <p>SMPN 3 KRAS</p>
                        <p className="text-[9px] text-slate-500">ID: {viewingLetter.referenceNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-wrap justify-between items-center gap-2">
                  <div className="text-xs text-slate-500">Status: <span className={viewingLetter.status === 'archived' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>{viewingLetter.status === 'archived' ? 'Diarsipkan' : 'Aktif'}</span></div>
                  <div className="text-xs text-slate-500 font-mono">Dibuat: {new Date(viewingLetter.createdAt).toLocaleString('id-ID')}</div>
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 border-t border-slate-700/50 flex justify-between items-center shrink-0">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handlePreviewOfficialLetter(viewingLetter, 'resmi')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-colors"
                    title="Pratinjau & Cetak Surat Dinas Resmi Sekolah"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cetak Surat Resmi</span>
                  </button>

                  {(viewingLetter.applicantName || viewingLetter.source === 'portal_guru_wali') && (
                    <button 
                      onClick={() => handlePreviewOfficialLetter(viewingLetter, 'permohonan')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-colors"
                      title="Pratinjau & Cetak Surat Permohonan Pemohon"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      <span>Cetak Surat Permohonan</span>
                    </button>
                  )}

                  <button 
                    onClick={() => handleDownloadLetterDocument(viewingLetter)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                    title="Unduh file dokumen surat PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PDF</span>
                  </button>

                  {viewingLetter.type === 'inbox' ? (
                    <button 
                      onClick={() => { handleCetakDisposisi(viewingLetter); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Cetak Lembar Disposisi
                    </button>
                  ) : (
                    <button 
                      onClick={() => { handleCetakKendali(viewingLetter); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      Cetak Kartu Kendali
                    </button>
                  )}

                  <button 
                    onClick={() => handleOpenDriveModalSingle(viewingLetter)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-colors"
                    title="Simpan ke folder Google Drive"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    Simpan ke Google Drive
                  </button>
                </div>
                <button onClick={() => setViewingLetter(null)} className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-3xl p-0 overflow-hidden relative flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50 shrink-0 bg-slate-800/20">
                <h3 className="text-xl font-medium text-white">
                  {editingLetter ? 'Edit Dokumen Surat' : 'Registrasi Surat Baru'}
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
                <form onSubmit={handleSaveLetter} className="space-y-6">
                  {/* SELEKSI TIPE SURAT (SEGMENTED SWITCH CONTROL) */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jenis Surat / Naskah</label>
                    <div className="flex bg-slate-950/40 p-1 rounded-xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => setFormLetterType('inbox')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          formLetterType === 'inbox'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/20 shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <ArrowDownRight className="w-4 h-4 text-sky-400" />
                        Surat Masuk (Incoming)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormLetterType('outbox')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          formLetterType === 'outbox'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        Surat Keluar (Outgoing)
                      </button>
                    </div>
                    <input type="hidden" name="type" value={formLetterType} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* BAGIAN 1: INFORMASI UTAMA NASKAH */}
                    <div className="space-y-4 bg-slate-800/20 p-4 rounded-xl border border-white/5">
                      <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider border-b border-slate-700/50 pb-2 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Identitas Naskah Surat
                      </h4>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">KATEGORI ARSIP</label>
                        <select 
                          name="category" 
                          required 
                          defaultValue={editingLetter?.category || ''}
                          className="glass-input w-full appearance-none bg-slate-900"
                        >
                          <option value="" disabled>Pilih Kategori</option>
                          {LETTER_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">NOMOR SURAT (REFERENSI)</label>
                        <input 
                          type="text" 
                          name="referenceNumber" 
                          required 
                          defaultValue={editingLetter?.referenceNumber} 
                          placeholder={formLetterType === 'inbox' ? "003/SM/SMP3/2026" : "005/SK/SMP3/2026"} 
                          className="glass-input w-full font-mono" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">TANGGAL SURAT (TGL DOKUMEN)</label>
                        <input 
                          type="date" 
                          name="documentDate" 
                          required 
                          defaultValue={editingLetter?.documentDate ? editingLetter.documentDate.split('T')[0] : ''} 
                          className="glass-input w-full" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">PERIHAL / ISI RINGKAS</label>
                        <input 
                          type="text" 
                          name="title" 
                          required 
                          defaultValue={editingLetter?.title} 
                          placeholder="Undangan Rapat Wali Murid Kelas IX" 
                          className="glass-input w-full" 
                        />
                      </div>
                    </div>

                    {/* BAGIAN 2: ALUR PENGIRIMAN & PENERIMAAN */}
                    <div className="space-y-4 bg-slate-800/20 p-4 rounded-xl border border-white/5">
                      <h4 className={`text-xs font-bold uppercase tracking-wider border-b border-slate-700/50 pb-2 flex items-center gap-1.5 ${formLetterType === 'inbox' ? 'text-sky-400' : 'text-emerald-400'}`}>
                        {formLetterType === 'inbox' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        {formLetterType === 'inbox' ? 'Log Penerimaan' : 'Log Pengiriman & Dispatch'}
                      </h4>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">
                          {formLetterType === 'inbox' ? 'PENGIRIM (DARI / ASAL SURAT)' : 'PENERIMA (KEPADA / TUJUAN SURAT)'}
                        </label>
                        <input 
                          type="text" 
                          name="senderOrRecipient" 
                          required 
                          defaultValue={editingLetter?.senderOrRecipient} 
                          placeholder={formLetterType === 'inbox' ? "Dinas Pendidikan Kabupaten Kediri" : "Orang Tua Wali Murid Kelas IX"} 
                          className="glass-input w-full" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">
                          {formLetterType === 'inbox' ? 'TANGGAL TERIMA SEKOLAH' : 'TANGGAL KELUAR / DIKIRIM'}
                        </label>
                        <input 
                          type="date" 
                          name="date" 
                          required 
                          defaultValue={editingLetter?.date ? editingLetter.date.split('T')[0] : ''} 
                          className="glass-input w-full" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">
                          {formLetterType === 'inbox' ? 'DITERIMA OLEH (PETUGAS TU)' : 'PENCATAT / PENGIRIM (PETUGAS TU)'}
                        </label>
                        <input 
                          type="text" 
                          name="receivedBy" 
                          defaultValue={editingLetter?.receivedBy} 
                          placeholder="Contoh: Rahmawati, S.Kom" 
                          className="glass-input w-full" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN 3: ADMINISTRASI & KARTU KENDALI */}
                  <div className="bg-slate-800/20 p-5 rounded-xl border border-white/5 space-y-4">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-700/50 pb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Archive className="w-4 h-4" />
                        Registrasi & Klasifikasi (Kartu Kendali)
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 flex items-center justify-between">
                          <span>NO. AGENDA / URUT</span>
                        </label>
                        <input 
                          key={`seq-${formLetterType}`}
                          type="text" 
                          name="sequenceNumber" 
                          defaultValue={editingLetter ? editingLetter.sequenceNumber : getNextSequenceNumber(formLetterType)} 
                          placeholder="001" 
                          className="glass-input w-full font-mono text-center text-amber-300 border-amber-500/20" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">KODE KLASIFIKASI</label>
                        <input 
                          type="text" 
                          name="code" 
                          defaultValue={editingLetter?.code} 
                          placeholder="Contoh: PP.01" 
                          className="glass-input w-full font-mono" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">INDEKS / SUB MASALAH</label>
                        <input 
                          type="text" 
                          name="indexData" 
                          defaultValue={editingLetter?.indexData} 
                          placeholder="Contoh: Kesiswaan" 
                          className="glass-input w-full" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">LAMPIRAN</label>
                        <input 
                          type="text" 
                          name="attachment" 
                          defaultValue={editingLetter?.attachment} 
                          placeholder="Contoh: 1 Berkas / 2 Lembar" 
                          className="glass-input w-full" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">SIFAT KEAMANAN</label>
                        <select 
                          name="securityStyle" 
                          defaultValue={editingLetter?.securityStyle || 'Biasa'} 
                          className="glass-input w-full appearance-none bg-slate-900"
                        >
                          <option value="Biasa">Biasa</option>
                          <option value="Terbatas">Terbatas</option>
                          <option value="Rahasia">Rahasia</option>
                          <option value="Sangat Rahasia">Sangat Rahasia</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">TINGKAT KECEPATAN</label>
                        <select 
                          name="urgency" 
                          defaultValue={editingLetter?.urgency || 'Biasa'} 
                          className="glass-input w-full appearance-none bg-slate-900"
                        >
                          <option value="Biasa">Biasa</option>
                          <option value="Segera">Segera</option>
                          <option value="Sangat Segera">Sangat Segera</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 md:col-span-3 space-y-1">
                        <label className="text-xs font-medium text-slate-400">UNIT PENGOLAH (UNIT INTERNAL SEKOLAH)</label>
                        <input 
                          type="text" 
                          name="processingUnit" 
                          defaultValue={editingLetter?.processingUnit || 'Tata Usaha (TU)'} 
                          placeholder="Contoh: Unit Kesiswaan / Tata Usaha (TU)" 
                          className="glass-input w-full" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN 4: DISPOSISI KEPALA SEKOLAH (Khusus Surat Masuk) */}
                  {formLetterType === 'inbox' && (
                    <div className="bg-sky-500/5 p-5 rounded-xl border border-sky-500/15 space-y-4">
                      <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider border-b border-sky-500/25 pb-2 flex items-center gap-1.5">
                        <ClipboardCheck className="w-4 h-4" />
                        Instruksi & Disposisi Kepala Sekolah
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400">DITERUSKAN KEPADA YTH.</label>
                          <input 
                            type="text" 
                            name="addressedTo" 
                            defaultValue={editingLetter?.addressedTo} 
                            placeholder="Contoh: Waka Kurikulum / Kesiswaan" 
                            className="glass-input w-full" 
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400">PETUNJUK / CATATAN DISPOSISI</label>
                          <input 
                            type="text" 
                            name="disposition" 
                            defaultValue={editingLetter?.disposition} 
                            placeholder="Contoh: Silahkan ditindaklanjuti & dikoordinasikan" 
                            className="glass-input w-full" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KETERANGAN RINGKAS */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400 uppercase">Keterangan / Deskripsi Tambahan</label>
                    <textarea 
                      name="description" 
                      rows={3} 
                      defaultValue={editingLetter?.description} 
                      className="glass-input w-full resize-none custom-scrollbar" 
                      placeholder="Ringkasan isi surat atau catatan tambahan lainnya..."
                    ></textarea>
                  </div>

                  {/* AKSI TOMBOL */}
                  <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-slate-900 border-t border-slate-700/50 p-4 -mx-6 -mb-6 mt-6 shrink-0">
                    <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                      Batal
                    </button>
                    <button type="submit" className="glass-button">
                      {editingLetter ? 'Simpan Perubahan' : 'Tambah Surat'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWizardOpen && (
          <LetterTemplateWizard
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
            onDraftCreated={() => {}}
            getNextSequenceNumber={getNextSequenceNumber}
          />
        )}
      </AnimatePresence>

      {/* Modal Tetapkan / Isi Nomor Surat Resmi oleh Admin */}
      <AnimatePresence>
        {numberAssignModal.isOpen && numberAssignModal.letter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel w-full max-w-lg p-0 overflow-hidden relative border-amber-500/30 shadow-2xl"
            >
              <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-gradient-to-r from-amber-500/10 via-slate-800/40 to-slate-800/20">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Hash className="w-5 h-5 text-amber-400" />
                  <span>Tetapkan Nomor Surat Resmi</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setNumberAssignModal(prev => ({ ...prev, isOpen: false, letter: null }))}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAssignedNumber} className="p-6 space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="text-xs text-slate-400 font-mono">DRAF / PERIHAL SURAT:</div>
                  <div className="text-sm font-semibold text-white">{numberAssignModal.letter.title}</div>
                  {numberAssignModal.letter.applicantName && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                      <span>Pemohon:</span>
                      <span className="font-semibold">{numberAssignModal.letter.applicantName}</span>
                      <span>({numberAssignModal.letter.applicantRole === 'guru' ? 'Guru' : 'Wali Murid'})</span>
                    </div>
                  )}

                  {/* Visual Urutan Agenda Sebelumnya -> Agenda Baru */}
                  <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/70">
                      <span className="text-slate-400 block text-[10px]">Agenda Sebelumnya:</span>
                      <span className="font-mono font-bold text-amber-300">#{outboxAgenda.formattedLast}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{outboxAgenda.lastLetter?.referenceNumber || '-'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-500/40">
                      <span className="text-sky-300 block text-[10px]">Agenda Baru Otomatis:</span>
                      <span className="font-mono font-bold text-sky-200">#{outboxAgenda.formattedNext}</span>
                      <span className="text-[10px] text-emerald-300 block">✓ Meneruskan urutan</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>NOMOR SURAT RESMI (DIISI OLEH ADMIN / TU) *</span>
                    <span className="text-[10px] text-sky-400 font-mono">Agenda #{outboxAgenda.formattedNext}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={numberAssignModal.newRefNumber}
                    onChange={(e) => setNumberAssignModal(prev => ({ ...prev, newRefNumber: e.target.value }))}
                    placeholder={`Contoh: 420.3/${outboxAgenda.formattedNext}/418.20.2.62.03/${new Date().getFullYear()}`}
                    className="glass-input w-full font-mono text-sm text-sky-300 font-bold border-sky-500/40 focus:border-sky-400"
                  />
                </div>

                {/* Preset Cepat Format Nomor Surat */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-400">Pilih Preset Format Nomor Standar (No. Agenda #{outboxAgenda.formattedNext}):</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const yr = new Date().getFullYear();
                        setNumberAssignModal(prev => ({
                          ...prev,
                          newRefNumber: `420.3/${outboxAgenda.formattedNext}/418.20.2.62.03/${yr}`
                        }));
                      }}
                      className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono transition-colors"
                      title="Format Surat Perintah Tugas (SPT)"
                    >
                      SPT: 420.3/{outboxAgenda.formattedNext}/418.20.2.62.03/{new Date().getFullYear()}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const yr = new Date().getFullYear();
                        setNumberAssignModal(prev => ({
                          ...prev,
                          newRefNumber: `421/${outboxAgenda.formattedNext}/SMP.03/${yr}`
                        }));
                      }}
                      className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-mono transition-colors"
                      title="Format Surat Keterangan Siswa"
                    >
                      Keterangan: 421/{outboxAgenda.formattedNext}/SMP.03/{new Date().getFullYear()}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const yr = new Date().getFullYear();
                        setNumberAssignModal(prev => ({
                          ...prev,
                          newRefNumber: `422/${outboxAgenda.formattedNext}/SMP.03/${yr}`
                        }));
                      }}
                      className="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono transition-colors"
                      title="Format Surat Pindah / Mutasi"
                    >
                      Pindah: 422/{outboxAgenda.formattedNext}/SMP.03/{new Date().getFullYear()}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const yr = new Date().getFullYear();
                        setNumberAssignModal(prev => ({
                          ...prev,
                          newRefNumber: `421.3/${outboxAgenda.formattedNext}/SMP.03/${yr}`
                        }));
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-colors"
                      title="Format Surat Rekomendasi"
                    >
                      Rekomendasi: 421.3/{outboxAgenda.formattedNext}/SMP.03/{new Date().getFullYear()}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const yr = new Date().getFullYear();
                        setNumberAssignModal(prev => ({
                          ...prev,
                          newRefNumber: `421.7/${outboxAgenda.formattedNext}/SMP.03/${yr}`
                        }));
                      }}
                      className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono transition-colors"
                      title="Format Surat Legalisir Dokumen / Ijazah"
                    >
                      Legalisir: 421.7/{outboxAgenda.formattedNext}/SMP.03/{new Date().getFullYear()}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const yr = new Date().getFullYear();
                        setNumberAssignModal(prev => ({
                          ...prev,
                          newRefNumber: `421/${outboxAgenda.formattedNext}/418.20.2.62.03/${yr}`
                        }));
                      }}
                      className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-mono transition-colors"
                      title="Format Surat Dinas Umum"
                    >
                      Dinas: 421/{outboxAgenda.formattedNext}/418.20.2.62.03/{new Date().getFullYear()}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">TANGGAL NASKAH SURAT</label>
                    <input
                      type="date"
                      value={numberAssignModal.newDocumentDate}
                      onChange={(e) => setNumberAssignModal(prev => ({ ...prev, newDocumentDate: e.target.value }))}
                      className="glass-input w-full text-xs"
                    />
                  </div>

                  <div className="flex flex-col justify-center space-y-1.5 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={numberAssignModal.autoApprove}
                        onChange={(e) => setNumberAssignModal(prev => ({ ...prev, autoApprove: e.target.checked }))}
                        className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50"
                      />
                      <span>Tandai Resmi Disetujui</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={numberAssignModal.autoPrint}
                        onChange={(e) => setNumberAssignModal(prev => ({ ...prev, autoPrint: e.target.checked }))}
                        className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500/50"
                      />
                      <span>Buka Pratinjau Cetak</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setNumberAssignModal(prev => ({ ...prev, isOpen: false, letter: null }))}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan & Terbitkan Nomor</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Drive Upload / Sync Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => {
          setIsDriveModalOpen(false);
          setDriveModalLetter(null);
        }}
        targetLetter={driveModalLetter}
        selectedLetters={rawLetters.filter(l => selectedIds.includes(l.id as number))}
        mode={driveModalMode}
      />

      {/* Quick Agenda Only Modal for Admin / Teachers */}
      <QuickAgendaModal
        isOpen={isQuickAgendaModalOpen}
        onClose={() => setIsQuickAgendaModalOpen(false)}
        userRole="admin"
        defaultApplicantRole="guru"
      />

      {/* Canva Poster & Guide Modal */}
      <CanvaPosterModal
        isOpen={isCanvaModalOpen}
        onClose={() => setIsCanvaModalOpen(false)}
      />

      {/* Print Preview & Direct Print Modal */}
      <PrintPreviewModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState(prev => ({ ...prev, isOpen: false }))}
        title={printModalState.title}
        subtitle={printModalState.subtitle}
        htmlContent={printModalState.htmlContent}
        orientation={printModalState.orientation || 'portrait'}
        onDownloadPdf={printModalState.onDownloadPdf}
        onDownloadWord={printModalState.onDownloadWord}
      />

      {/* Google Drive Cloud Database Modal */}
      <GoogleDriveDatabaseModal
        isOpen={isDriveDbModalOpen}
        onClose={() => setIsDriveDbModalOpen(false)}
      />
    </motion.div>
  );
}
