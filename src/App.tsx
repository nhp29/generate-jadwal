import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  RefreshCw,
  Printer,
  AlertCircle,
  Download,
} from 'lucide-react';

// Fungsi bantuan untuk mengacak array (Fisher-Yates Shuffle)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const defaultMembers = [
  'Triyono',
  'Bandu',
  'Juhari',
  'Ceppy',
  'Nuryoso',
  'Charles',
  'Noor Hadi',
  'Arif',
  'Hendi',
  'M Trisna',
  'Vinsen',
  'Senja',
  'Wachid',
].join('\n');

const App = () => {
  const [membersText, setMembersText] = useState(defaultMembers);
  const [holidaysText, setHolidaysText] = useState(''); // Tambahan state libur
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [schedule, setSchedule] = useState([]);
  const [error, setError] = useState('');

  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const generateSchedule = () => {
    // Validasi jumlah anggota tim
    const membersList = membersText
      .split('\n')
      .map((m) => m.trim())
      .filter((m) => m !== '');
    if (membersList.length !== 13) {
      setError(
        `Jumlah anggota harus tepat 13 orang. Saat ini ada ${membersList.length} orang.`
      );
      return;
    }
    setError('');

    // Mengambil daftar tanggal libur nasional dari input
    const holidayDates = holidaysText
      .split(',')
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 31);

    const newSchedule = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let currentS1 = [],
      currentS2 = [],
      currentS3 = [];
    let prevS1S3 = [],
      prevS2 = [];

    // Inisialisasi shift pertama kali di awal bulan
    const shuffledMembers = shuffleArray(membersList);
    currentS1 = shuffledMembers.slice(0, 3);
    currentS3 = shuffledMembers.slice(3, 6);
    currentS2 = shuffledMembers.slice(6, 13);
    prevS1S3 = [...currentS1, ...currentS3];
    prevS2 = [...currentS2];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay(); // 0: Minggu, 1: Senin, ..., 6: Sabtu
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isNationalHoliday = holidayDates.includes(day);
      const isHoliday = isWeekend || isNationalHoliday;

      // Rotasi shift dilakukan secara presisi setiap hari Senin (kecuali tanggal 1)
      if (dayOfWeek === 1 && day !== 1) {
        const shuffledPrevS2 = shuffleArray(prevS2);

        // Aturan: Anggota Shift 1 & 3 minggu lalu WAJIB masuk Shift 2 (6 orang) + 1 acak dari S2 lama
        currentS2 = [...prevS1S3, shuffledPrevS2[0]];

        // Sisa anggota S2 minggu lalu (6 orang) dibagi rata ke Shift 1 dan 3
        currentS1 = shuffledPrevS2.slice(1, 4);
        currentS3 = shuffledPrevS2.slice(4, 7);

        // Simpan state untuk rotasi minggu depan
        prevS1S3 = [...currentS1, ...currentS3];
        prevS2 = [...currentS2];
      }

      if (isHoliday) {
        newSchedule.push({
          date: date,
          isHoliday: true,
          holidayReason: isWeekend
            ? 'Libur Akhir Pekan'
            : 'Libur Nasional / Cuti Bersama',
          shift1: [],
          shift2: [],
          shift3: [],
        });
      } else {
        newSchedule.push({
          date: date,
          isHoliday: false,
          shift1: currentS1,
          shift2: currentS2,
          shift3: currentS3,
        });
      }
    }
    setSchedule(newSchedule);
  };

  const handlePrint = () => {
    // Memberikan fokus ke halaman agar print dialog bisa muncul dengan baik
    window.focus();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportExcel = () => {
    if (schedule.length === 0) {
      setError(
        'Silakan generate jadwal terlebih dahulu sebelum mengekspor ke Excel.'
      );
      return;
    }

    // Membuat struktur HTML yang dikenali oleh Excel (.xls) untuk menghindari isu CSV yang berantakan
    let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
          th, td { border: 1px solid #000000; padding: 8px; text-align: left; }
          th { background-color: #e2e8f0; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Jadwal Shift Tim - ${months[month]} ${year}</h2>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Shift 1 (05:30 - 14:30)</th>
              <th>Shift 2 (08:00 - 17:00)</th>
              <th>Shift 3 (14:00 - Selesai)</th>
            </tr>
          </thead>
          <tbody>
    `;

    schedule.forEach((day) => {
      if (day.isHoliday) {
        tableHTML += `
          <tr style="background-color: #fef2f2; color: #dc2626;">
            <td>${formatDate(day.date)}</td>
            <td colspan="3" style="text-align: center; font-weight: bold;">${
              day.holidayReason
            }</td>
          </tr>
        `;
      } else {
        tableHTML += `
          <tr>
            <td>${formatDate(day.date)}</td>
            <td>${day.shift1.join(', ')}</td>
            <td>${day.shift2.join(', ')}</td>
            <td>${day.shift3.join(', ')}</td>
          </tr>
        `;
      }
    });

    tableHTML += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Jadwal_Shift_${months[month]}_${year}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="text-blue-600" />
              Generator Jadwal Shift Tim
            </h1>
            <p className="text-slate-500 mt-1">
              Mengacak otomatis 13 personil ke dalam 3 shift (Senin - Jumat)
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors print:hidden"
            >
              <Download size={18} />
              Export .xls
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors print:hidden"
            >
              <Printer size={18} />
              Cetak PDF
            </button>
            <button
              onClick={generateSchedule}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium shadow-sm print:hidden"
            >
              <RefreshCw size={18} />
              Generate Jadwal
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Pengaturan */}
          <aside className="lg:col-span-1 space-y-6 print:hidden">
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <Clock size={20} className="text-slate-600" />
                Periode
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bulan
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full rounded-lg border-slate-300 border p-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tahun
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full rounded-lg border-slate-300 border p-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tanggal Libur (Opsional)
                  </label>
                  <input
                    type="text"
                    value={holidaysText}
                    onChange={(e) => setHolidaysText(e.target.value)}
                    placeholder="Misal: 1, 17, 25"
                    className="w-full rounded-lg border-slate-300 border p-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Isi tanggal libur dipisah koma.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users size={20} className="text-slate-600" />
                  Daftar Personil
                </h2>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  Harus 13
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Satu nama per baris. Ubah nama di bawah ini sesuai dengan
                anggota tim Anda.
              </p>

              <textarea
                value={membersText}
                onChange={(e) => setMembersText(e.target.value)}
                rows={14}
                className={`w-full rounded-lg border p-3 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                  error
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-slate-300'
                }`}
                placeholder="Masukkan 13 nama personil..."
              />
              {error && (
                <div className="mt-2 text-sm text-red-600 flex items-start gap-1">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </aside>

          {/* Area Utama: Tabel Jadwal */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {schedule.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
                  <Calendar size={48} className="text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700">
                    Belum ada jadwal
                  </h3>
                  <p className="mt-1">
                    Silakan atur personil dan klik "Generate Jadwal" untuk
                    memulai.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-4 font-semibold w-48">
                          Tanggal
                        </th>
                        <th className="px-4 py-4 font-semibold">
                          <div className="text-blue-700">Shift 1 (3 Orang)</div>
                          <div className="text-xs font-normal text-slate-500 mt-0.5">
                            05:30 - 14:30
                          </div>
                        </th>
                        <th className="px-4 py-4 font-semibold">
                          <div className="text-emerald-700">
                            Shift 2 (7 Orang)
                          </div>
                          <div className="text-xs font-normal text-slate-500 mt-0.5">
                            08:00 - 17:00
                          </div>
                        </th>
                        <th className="px-4 py-4 font-semibold">
                          <div className="text-amber-700">
                            Shift 3 (3 Orang)
                          </div>
                          <div className="text-xs font-normal text-slate-500 mt-0.5">
                            14:00 - Selesai
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedule.map((day, idx) => (
                        <tr
                          key={idx}
                          className={
                            day.isHoliday
                              ? 'bg-red-50/50 hover:bg-red-50 transition-colors'
                              : 'hover:bg-slate-50 transition-colors'
                          }
                        >
                          <td
                            className={`px-4 py-4 align-top font-medium ${
                              day.isHoliday ? 'text-red-600' : 'text-slate-800'
                            }`}
                          >
                            {formatDate(day.date)}
                          </td>
                          {day.isHoliday ? (
                            <td
                              colSpan={3}
                              className="px-4 py-4 align-middle text-center"
                            >
                              <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold border border-red-200">
                                {day.holidayReason}
                              </span>
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-4 align-top">
                                <div className="flex flex-wrap gap-1.5">
                                  {day.shift1.map((name) => (
                                    <span
                                      key={name}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100 whitespace-nowrap"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="flex flex-wrap gap-1.5">
                                  {day.shift2.map((name) => (
                                    <span
                                      key={name}
                                      className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 whitespace-nowrap"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="flex flex-wrap gap-1.5">
                                  {day.shift3.map((name) => (
                                    <span
                                      key={name}
                                      className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-100 whitespace-nowrap"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Print Styles */}
            <style
              dangerouslySetInnerHTML={{
                __html: `
              @media print {
                @page { size: landscape; margin: 15mm; }
                body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .max-w-6xl { max-w: 100%; padding: 0; }
                .bg-white { box-shadow: none !important; border: none !important; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #cbd5e1 !important; padding: 12px 8px !important; }
                th { background-color: #f8fafc !important; }
                .print\\:hidden { display: none !important; }
                
                /* Memaksa warna background dan teks tetap solid ketika di print */
                .bg-blue-50 { background-color: #eff6ff !important; }
                .text-blue-700 { color: #1d4ed8 !important; }
                .border-blue-100 { border-color: #dbeafe !important; }
                
                .bg-emerald-50 { background-color: #ecfdf5 !important; }
                .text-emerald-700 { color: #047857 !important; }
                .border-emerald-100 { border-color: #d1fae5 !important; }
                
                .bg-amber-50 { background-color: #fffbeb !important; }
                .text-amber-700 { color: #b45309 !important; }
                .border-amber-100 { border-color: #fef3c7 !important; }
                
                /* Memaksa warna baris libur tetap merah ketika di print */
                .bg-red-100 { background-color: #fee2e2 !important; }
                .text-red-700 { color: #b91c1c !important; }
                .border-red-200 { border-color: #fecaca !important; }
                .text-red-600 { color: #dc2626 !important; }
                .bg-red-50\\/50 { background-color: #fef2f2 !important; }
              }
            `,
              }}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
