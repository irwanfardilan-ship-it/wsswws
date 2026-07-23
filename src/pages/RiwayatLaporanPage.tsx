import React, { useState, useMemo, useEffect } from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { useReports } from '../hooks/useReports';
import { History, Search, Calendar, RefreshCw, Eye, UserCheck, Star, Share2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../telegram/webapp';

export const RiwayatLaporanPage: React.FC = () => {
  const { reports, isLoading, refetch } = useReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate]);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = filterDate ? report.date === filterDate : true;

    return matchesSearch && matchesDate;
  });

  const paginatedReports = useMemo(() => {
    return filteredReports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  return (
    <div className="space-y-5 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            <span>Riwayat Laporan</span>
          </h2>
          <p className="text-xs text-slate-400">
            Daftar riwayat laporan kinerja rekrutmen.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search controls */}
      <GlassCard className="p-3.5 space-y-3 border-slate-800">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID / Nama / Catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-10 pr-3 py-2 text-xs text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {(searchTerm || filterDate) && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDate('');
              }}
              className="text-[11px] text-sky-400 hover:underline font-medium"
            >
              Reset Filter
            </button>
          </div>
        )}
      </GlassCard>

      {/* Report Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Memuat riwayat laporan...
          </div>
        ) : filteredReports.length === 0 ? (
          <GlassCard className="py-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Belum Ada Laporan</p>
            <p className="text-xs text-slate-500">
              {searchTerm || filterDate
                ? 'Tidak ada laporan yang sesuai dengan filter pencarian.'
                : 'Silakan isi laporan harian pertama Anda di menu Laporan.'}
            </p>
          </GlassCard>
        ) : (
          <>
            {paginatedReports.map((item) => (
              <GlassCard key={item.reportId} className="p-4 space-y-3 border-slate-800 hover:border-slate-700">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div>
                    <span className="text-xs font-bold text-white block">{item.name}</span>
                    <span className="text-[10px] text-sky-400 font-mono">
                      ID: {item.reportId}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-400 block">{item.date}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3 text-blue-400" /> Vis
                    </span>
                    <span className="font-bold text-white mt-0.5 block">{item.visit}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                      <UserCheck className="w-3 h-3 text-sky-400" /> Pel
                    </span>
                    <span className="font-bold text-white mt-0.5 block">{item.applicant}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 text-emerald-400" /> Qual
                    </span>
                    <span className="font-bold text-white mt-0.5 block">{item.quality}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                      <Share2 className="w-3 h-3 text-indigo-400" /> Post
                    </span>
                    <span className="font-bold text-white mt-0.5 block">{item.posting}</span>
                  </div>
                </div>

                {item.note && (
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Catatan:</span>
                    <p className="mt-0.5 text-xs text-slate-300 italic">{item.note}</p>
                  </div>
                )}
              </GlassCard>
            ))}

            {/* Pagination Controls */}
            {filteredReports.length > ITEMS_PER_PAGE && (() => {
              const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
              return (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-xl mt-4">
                  <div className="text-[10px] font-bold text-slate-400 text-center sm:text-left">
                    Menampilkan <span className="text-white font-black">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredReports.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)}</span> dari <span className="text-white font-black">{filteredReports.length}</span> laporan
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(prev => prev - 1);
                          triggerHaptic('selection');
                        }
                      }}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 border ${
                        currentPage === 1
                          ? 'bg-slate-900/40 text-slate-600 border-slate-800/40 cursor-not-allowed'
                          : 'bg-slate-900 text-sky-400 border-slate-700 hover:bg-slate-800 hover:text-white shadow-sm cursor-pointer'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .map((p, idx, arr) => {
                          const showDots = idx > 0 && p - arr[idx - 1] > 1;
                          return (
                            <React.Fragment key={p}>
                              {showDots && <span className="text-slate-600 text-[10px] px-0.5">..</span>}
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentPage(p);
                                  triggerHaptic('selection');
                                }}
                                className={`w-7 h-7 rounded-xl text-[10px] font-black transition-all border ${
                                  currentPage === p
                                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white cursor-pointer'
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (currentPage < totalPages) {
                          setCurrentPage(prev => prev + 1);
                          triggerHaptic('selection');
                        }
                      }}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 border ${
                        currentPage === totalPages
                          ? 'bg-slate-900/40 text-slate-600 border-slate-800/40 cursor-not-allowed'
                          : 'bg-slate-900 text-sky-400 border-slate-700 hover:bg-slate-800 hover:text-white shadow-sm cursor-pointer'
                      }`}
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};
