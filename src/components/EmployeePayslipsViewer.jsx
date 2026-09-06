import React, { useState, useEffect } from 'react';
import {
  DollarSign, Download, Calendar, CheckCircle2, Clock,
  CreditCard, ShieldCheck, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { payrollAPI } from '../services/api';
import { generatePayslipPDF, formatINR, numberToWordsINR } from '../utils/payslipGenerator';

export default function EmployeePayslipsViewer({ user }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchMyPayslips = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await payrollAPI.getMyPayslips();
      const list = res.data.payslips || [];
      setPayslips(list);
      if (list.length > 0) {
        setSelectedPayslip(list[0]);
      }
    } catch (err) {
      console.error('Error fetching employee payslips:', err);
      setError('Failed to load payslip records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPayslips();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">My Salary Payslips</h2>
            <p className="text-xs text-slate-500">
              Access your monthly salary remuneration statements and download official signed PDF payslips.
            </p>
          </div>
        </div>

        {selectedPayslip && (
          <button
            onClick={() => generatePayslipPDF(selectedPayslip)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Latest Payslip (PDF)
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-100 shadow-sm">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Loading your payslip history...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : payslips.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-100 shadow-sm">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-500" />
          <h3 className="text-base font-bold text-slate-700">No Payslips Published Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Your monthly salary payslips will appear here once finalized and published by company administration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Payslip History List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Monthly Payslip History ({payslips.length})
            </h3>

            {payslips.map((p) => {
              const isSelected = selectedPayslip?.id === p.id;
              const netPay = parseFloat(p.net_payable) || 0;

              return (
                <div
                  key={p.id || p.payroll_month}
                  onClick={() => setSelectedPayslip(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-slate-800 text-sm">{p.payroll_month}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status || 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Take-Home Salary</span>
                      <span className="text-base font-bold text-slate-900">{formatINR(netPay)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generatePayslipPDF(p);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-100/70 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Selected Payslip Preview Card */}
          {selectedPayslip && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                      {selectedPayslip.payroll_month}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                      selectedPayslip.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedPayslip.status === 'Paid' ? 'Disbursed / Paid' : 'Pending Payment'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">
                    Official Salary Slip — {selectedPayslip.payroll_month}
                  </h3>
                </div>

                <button
                  onClick={() => generatePayslipPDF(selectedPayslip)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download 1-Page PDF
                </button>
              </div>

              {/* Working Days & Attendance Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Attendance & Working Days Metric
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Total Working Days</span>
                    <span className="text-lg font-bold text-slate-800">{selectedPayslip.total_working_days}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Incl. Working Sundays</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[11px] text-emerald-700 block">Days Present</span>
                    <span className="text-lg font-bold text-emerald-800">{selectedPayslip.present_days}</span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">Verified attendance</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                    <span className="text-[11px] text-blue-700 block">Paid Approved Leaves</span>
                    <span className="text-lg font-bold text-blue-800">{selectedPayslip.paid_leaves}</span>
                    <span className="text-[10px] text-blue-600 block mt-0.5">Casual/Sick/Paid</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-100">
                    <span className="text-[11px] text-red-700 block">Loss of Pay (LOP)</span>
                    <span className="text-lg font-bold text-red-800">{selectedPayslip.lop_days}</span>
                    <span className="text-[10px] text-red-600 block mt-0.5">Unpaid absent days</span>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Remuneration & Deductions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-700 pb-2 border-b border-slate-200">
                      <span>EARNINGS</span>
                      <span>AMOUNT</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Monthly Base Salary</span>
                      <span className="font-semibold text-slate-800">{formatINR(selectedPayslip.monthly_salary)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Daily Salary Rate</span>
                      <span>{formatINR(selectedPayslip.daily_rate)}/day</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-200 font-bold">
                      <span>Gross Remuneration</span>
                      <span>{formatINR(selectedPayslip.monthly_salary)}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-700 pb-2 border-b border-slate-200">
                      <span>DEDUCTIONS</span>
                      <span>AMOUNT</span>
                    </div>
                    <div className="flex items-center justify-between text-red-600 font-medium">
                      <span>Loss of Pay (LOP: {selectedPayslip.lop_days} days)</span>
                      <span>-{formatINR(selectedPayslip.lop_deduction)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>PF / Professional Tax</span>
                      <span>₹0 (Startup Exempt)</span>
                    </div>
                    <div className="flex items-center justify-between text-red-600 pt-2 border-t border-slate-200 font-bold">
                      <span>Total Deductions</span>
                      <span>-{formatINR(selectedPayslip.lop_deduction)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight Banner */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div>
                  <span className="text-xs font-semibold text-indigo-300 block uppercase tracking-wider">
                    Net Take-Home Salary
                  </span>
                  <p className="text-2xl font-black tracking-tight mt-0.5">
                    {formatINR(selectedPayslip.net_payable)}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {numberToWordsINR(selectedPayslip.net_payable)}
                  </p>
                </div>

                {selectedPayslip.account_number && (
                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-indigo-800/60">
                    <span className="text-[11px] text-indigo-300 block">Credited To Bank Account</span>
                    <span className="font-mono text-sm font-semibold">
                      {selectedPayslip.bank_name || 'Bank'} •••• {selectedPayslip.account_number.slice(-4)}
                    </span>
                    {selectedPayslip.payment_date && (
                      <span className="text-[10px] text-emerald-400 block mt-0.5">
                        Disbursed on {selectedPayslip.payment_date}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
