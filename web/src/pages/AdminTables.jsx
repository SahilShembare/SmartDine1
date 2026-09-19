import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { useTableOrder } from '../context/TableOrderContext';
import { localStore, isFirebaseConfigured, db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { formatOrderNumber } from '../utils/orderNumber';
import { 
  Plus, 
  QrCode, 
  Printer, 
  Download, 
  ExternalLink, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Sparkles,
  UtensilsCrossed,
  Users,
  Clock,
  UserCheck,
  AlertCircle,
  Timer,
  CheckCircle2,
  ArrowRight,
  Search,
  SlidersHorizontal
} from 'lucide-react';

export default function AdminTables() {
  const { 
    tables, 
    setTables, 
    orders, 
    assignTableToWaitingOrder,
    deleteTable,
    updateTable,
    addTable,
    resetToRealTables
  } = useTableOrder();

  const [selectedTableForQR, setSelectedTableForQR] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  
  // Table Delete Modal State
  const [tableToDelete, setTableToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Real Tables Setup Modal State
  const [isRealTablesModalOpen, setIsRealTablesModalOpen] = useState(false);
  const [realTableCount, setRealTableCount] = useState(6);
  const [isResetting, setIsResetting] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [baseUrl, setBaseUrl] = useState(() => {
    return window.location.origin || 'https://smartdine.netlify.app';
  });

  const [defaultWaitTime, setDefaultWaitTime] = useState(() => {
    return localStore.getTableWaitingTime ? localStore.getTableWaitingTime() : 15;
  });
  const [selectedAssignments, setSelectedAssignments] = useState({});
  const [assigningId, setAssigningId] = useState(null);

  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '4',
    location: 'Main Dining Hall',
    active: true
  });

  // Active waiting queue orders
  const waitingOrders = (orders || []).filter(o => 
    o.waitingForTable && 
    o.status !== 'completed' && 
    o.status !== 'cancelled'
  );

  // Helper to find order currently occupying a table
  const getTableOccupant = (tableNum) => {
    const formatted = String(tableNum).padStart(2, '0');
    return (orders || []).find(o => 
      !o.waitingForTable && 
      o.status !== 'completed' && 
      o.status !== 'cancelled' && 
      String(o.tableNumber).padStart(2, '0') === formatted
    );
  };

  // Available active tables
  const availableTables = tables.filter(t => 
    t.active !== false && !getTableOccupant(t.tableNumber)
  );

  const occupiedTablesCount = tables.filter(t => getTableOccupant(t.tableNumber)).length;

  const handleAssignTable = async (orderId) => {
    const targetTable = selectedAssignments[orderId] || (availableTables[0]?.tableNumber);
    if (!targetTable) {
      toast.error('No tables available or selected. Please select a table.');
      return;
    }
    setAssigningId(orderId);
    try {
      await assignTableToWaitingOrder(orderId, targetTable);
      toast.success(`Order assigned to Table ${targetTable}!`);
    } catch (err) {
      console.error('Error assigning table:', err);
      toast.error('Failed to assign table');
    } finally {
      setAssigningId(null);
    }
  };

  const handleWaitTimeChange = (mins) => {
    const parsed = Math.max(1, parseInt(mins, 10) || 15);
    setDefaultWaitTime(parsed);
    if (localStore.setTableWaitingTime) {
      localStore.setTableWaitingTime(parsed);
    }
  };

  const getQRUrl = (tableNum) => {
    const formatted = String(tableNum).padStart(2, '0');
    return `${baseUrl}/menu?table=${formatted}`;
  };

  const getDeepLink = (tableNum) => {
    const formatted = String(tableNum).padStart(2, '0');
    return `smartdine://table/${formatted}`;
  };

  const handleOpenAdd = () => {
    setEditingTable(null);
    // Find smallest unused positive number for convenience
    const existingNums = new Set(tables.map(t => parseInt(t.tableNumber, 10)).filter(n => !isNaN(n)));
    let nextCandidate = 1;
    while (existingNums.has(nextCandidate)) {
      nextCandidate++;
    }
    const nextNum = String(nextCandidate).padStart(2, '0');
    setFormData({
      tableNumber: nextNum,
      capacity: '4',
      location: 'Main Dining Hall',
      active: true
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity || '4',
      location: table.location || 'Main Dining Hall',
      active: table.active !== undefined ? table.active : true
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedNum = String(formData.tableNumber).trim().padStart(2, '0');
    
    // Check duplicate tableNumber
    const duplicate = tables.find(t => 
      String(t.tableNumber).padStart(2, '0') === formattedNum && 
      (!editingTable || t.id !== editingTable.id)
    );
    if (duplicate) {
      toast.error(`Table ${formattedNum} already exists! Please choose another table number.`, {
        icon: '⚠️'
      });
      return;
    }

    const tableData = {
      tableNumber: formattedNum,
      capacity: parseInt(formData.capacity) || 4,
      location: (formData.location || 'Main Dining Hall').trim(),
      active: formData.active,
      qrUrl: getQRUrl(formattedNum),
      deepLink: getDeepLink(formattedNum)
    };

    try {
      if (editingTable) {
        await updateTable(editingTable.id, tableData);
        toast.success(`Table ${formattedNum} updated successfully!`);
      } else {
        await addTable(tableData);
        toast.success(`Table ${formattedNum} created & QR ready!`);
      }
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Save table error:', err);
      toast.error(err.message || 'Failed to save table.');
    }
  };

  // Permanent Delete Handler
  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTable(tableToDelete.id);
      toast.success(`Table ${tableToDelete.tableNumber} deleted permanently!`, {
        icon: '🗑️',
        duration: 3500
      });
      setTableToDelete(null);
    } catch (err) {
      console.error('Delete table error:', err);
      toast.error(err.message || 'Failed to delete table. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Setup Real Tables Handler (Clears demo tables)
  const handleConfirmRealTables = async () => {
    setIsResetting(true);
    try {
      const count = Math.max(1, Math.min(50, parseInt(realTableCount, 10) || 6));
      await resetToRealTables(count);
      toast.success(`Configured ${count} real restaurant tables! All demo tables cleared.`, {
        icon: '✨',
        duration: 4000
      });
      setIsRealTablesModalOpen(false);
    } catch (err) {
      console.error('Real tables setup error:', err);
      toast.error('Failed to configure real tables');
    } finally {
      setIsResetting(false);
    }
  };

  const toggleTableActive = async (table) => {
    const newStatus = !table.active;
    try {
      await updateTable(table.id, { active: newStatus });
      toast.success(newStatus ? `Table ${table.tableNumber} activated!` : `Table ${table.tableNumber} disabled`);
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error('Failed to change table status');
    }
  };

  // Download QR Code as image
  const downloadQR = (tableNum) => {
    const canvas = document.getElementById(`qr-canvas-${tableNum}`);
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `SmartDine_Table_${tableNum}_QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handlePrintAll = () => {
    window.print();
  };

  // Filtered Tables List
  const filteredTables = tables.filter(t => {
    const occupant = getTableOccupant(t.tableNumber);
    const matchesSearch = 
      String(t.tableNumber).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.location && t.location.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'available') return t.active !== false && !occupant;
    if (filterStatus === 'occupied') return Boolean(occupant);
    if (filterStatus === 'inactive') return t.active === false;
    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950">
      <div className="no-print">
        <Sidebar mode="admin" />
      </div>

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        
        {/* Top Header */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Table & QR Code Manager
              <span className="p-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30">
                <QrCode className="w-5 h-5" />
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage real restaurant tables, live waiting queue, and contactless QR standees
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsRealTablesModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Configure actual restaurant table count and clear demo data"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Real Tables Setup</span>
            </button>

            <button
              onClick={handlePrintAll}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Print All Standees</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs shadow-glow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
          </div>
        </div>

        {/* Live Table Availability & Queue Stats Bar */}
        <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Tables</p>
              <p className="text-2xl font-black text-white mt-1">{tables.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Available Now</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{availableTables.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Occupied</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{occupiedTablesCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
            waitingOrders.length > 0 
              ? 'bg-orange-950/20 border-orange-500/40' 
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">Waiting Queue</p>
                {waitingOrders.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
                )}
              </div>
              <p className="text-2xl font-black text-orange-400 mt-1">{waitingOrders.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Live Dine-In Waiting Queue Section */}
        {waitingOrders.length > 0 && (
          <div className="no-print p-5 rounded-2xl bg-gradient-to-br from-orange-950/30 via-slate-900 to-slate-900 border-2 border-orange-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-white">Live Dine-In Waiting Queue</h2>
                    <span className="px-2 py-0.5 rounded-full bg-orange-500 text-black text-xs font-black">
                      {waitingOrders.length} Waiting
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Customers awaiting table assignment. Assign an available table to notify them immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <Timer className="w-4 h-4 text-orange-400" />
                <span className="text-slate-300 font-medium">Default Est. Wait:</span>
                <input
                  type="number"
                  min="5"
                  max="120"
                  step="5"
                  value={defaultWaitTime}
                  onChange={(e) => handleWaitTimeChange(e.target.value)}
                  className="w-14 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-center text-orange-400 font-bold focus:outline-none focus:border-orange-500"
                />
                <span className="text-slate-400">min</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitingOrders.map((order, idx) => {
                const position = order.waitingQueuePosition || (idx + 1);
                const waitMins = order.estimatedWaitMinutes || defaultWaitTime;
                const assignedTable = selectedAssignments[order.id] || (availableTables[0]?.tableNumber || '');

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-slate-900/90 border border-orange-500/30 shadow-md flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-black">
                            Queue #{position}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {order.customerName || 'Dine-In Guest'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">
                          Order #{formatOrderNumber(order.orderNumber || order.id)} • {order.items?.length || 0} items
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          ~{waitMins} min
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
                      <div className="line-clamp-2">
                        {order.items?.map(it => `${it.quantity || 1}x ${it.name}`).join(', ') || 'No item details'}
                      </div>
                    </div>

                    {/* Table Assignment Row */}
                    <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                      <select
                        value={assignedTable}
                        onChange={(e) => setSelectedAssignments({
                          ...selectedAssignments,
                          [order.id]: e.target.value
                        })}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
                      >
                        {availableTables.length > 0 ? (
                          availableTables.map(t => (
                            <option key={t.id} value={t.tableNumber}>
                              Table {t.tableNumber} ({t.capacity || 4} seats)
                            </option>
                          ))
                        ) : (
                          tables.map(t => (
                            <option key={t.id} value={t.tableNumber}>
                              Table {t.tableNumber} {getTableOccupant(t.tableNumber) ? '(Occupied)' : ''}
                            </option>
                          ))
                        )}
                      </select>

                      <button
                        onClick={() => handleAssignTable(order.id)}
                        disabled={assigningId === order.id}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1 shadow disabled:opacity-50 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Seat</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="no-print p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search table number or location..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: `All (${tables.length})` },
              { key: 'available', label: `Available (${availableTables.length})` },
              { key: 'occupied', label: `Occupied (${occupiedTablesCount})` },
              { key: 'inactive', label: `Disabled (${tables.filter(t => t.active === false).length})` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === tab.key
                    ? 'bg-orange-500 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Base URL customizer notice */}
        <div className="no-print p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            <span className="text-slate-200 font-semibold">QR Code Target Domain: </span>
            <code className="text-orange-400 font-mono bg-slate-800 px-2 py-0.5 rounded">{baseUrl}/menu?table=XX</code>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Default Waiting Time:</span>
              <input
                type="number"
                min="5"
                max="120"
                value={defaultWaitTime}
                onChange={(e) => handleWaitTimeChange(e.target.value)}
                className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-orange-400 text-xs font-bold text-center focus:outline-none focus:border-orange-500"
              />
              <span className="text-slate-500">min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Custom Domain:</span>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500 w-56 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Tables Grid / Empty State */}
        {tables.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-xl">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Restaurant Tables Configured</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 mx-auto">
                All demo tables have been cleared. Add your actual dining tables to generate high-resolution QR standees and accept orders.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-glow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Table</span>
              </button>
              <button
                onClick={() => setIsRealTablesModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Setup Real Tables (01 to 06)</span>
              </button>
            </div>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/80 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
            <p className="font-semibold text-slate-300">No tables found matching your filter.</p>
            <p>Try searching for a different table number or switch to "All".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTables.map((table) => {
              const qrTarget = getQRUrl(table.tableNumber);
              const occupant = getTableOccupant(table.tableNumber);
              return (
                <div
                  key={table.id}
                  className={`qr-card-print rounded-2xl border bg-slate-900/90 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-orange-500/50 shadow-lg ${
                    occupant ? 'border-amber-500/40' : 'border-slate-800'
                  }`}
                >
                  
                  {/* Standee Header */}
                  <div className="p-4 bg-gradient-to-r from-slate-900 via-orange-950/20 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white">SMART DINE</h3>
                        <p className="text-[10px] text-slate-400">{table.location || 'Dine-In Area'}</p>
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-extrabold text-sm tracking-wider">
                      TABLE {table.tableNumber}
                    </div>
                  </div>

                  {/* Table Live Occupancy Banner */}
                  <div className="no-print pt-3 px-4">
                    {occupant ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                          <div>
                            <span className="text-amber-300 font-bold block">Occupied • Order #{formatOrderNumber(occupant.orderNumber || occupant.id)}</span>
                            <span className="text-[10px] text-slate-400">{occupant.customerName || 'Dine-In Guest'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {occupant.status || 'Active'}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>Vacant & Ready</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium">Available</span>
                      </div>
                    )}
                  </div>

                  {/* QR Code Display Card */}
                  <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-white rounded-2xl shadow-xl inline-block border-2 border-orange-500/30">
                      <QRCodeSVG
                        value={qrTarget}
                        size={160}
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                          src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f97316'><path d='M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z'/></svg>",
                          height: 28,
                          width: 28,
                          excavate: true,
                        }}
                      />
                      {/* Hidden canvas for downloading PNG */}
                      <div className="hidden">
                        <QRCodeCanvas
                          id={`qr-canvas-${table.tableNumber}`}
                          value={qrTarget}
                          size={512}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-200">
                        Scan to Browse & Order
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-1 break-all max-w-[240px]">
                        {qrTarget}
                      </p>
                      <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {table.capacity || 4} Seats
                        </span>
                        <span>•</span>
                        <span className={table.active !== false ? 'text-emerald-400' : 'text-red-400'}>
                          {table.active !== false ? 'Active Table' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Table Actions */}
                  <div className="no-print p-3.5 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => downloadQR(table.tableNumber)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                        title="Download High-Res PNG QR"
                      >
                        <Download className="w-3.5 h-3.5 text-orange-400" />
                        <span className="hidden sm:inline">PNG</span>
                      </button>
                      <a
                        href={`/menu?table=${table.tableNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                        title="Simulate Guest Scanning QR"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Test Scan</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleTableActive(table)}
                        className={`p-2 rounded-lg text-xs font-semibold transition ${
                          table.active !== false ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-red-400 hover:bg-red-500/10'
                        }`}
                        title={table.active !== false ? 'Deactivate Table' : 'Activate Table'}
                      >
                        {table.active !== false ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(table)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit Table"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTableToDelete(table)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete Table Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Add / Edit Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-white">
                {editingTable ? `Edit Table ${formData.tableNumber}` : 'Add New Restaurant Table'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Table Number (e.g. 01, 02) *</label>
                <input
                  type="text"
                  required
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                  placeholder="01"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="4"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Zone</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Garden Courtyard"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-orange-500 focus:ring-0"
                />
                <span className="text-xs font-medium text-slate-200">Table Active for Ordering</span>
              </label>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold text-xs shadow-glow"
                >
                  {editingTable ? 'Save Table' : 'Create Table & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-red-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Delete Table {tableToDelete.tableNumber}?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Permanent deletion • Table will be removed
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setTableToDelete(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Table Number:</span>
                  <span className="font-bold text-white">Table {tableToDelete.tableNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity:</span>
                  <span className="font-medium text-slate-200">{tableToDelete.capacity || 4} Guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-medium text-slate-200">{tableToDelete.location || 'Main Dining Hall'}</span>
                </div>
              </div>

              {(() => {
                const occupant = getTableOccupant(tableToDelete.tableNumber);
                if (occupant) {
                  return (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-amber-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Active Occupant Warning!</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        This table currently has active Order #{formatOrderNumber(occupant.orderNumber || occupant.id)} ({occupant.customerName || 'Guest'}). Deleting it will remove the table session from the live floor map.
                      </p>
                    </div>
                  );
                }
                return (
                  <p className="text-slate-400">
                    Are you sure you want to delete this table? The QR standee for this table will no longer be mapped. This change is permanent and real.
                  </p>
                );
              })()}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTableToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting Table...' : 'Yes, Delete Table'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Tables Setup Modal */}
      {isRealTablesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-orange-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-orange-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Setup Real Restaurant Tables
                  </h3>
                  <p className="text-xs text-slate-400">
                    Replace demo tables with your actual dining tables
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsRealTablesModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-300">
              <p className="text-slate-300 leading-relaxed">
                Configure your actual restaurant table count. All demo data will be cleared and replaced with your real table layout.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  How many real tables does your restaurant have?
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={realTableCount}
                    onChange={(e) => setRealTableCount(e.target.value)}
                    className="w-28 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-orange-400 text-center focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-slate-400">Tables (Table 01 to Table {String(realTableCount || 6).padStart(2, '0')})</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Real Persistent Setup
                </p>
                <p>
                  Demo tables will be cleared and replaced with your actual restaurant tables. You can also delete or add tables individually at any time.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRealTablesModalOpen(false)}
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRealTables}
                  disabled={isResetting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow disabled:opacity-50 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isResetting ? 'Configuring Tables...' : 'Save Real Tables'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
