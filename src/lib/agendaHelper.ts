import type { Letter } from './db';

export interface AgendaInfo {
  lastSeq: number;
  formattedLast: string;
  nextSeq: number;
  formattedNext: string;
  lastLetter: Letter | null;
  totalLettersInYear: number;
  year: number;
}

/**
 * Mendeteksi dan menghitung nomor agenda surat keluar/masuk terakhir
 * serta menentukan nomor agenda berikutnya secara otomatis berurutan.
 */
export function getLatestAgendaInfo(
  letters: Letter[],
  type: 'inbox' | 'outbox' = 'outbox',
  targetYear?: number
): AgendaInfo {
  const year = targetYear || new Date().getFullYear();
  const yearStr = year.toString();

  const filteredLetters = letters.filter(l => {
    if (l.type !== type) return false;
    const lDate = l.documentDate || l.date || l.createdAt;
    if (!lDate) return true;
    try {
      return new Date(lDate).getFullYear().toString() === yearStr;
    } catch {
      return true;
    }
  });

  let maxSeq = 0;
  let lastLetter: Letter | null = null;

  for (const letter of filteredLetters) {
    let num = 0;

    // 1. Periksa field sequenceNumber jika ada
    if (letter.sequenceNumber) {
      const parsed = parseInt(letter.sequenceNumber, 10);
      if (!isNaN(parsed) && parsed > num) {
        num = parsed;
      }
    }

    // 2. Periksa pola regex pada nomor referensi surat (misal: 420.3/088/... atau 421/043/...)
    if (letter.referenceNumber) {
      const match = letter.referenceNumber.match(/\/(?:DRAF-)?(\d{1,4})\//);
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > num) {
          num = parsed;
        }
      }
    }

    if (num > maxSeq) {
      maxSeq = num;
      lastLetter = letter;
    }
  }

  const nextNumber = maxSeq + 1;
  const formattedNext = String(nextNumber).padStart(3, '0');
  const formattedLast = maxSeq > 0 ? String(maxSeq).padStart(3, '0') : '-';

  return {
    lastSeq: maxSeq,
    formattedLast,
    nextSeq: nextNumber,
    formattedNext,
    lastLetter,
    totalLettersInYear: filteredLetters.length,
    year
  };
}

export interface TemplateCodeConfig {
  code: string;
  unit: string;
  instansiCode: string;
  category: string;
}

export function getTemplateClassification(templateId: string): TemplateCodeConfig {
  switch (templateId) {
    // Guru Templates
    case 'guru_tugas':
    case 'surat-tugas':
      return { code: '420.3', unit: 'Tata Usaha / GTK', instansiCode: '418.20.2.62.03', category: 'Persuratan (SK/Tugas)' };
    case 'guru_izin':
      return { code: '800', unit: 'Kepegawaian TU', instansiCode: '418.20.2.62.03', category: 'Kepegawaian' };
    case 'guru_cuti':
      return { code: '800', unit: 'Kepegawaian TU', instansiCode: '418.20.2.62.03', category: 'Kepegawaian' };
    case 'guru_rekomendasi_lomba':
      return { code: '421.2', unit: 'Kesiswaan & OSIS', instansiCode: 'SMP.03', category: 'Kesiswaan' };
    case 'guru_pengantar':
    case 'surat-pengantar':
      return { code: '094', unit: 'Kurikulum & Proktor', instansiCode: 'SMP.03', category: 'Kurikulum' };
    case 'guru_custom':
      return { code: '420', unit: 'Tata Usaha (TU)', instansiCode: 'SMP.03', category: 'Lainnya' };

    // Wali & Siswa Templates
    case 'wali_aktif':
    case 'aktif-belajar':
    case 'ket-siswa':
      return { code: '421', unit: 'Kesiswaan', instansiCode: 'SMP.03', category: 'Kesiswaan' };
    case 'wali_izin_sakit':
    case 'pemberitahuan':
      return { code: '421.2', unit: 'Kesiswaan', instansiCode: 'SMP.03', category: 'Kesiswaan' };
    case 'wali_pindah':
    case 'pindah-sekolah':
    case 'rekomendasi-pindah':
      return { code: '421.5', unit: 'Kesiswaan', instansiCode: 'SMP.03', category: 'Kesiswaan' };
    case 'wali_kelakuan_baik':
    case 'kelakuan-baik':
    case 'pernyataan-patuh':
      return { code: '421.4', unit: 'Kesiswaan', instansiCode: 'SMP.03', category: 'Kesiswaan' };
    case 'wali_dispensasi':
    case 'dispensasi-siswa':
      return { code: '421.7', unit: 'Kesiswaan', instansiCode: 'SMP.03', category: 'Kesiswaan' };
    case 'rekomendasi-beasiswa':
      return { code: '422.5', unit: 'Kesiswaan & PIP', instansiCode: 'SMP.03', category: 'Kesiswaan' };
    case 'wali_legalisir':
    case 'legalisir-ijazah':
    case 'ket-kelulusan':
      return { code: '421.7', unit: 'Tata Usaha & Alumni', instansiCode: 'SMP.03', category: 'Kesiswaan' };
    case 'undangan-wali':
      return { code: '005', unit: 'Tata Usaha & Humas', instansiCode: 'SMP.03', category: 'Undangan Resmi' };
    case 'undangan-komite':
      return { code: '005.2', unit: 'Tata Usaha & Humas', instansiCode: 'SMP.03', category: 'Undangan Resmi' };
    case 'rapat-guru':
      return { code: '005.1', unit: 'Kepala Sekolah & TU', instansiCode: 'SMP.03', category: 'Undangan Resmi' };
    case 'panggilan-ortu':
      return { code: '421.9', unit: 'Bimbingan Konseling (BK)', instansiCode: 'SMP.03', category: 'Kesiswaan' };
    case 'skmt':
      return { code: '421.8', unit: 'Kurikulum & GTK', instansiCode: 'SMP.03', category: 'Kepegawaian' };
    case 'sk-kepsek':
      return { code: '800', unit: 'Tata Usaha (TU)', instansiCode: '418.20.2.62.03', category: 'Persuratan (SK/Tugas)' };
    case 'sppd':
      return { code: '094.1', unit: 'Bendahara BOS & TU', instansiCode: '418.20.2.62.03', category: 'Persuratan (SK/Tugas)' };
    case 'sptjm':
      return { code: '421.1', unit: 'Kurikulum & Sarpras', instansiCode: 'SMP.03', category: 'Kurikulum' };

    default:
      return { code: '420', unit: 'Tata Usaha (TU)', instansiCode: 'SMP.03', category: 'Persuratan (SK/Tugas)' };
  }
}

