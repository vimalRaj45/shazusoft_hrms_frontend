import React, { useState, useEffect } from 'react';
import {
  DollarSign, Calendar, Users, CheckCircle2, Clock, Download,
  Edit3, Save, RefreshCw, AlertCircle, FileText, Building2,
  CreditCard, Search, ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';
import { payrollAPI } from '../services/api';
import { generatePayslipPDF, formatINR } from '../utils/payslipGenerator';

export default function AdminPayrollManagement() {
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'structures'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [workingDaysMeta, setWorkingDaysMeta] = useState(null);
  const [records, setRecords] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Editing Structure State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [structureForm, setStructureForm] = useState({
    monthly_salary: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    pan_number: ''
  });

  // Mark Paid Modal State
  const [payingRecord, setPayingRecord] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_mode: 'Bank Transfer / NEFT',
    payment_reference: '',
    payment_date: new Date().toISOString().slice(0, 10),
    remarks: 'Disbursed via corporate payroll'
  });

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  // 1. Fetch Month Records & Working Days metadata
  const fetchMonthData = async (month) => {
    setLoading(true);
    try {
      const res = await payrollAPI.getMonthRecords(month);
      setRecords(res.data.records || []);
      setWorkingDaysMeta(res.data.workingDaysMeta || null);
    } catch (err) {
      console.error('Error fetching payroll month records:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Salary Structures
  const fetchSalaryStructures = async () => {
    try {
      const res = await payrollAPI.getSalaryStructures();
      setSalaryStructures(res.data.salary_structures || []);
    } catch (err) {
      console.error('Error fetching salary structures:', err);
    }
  };

  useEffect(() => {
    fetchMonthData(selectedMonth);
    fetchSalaryStructures();
  }, [selectedMonth]);

  // 3. Preview Month Calculation (On-the-fly preview)
  const handlePreviewCalculation = async () => {
    setCalculating(true);
    try {
      const res = await payrollAPI.calculateMonth(selectedMonth);
      setRecords(res.data.records || []);
      setWorkingDaysMeta(res.data.workingDaysMeta || null);
      showToast(`Calculation preview updated for ${selectedMonth}! Review line items before committing.`, 'info');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to calculate month payroll', 'error');
    } finally {
      setCalculating(false);
    }
  };

  // 4. Commit & Publish Month Payroll
  const handleCommitPayroll = async () => {
    if (!window.confirm(`Are you sure you want to commit and publish the payroll for ${selectedMonth}? Employees will be able to view their official payslips.`)) {
      return;
    }
    setCommitting(true);
    try {
      const res = await payrollAPI.generateMonth(selectedMonth);
      setRecords(res.data.records || []);
      setWorkingDaysMeta(res.data.workingDaysMeta || null);
      showToast(`Payroll for ${selectedMonth} published successfully!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to commit payroll', 'error');
    } finally {
      setCommitting(false);
    }
  };

  // 5. Save Salary Structure
  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    try {
      await payrollAPI.updateSalaryStructure(editingEmployee.employee_id, structureForm);
      showToast(`Salary structure saved for ${editingEmployee.employee_name}!`, 'success');
      setEditingEmployee(null);
      await fetchSalaryStructures();
      // Also refresh month preview if on register
      fetchMonthData(selectedMonth);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save salary structure', 'error');
    }
  };

  // 6. Mark Record as Paid
  const handleMarkAsPaid = async (e) => {
    e.preventDefault();
    if (!payingRecord) return;
    try {
      await payrollAPI.updateRecordStatus(payingRecord.id, {
        status: 'Paid',
        ...paymentForm
      });
      showToast(`Marked ${payingRecord.employee_name}'s payslip as Paid!`, 'success');
      setPayingRecord(null);
      fetchMonthData(selectedMonth);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update payment status', 'error');
    }
  };

  // Quick Stats
  const totalPayrollAmount = records.reduce((acc, r) => acc + (parseFloat(r.net_payable) || 0), 0);
  const totalEmployeesWithPay = records.filter(r => (parseFloat(r.monthly_salary) || 0) > 0).length;
  const totalPaidCount = records.filter(r => r.status === 'Paid').length;
  const totalPendingCount = records.filter(r => r.status !== 'Paid').length;

  const filteredStructures = salaryStructures.filter(s =>
    (s.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback.message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 transition-all duration-300 shadow-md ${
          feedback.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          feedback.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
          'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Top Header & Sub-Tabs */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Automated Payroll & Payslips</h2>
              <p className="text-xs text-slate-500">
                Formula-based salary calculation with dynamic Working Sundays & instant 1-click PDF payslips.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1.5 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Monthly Payroll Register
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'structures' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Salary Packages ({salaryStructures.length})
          </button>
        </div>
      </div>

      {activeTab === 'register' && (
        <>
          {/* Controls Bar: Month Picker & Action Buttons */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payroll Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Working Days Breakdown Chip */}
              {workingDaysMeta && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs font-medium text-indigo-900">
                  <span className="font-bold">{workingDaysMeta.totalWorkingDays} Working Days</span>
                  <span className="text-indigo-400">•</span>
                  <span>{workingDaysMeta.workingSundaysCount} Working Sun</span>
                  <span className="text-indigo-400">•</span>
                  <span>{workingDaysMeta.holidaysCount} Holidays</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full lg:w-auto">
              <button
                onClick={handlePreviewCalculation}
                disabled={calculating}
                className="flex-1 lg:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${calculating ? 'animate-spin' : ''}`} />
                {calculating ? 'Recalculating...' : 'Preview Month'}
              </button>
              <button
                onClick={handleCommitPayroll}
                disabled={committing}
                className="flex-1 lg:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {committing ? 'Publishing...' : 'Commit & Publish Payroll'}
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Net Disbursable</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-800 mt-2">{formatINR(totalPayrollAmount)}</p>
              <span className="text-[11px] text-slate-400">Total net payable for {selectedMonth}</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Active Salaried Staff</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-800 mt-2">{totalEmployeesWithPay} Staff</p>
              <span className="text-[11px] text-slate-400">Configured salary packages</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Disbursed (Paid)</span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-teal-700 mt-2">{totalPaidCount} Paid</p>
              <span className="text-[11px] text-teal-600">Disbursement confirmed</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Pending Payment</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-amber-700 mt-2">{totalPendingCount} Pending</p>
              <span className="text-[11px] text-amber-600">Awaiting bank settlement</span>
            </div>
          </div>

          {/* Payroll Register Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Payroll Calculation Register ({selectedMonth})</h3>
                <p className="text-xs text-slate-500">
                  Daily Salary Rate = Monthly Base ÷ Working Days (including Working Sundays). LOP = Working Days - Present - Leaves.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-600">
                {records.length} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Base Salary</th>
                    <th className="py-3 px-4 text-center">Working Days</th>
                    <th className="py-3 px-4 text-center">Attended</th>
                    <th className="py-3 px-4 text-center">Leaves</th>
                    <th className="py-3 px-4 text-center">LOP Days</th>
                    <th className="py-3 px-4">LOP Deduction</th>
                    <th className="py-3 px-4">Net Payable</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-medium">No payroll records computed for {selectedMonth}.</p>
                        <p className="text-xs mt-1">Click "Preview Month" or "Commit & Publish Payroll" above.</p>
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => {
                      const baseSal = parseFloat(rec.monthly_salary) || 0;
                      const lopDed = parseFloat(rec.lop_deduction) || 0;
                      const netPay = parseFloat(rec.net_payable) || 0;
                      const lopDays = parseFloat(rec.lop_days) || 0;

                      return (
                        <tr key={rec.employee_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{rec.employee_name}</div>
                            <div className="text-[11px] text-slate-400">{rec.employee_id} • {rec.designation}</div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {formatINR(baseSal)}
                            {baseSal === 0 && (
                              <span className="block text-[10px] text-amber-600 font-normal">Not Set</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                            {rec.total_working_days}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">
                            {rec.present_days}
                          </td>
                          <td className="py-3.5 px-4 text-center font-medium text-blue-600">
                            {rec.paid_leaves}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              lopDays > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {lopDays}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-red-600">
                            {lopDed > 0 ? `-${formatINR(lopDed)}` : '₹0'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 text-sm">{formatINR(netPay)}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              rec.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rec.status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {rec.status !== 'Paid' && (
                                <button
                                  onClick={() => {
                                    setPayingRecord(rec);
                                    setPaymentForm({
                                      payment_mode: 'Bank Transfer / NEFT',
                                      payment_reference: '',
                                      payment_date: new Date().toISOString().slice(0, 10),
                                      remarks: 'Salary paid via corporate banking'
                                    });
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-[11px] transition-colors"
                                  title="Mark as Paid"
                                >
                                  Mark Paid
                                </button>
                              )}
                              <button
                                onClick={() => generatePayslipPDF(rec)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                                title="Download 1-page PDF Payslip"
                              >
                                <Download className="w-3 h-3" />
                                Payslip
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'structures' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Employee Base Salary Packages & Bank Details</h3>
              <p className="text-xs text-slate-500">
                Configure base monthly compensation and banking information for all active staff members.
              </p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff name or ID..."
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Monthly Base Salary</th>
                  <th className="py-3 px-4">Bank Name</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">IFSC Code</th>
                  <th className="py-3 px-4">UPI ID</th>
                  <th className="py-3 px-4">PAN Number</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStructures.map((struct) => (
                  <tr key={struct.employee_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{struct.employee_name}</div>
                      <div className="text-[11px] text-slate-400">{struct.employee_id} • {struct.department}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {struct.monthly_salary > 0 ? (
                        formatINR(struct.monthly_salary)
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">Not Configured</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{struct.bank_name || '—'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {struct.account_number ? `•••• ${struct.account_number.slice(-4)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{struct.ifsc_code || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{struct.upi_id || '—'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{struct.pan_number || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingEmployee(struct);
                          setStructureForm({
                            monthly_salary: struct.monthly_salary || '',
                            bank_name: struct.bank_name || '',
                            account_number: struct.account_number || '',
                            ifsc_code: struct.ifsc_code || '',
                            upi_id: struct.upi_id || '',
                            pan_number: struct.pan_number || ''
                          });
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Package
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Salary Structure Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Set Salary Package</h3>
                <p className="text-xs text-slate-500">{editingEmployee.employee_name} ({editingEmployee.employee_id})</p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStructure} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Monthly Base Salary (INR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={structureForm.monthly_salary}
                    onChange={(e) => setStructureForm({ ...structureForm, monthly_salary: e.target.value })}
                    placeholder="e.g. 35000"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Daily rate will automatically be calculated as Base Salary ÷ Monthly Working Days.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={structureForm.bank_name}
                    onChange={(e) => setStructureForm({ ...structureForm, bank_name: e.target.value })}
                    placeholder="e.g. HDFC Bank"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={structureForm.account_number}
                    onChange={(e) => setStructureForm({ ...structureForm, account_number: e.target.value })}
                    placeholder="e.g. 50100234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={structureForm.ifsc_code}
                    onChange={(e) => setStructureForm({ ...structureForm, ifsc_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={structureForm.upi_id}
                    onChange={(e) => setStructureForm({ ...structureForm, upi_id: e.target.value })}
                    placeholder="e.g. staff@okhdfcbank"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  value={structureForm.pan_number}
                  onChange={(e) => setStructureForm({ ...structureForm, pan_number: e.target.value.toUpperCase() })}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Salary Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {payingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Record Salary Disbursement</h3>
                <p className="text-xs text-slate-500">{payingRecord.employee_name} • {formatINR(payingRecord.net_payable)}</p>
              </div>
              <button
                onClick={() => setPayingRecord(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMarkAsPaid} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentForm.payment_mode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                  <option value="IMPS / Instant Transfer">IMPS / Instant Transfer</option>
                  <option value="UPI / QR Code">UPI / QR Code</option>
                  <option value="Cheque">Corporate Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / UTR No</label>
                <input
                  type="text"
                  value={paymentForm.payment_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                  placeholder="e.g. UTR202609060123"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm Disbursed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
