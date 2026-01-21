import React, { useState, useMemo } from 'react';
import { RefreshCw, Clock, Database, ChevronRight, LayoutDashboard, ListTodo, Calendar, Filter, HardDrive, Search, ArrowUp, ArrowDown } from 'lucide-react';

const App = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filter & Sort States
  const [statusFilter, setStatusFilter] = useState('pendiente');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created', direction: 'desc' });

  // Pagination & Local Search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 100;

  // Timer & Progress
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  const fetchItems = async (forceRefresh = false) => {
    setLoading(true);
    setHasSearched(true);
    setElapsedTime(0);
    setProgress(0); // Start at 0
    if (forceRefresh) setCurrentPage(1); 

    // Timer Interval
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);

    // Progress Simulation Interval
    // Moves fast initially, then slows down to approach 90% without hitting 100% until done
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // Cap at 90% while waiting
        const remaining = 90 - prev;
        const add = remaining * 0.05; // Reduced from 0.1 to 0.05 for slower growth
        return prev + (add < 0.2 ? 0.2 : add); // Minimum increment reduced
      });
    }, 800); // Increased interval from 200ms to 800ms

    try {
      let url = `/api/items?status=${statusFilter}`;
      if (fromDate) url += `&from_date=${fromDate}`;
      if (toDate) url += `&to_date=${toDate}`;
      if (forceRefresh) url += `&force_refresh=true`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error de conexión con el servidor');
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(timerInterval);
      clearInterval(progressInterval);
      setProgress(100); // Snap to 100%
      // Allow user to see 100% briefly before hiding? 
      // The loading state controls visibility, so we might want a slight delay or just let it vanish.
      // For now, let's just turn off loading which hides the bar. 
      // To show the "completion" effect, we'd need to separate loading state from bar visibility, 
      // but simple is better here.
      setTimeout(() => setLoading(false), 200); // Short delay to show full bar
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Local filtering & Sorting & Stats
  const { filteredAndSortedItems, stats } = useMemo(() => {
    const result = items.filter(item => {
      // Robust null checks for item fields
      const title = String(item?.title || "").toLowerCase();
      const id = String(item?.id || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = title.includes(search) || id.includes(search);
      
      if (!item?.created) return matchesSearch;
      
      try {
        const itemDate = new Date(item.created).toISOString().split('T')[0];
        const matchesFrom = !fromDate || itemDate >= fromDate;
        const matchesTo = !toDate || itemDate <= toDate;
        return matchesSearch && matchesFrom && matchesTo;
      } catch (e) {
        return matchesSearch; // Fallback if date is invalid
      }
    });

    // Stats Calculation (Efficiently on the whole set or filtered set?)
    // User probably wants stats on the CURRENTLY FETCHED set (items)
    const list1Count = items.filter(i => String(i?.list || "").includes('Lista 1')).length;
    const list2Count = items.filter(i => String(i?.list || "").includes('Lista 2')).length;

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key] ?? "";
        let valB = b[sortConfig.key] ?? "";

        if (sortConfig.key === 'created') {
          valA = valA ? new Date(valA) : new Date(0);
          valB = valB ? new Date(valB) : new Date(0);
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return { filteredAndSortedItems: result, stats: { list1: list1Count, list2: list2Count, total: items.length } };
  }, [items, searchTerm, fromDate, toDate, sortConfig]);

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setSortConfig({ key: 'created', direction: 'desc' });
    setCurrentPage(1);
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedItems.length / pageSize);
  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="dashboard-container">
      {/* Background Glows (Fixed in CSS) */}
      <div className="bg-glow-top" />
      <div className="bg-glow-bottom" />
      
      {/* Header Section */}
      <header className="flex justify-between items-center mb-12 animate-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-text-dark font-bold uppercase tracking-widest text-[10px]">Portal de Auditoría Avanzada</span>
          </div>
          <h1 className="text-5xl font-extrabold title-gradient">Visor de Gestiones</h1>
          <p className="text-text-dim mt-2 text-lg">Control centralizado de gestiones SharePoint</p>
        </div>
        
        <div className="connection-status glass rounded-3xl flex items-center gap-6 bg-white-5 p-5 px-8 whitespace-nowrap">
           <div className="flex items-center gap-4">
              <div className="text-[11px] uppercase font-bold text-text-dark tracking-widest border-r border-border pr-4">
                Estado de Conexión
              </div>
              <div className="text-accent text-base font-bold flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 Graph API Online
              </div>
           </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="glass p-6 mb-10 border-red-500/20 bg-red-500/5 animate-in flex items-center gap-4 text-red-400">
           <div className="p-3 bg-red-500/10 rounded-xl">
              <Filter className="w-6 h-6" />
           </div>
           <div>
              <div className="text-[10px] uppercase font-bold opacity-60 tracking-wider">Error Detectado</div>
              <div className="text-lg font-bold">{error}</div>
           </div>
           <button onClick={() => fetchItems(true)} className="ml-auto btn-secondary !py-2 !px-4 text-xs font-bold">Reintentar</button>
        </div>
      )}

      {/* Structured Filter Bar */}
      <section className="glass p-8 mb-10 animate-in relative overflow-hidden">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
             <div className="h-full bg-accent shiny-progress-bar" style={{ width: `${progress}%`, transition: 'width 0.2s ease-out' }} />
          </div>
        )}
        
        <div className="filter-bar">
          {/* Status Selection */}
          <div className="date-input-group">
            <label>Estado de Gestión</label>
            <div className="segmented-control">
              <button 
                onClick={() => setStatusFilter('pendiente')}
                className={statusFilter === 'pendiente' ? 'active' : ''}
              >
                Pendientes
              </button>
              <button 
                onClick={() => setStatusFilter('procesados')}
                className={statusFilter === 'procesados' ? 'active' : ''}
              >
                Procesados
              </button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="flex items-center gap-6">
            <div className="date-input-group">
              <label>Fecha Inicial (Desde)</label>
              <div className="premium-input-container">
                <Calendar size={16} />
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="premium-input cursor-pointer"
                />
              </div>
            </div>

            <div className="date-input-group">
              <label>Fecha Final (Hasta)</label>
              <div className="premium-input-container">
                <Calendar size={16} />
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="premium-input cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 items-end">
            <button 
              onClick={clearFilters}
              className="btn-secondary h-12 px-6"
              title="Restablecer todos los filtros"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
            
            {/* Force Refresh Button */}
             <button 
              onClick={() => fetchItems(true)}
              className="btn-secondary h-12 px-6 text-accent border-accent/30 hover:bg-accent/10"
              title="Forzar recarga de datos frescos"
              disabled={loading}
            >
              <Database className="w-4 h-4" />
              <span>Recargar</span>
            </button>

            <button 
              onClick={() => fetchItems(false)}
              className="btn-primary h-12 px-8 min-w-[170px]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[9px] uppercase tracking-wider opacity-70">Cargando</span>
                    <span className="font-mono text-xs">{elapsedTime.toFixed(1)}s</span>
                  </div>
                  <RefreshCw className="w-5 h-5 animate-spin ml-auto opacity-50" />
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span className="font-bold">Consultar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid-auto mb-10">
        <StatCard 
          icon={<LayoutDashboard />}
          label={`Total ${statusFilter}`}
          value={hasSearched ? stats.total : '—'}
          color="var(--primary)"
          delay="0.2s"
        />
        <StatCard 
          icon={<Database />}
          label="Gestión (Lista 1)"
          value={hasSearched ? stats.list1 : '—'}
          color="var(--secondary)"
          delay="0.3s"
        />
        <StatCard 
          icon={<HardDrive />}
          label="Migración (Lista 2)"
          value={hasSearched ? stats.list2 : '—'}
          color="var(--accent)"
          delay="0.4s"
        />
      </div>

      {/* Results Table */}
      <div className="glass overflow-hidden animate-in">
        <div className="px-12 py-8 border-b border-border flex justify-between items-center bg-white-5">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                   <ListTodo className="text-primary w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Base de Datos de Gestiones</h2>
             </div>
             
             {/* Local Search Input */}
             {hasSearched && (
               <div className="premium-input-container">
                 <Search size={14} />
                 <input 
                   type="text" 
                   placeholder="Buscar en resultados..."
                   value={searchTerm}
                   onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                   className="premium-input !w-[300px] !py-2 !text-xs"
                 />
               </div>
             )}
          </div>

          {hasSearched && !loading && (
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-bold text-text-dark bg-white-5 px-3 py-1.5 rounded-full uppercase tracking-wider">
                 {filteredAndSortedItems.length} Registros Encontrados
              </div>
              <div className="text-xs font-bold text-accent bg-accent/5 px-3 py-1.5 rounded-full border border-accent/20">
                 Sincronizado
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th 
                  className="text-left sortable-header"
                  onClick={() => handleSort('title')}
                  style={{ width: '15%' }}
                >
                  <div className="flex items-center gap-2">
                    Identificador
                    <SortIcon column="title" sortConfig={sortConfig} />
                  </div>
                </th>
                <th 
                  className="text-left sortable-header"
                  onClick={() => handleSort('list')}
                  style={{ width: '35%' }}
                >
                  <div className="flex items-center gap-2">
                    Origen
                    <SortIcon column="list" sortConfig={sortConfig} />
                  </div>
                </th>
                <th 
                  className="text-left sortable-header"
                  onClick={() => handleSort('created')}
                  style={{ width: '15%' }}
                >
                  <div className="flex items-center gap-2">
                    Fecha
                    <SortIcon column="created" sortConfig={sortConfig} />
                  </div>
                </th>
                <th 
                  className="text-left sortable-header"
                  onClick={() => handleSort('status')}
                  style={{ width: '20%' }}
                >
                  <div className="flex items-center gap-2">
                    Estatus
                    <SortIcon column="status" sortConfig={sortConfig} />
                  </div>
                </th>
                <th className="text-right" style={{ width: '15%' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {hasSearched && paginatedItems.map((item) => (
                <tr key={item?.id || Math.random()} className="hover:bg-white-5 transition-all group">
                  <td className="whitespace-nowrap">
                    <div className="text-white font-bold group-hover:text-primary transition-colors text-sm">{item?.title || 'Sin Título'}</div>
                    <div className="text-[9px] text-text-dark font-mono uppercase mt-0.5 opacity-60">{(item?.id?.split?.(',')[2]) || item?.id || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${String(item?.list || "").includes('Lista 1') ? 'bg-secondary' : 'bg-accent'}`} />
                       <span className="text-text-dim text-xs font-semibold truncate" title={item?.list || ''}>
                         {String(item?.list || "").split('(')[1]?.replace(')', '') || item?.list || 'N/A'}
                       </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="text-text-dim text-xs flex items-center gap-2">
                       <Clock size={12} className="text-text-dark" />
                       {item?.created ? new Date(item.created).toLocaleDateString('es-ES', { 
                          day: '2-digit', month: '2-digit', year: '2-digit'
                       }) : 'N/A'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`status-badge ${String(item?.status || "").toLowerCase()}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${String(item?.status || "").toLowerCase() === 'pendiente' ? 'bg-[#fb7185]' : 'bg-[#34d399]'}`} />
                      {item?.status || 'N/A'}
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <button className="table-icon-btn w-8 h-8 hover:bg-primary/20 rounded-lg transition-all text-text-dark hover:text-primary ml-auto flex-center">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {(!hasSearched || (filteredAndSortedItems.length === 0 && !loading)) && (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <div className="flex-center flex-col gap-4 opacity-60">
                      <div className="w-16 h-16 bg-white-5 rounded-2xl flex-center mb-2">
                        <Filter size={32} className="text-text-dark" />
                      </div>
                      <div className="max-w-xs">
                        <p className="text-text-main font-bold mb-1">
                          {!hasSearched ? 'Lista para consultar' : 'Sin resultados'}
                        </p>
                        <p className="text-text-dim text-xs">
                          {!hasSearched 
                            ? 'Usa la barra superior para filtrar los datos de SharePoint por fecha y estado.' 
                            : 'No se encontraron registros que coincidan con la búsqueda.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {hasSearched && totalPages > 1 && (
          <div className="p-6 border-t border-border flex justify-between items-center bg-white/[0.01]">
            <div className="text-xs text-text-dark font-bold uppercase tracking-wider">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary px-4 py-2 rounded-lg text-xs font-bold border border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all text-white"
              >
                Anterior
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary px-4 py-2 rounded-lg text-xs font-bold border border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all text-white"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-border text-center animate-in">
         <p className="text-text-dark text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
            PPruebas de Anghelo
         </p>
         <div className="flex-center gap-2 opacity-30">
            <div className="w-1 h-1 rounded-full bg-white" />
            <div className="w-1 h-1 rounded-full bg-white" />
            <div className="w-1 h-1 rounded-full bg-white" />
         </div>
      </footer>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, delay }) => (
  <div className="glass glass-interactive stat-card animate-in" style={{ animationDelay: delay }}>
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-white-5 rounded-xl group-hover:scale-110 transition-all duration-300" style={{ color }}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
    </div>
    <div className="text-text-dark text-[9px] font-bold uppercase tracking-[0.1em] mb-1">{label}</div>
    <div className="text-4xl font-extrabold text-white tracking-tighter tabular-nums">{value}</div>
  </div>
);

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) {
    return <Filter size={12} className="sort-icon opacity-20" />;
  }
  return sortConfig.direction === 'asc' ? 
    <ArrowUp size={12} className="text-primary" /> : 
    <ArrowDown size={12} className="text-primary" />;
};

export default App;