/**
 * Format nomor surat resmi standar kedinasan SMPN 3 Kras
 */
export function buildOfficialLetterNumber(
  code: string,
  seqNumber: string,
  instansiCode: string = 'SMP.03',
  year?: number
): string {
  const y = year || new Date().getFullYear();
  return `${code}/${seqNumber}/${instansiCode}/${y}`;
}

export interface AgendaItem {
  id?: number;
  seqNumber: number;
  formattedSeq: string;
  referenceNumber: string;
  date: string;
  title: string;
  senderOrRecipient: string;
  category: string;
  processingUnit?: string;
  applicantName?: string;
  applicantRole?: 'guru' | 'wali' | 'siswa' | 'umum' | string;
  status: string;
  submissionStatus?: string;
  isDraft?: boolean;
  letter: Letter;
}

/**
 * Mengambil dan mengurutkan seluruh daftar surat keluar dalam buku agenda berdasarkan nomor urut agenda
 */
export function getOutboxAgendaList(letters: Letter[], targetYear?: number): AgendaItem[] {
  const year = targetYear || new Date().getFullYear();
  const yearStr = year.toString();

  const outboxLetters = letters.filter(l => {
    if (l.type !== 'outbox') return false;
    const lDate = l.documentDate || l.date || l.createdAt;
    if (!lDate) return true;
    try {
      return new Date(lDate).getFullYear().toString() === yearStr;
    } catch {
      return true;
    }
  });

  const list: AgendaItem[] = outboxLetters.map(l => {
    let num = 0;
    if (l.sequenceNumber) {
      const parsed = parseInt(l.sequenceNumber, 10);
      if (!isNaN(parsed)) num = parsed;
    }
    if (num === 0 && l.referenceNumber) {
      const match = l.referenceNumber.match(/\/(?:DRAF-)?(\d{1,4})\//);
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed)) num = parsed;
      }
    }

    const formattedSeq = num > 0 ? String(num).padStart(3, '0') : '-';

    return {
      id: l.id,
      seqNumber: num,
      formattedSeq,
      referenceNumber: l.referenceNumber || '-',
      date: l.documentDate || l.date || '',
      title: l.title || 'Tanpa Judul',
      senderOrRecipient: l.senderOrRecipient || '-',
      category: l.category || 'Surat Keluar',
      processingUnit: l.processingUnit || 'Tata Usaha',
      applicantName: l.applicantName,
      applicantRole: l.applicantRole,
      status: l.status,
      submissionStatus: l.submissionStatus,
      isDraft: l.isDraft,
      letter: l
    };
  });

  // Urutkan dari nomor agenda terbesar (terbaru) ke terkecil
  return list.sort((a, b) => {
    if (b.seqNumber !== a.seqNumber) {
      return b.seqNumber - a.seqNumber;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

