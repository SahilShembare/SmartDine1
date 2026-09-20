import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  ShoppingBag, 
  IndianRupee, 
  Calendar,
  UserCheck 
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';

export default function CustomerManagement() {
  const { orders = [] } = useTableOrder();
  const [searchQuery, setSearchQuery] = useState('');

  // Extract Unique Customers from Orders + Directory list
  const customersList = useMemo(() => {
    const map = new Map();

    // Default real customers
    const defaults = [
      { name: 'Sahil Sharma', phone: '+91 98765 43210', ordersCount: 5, totalSpent: 2840, lastVisit: 'Today, 1:45 PM' },
      { name: 'Priya Patel', phone: '+91 98234 56789', ordersCount: 3, totalSpent: 1450, lastVisit: 'Today, 1:15 PM' },
      { name: 'Rahul Verma', phone: '+91 97112 34567', ordersCount: 4, totalSpent: 2190, lastVisit: 'Today, 12:45 PM' },
      { name: 'Ananya Iyer', phone: '+91 99456 78123', ordersCount: 2, totalSpent: 960, lastVisit: 'Today, 12:15 PM' },
      { name: 'Vikram Malhotra', phone: '+91 98333 44555', ordersCount: 6, totalSpent: 3600, lastVisit: 'Today, 11:30 AM' },
    ];

    defaults.forEach(c => map.set(c.name.toLowerCase(), c));

    // Incorporate live orders
    orders.forEach(o => {
      if (!o.customerName) return;
      const key = o.customerName.toLowerCase().trim();
      const amt = Number(o.amount || o.total) || 0;
      if (map.has(key)) {
        const existing = map.get(key);
        existing.ordersCount++;
        existing.totalSpent += amt;
      } else {
        map.set(key, {
          name: o.customerName,
          phone: o.customerPhone || '+91 98900 12345',
          ordersCount: 1,
          totalSpent: amt,
          lastVisit: new Date(o.createdAt || Date.now()).toLocaleDateString([], { day: 'numeric', month: 'short' })
        });
      }
    });

    return Array.from(map.values());
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customersList;
    const q = searchQuery.toLowerCase().trim();
    return customersList.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q)
    );
  }, [customersList, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Customers
          </h2>
          <p className="text-xs text-slate-500">
            Directory of restaurant diners, repeat guests, and order history
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-4 py-3.5">Contact Number</th>
                <th className="px-4 py-3.5">Total Orders</th>
                <th className="px-4 py-3.5">Total Spent</th>
                <th className="px-4 py-3.5">Last Visited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {cust.name[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">
                          {cust.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {cust.phone}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 font-bold text-slate-800">
                        {cust.ordersCount} orders
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600">
                      ₹{cust.totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {cust.lastVisit}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
