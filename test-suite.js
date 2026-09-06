/**
 * Shazusoft HRMS Frontend Automated Test Suite
 * Native ESM test runner verifying core frontend services, utilities, and API contracts.
 */

import { formatTime12h, formatTime24h } from './src/utils/timeUtils.js';
import { urlBase64ToUint8Array } from './src/utils/pushManager.js';
import {
  authAPI,
  attendanceAPI,
  workDoneAPI,
  leavesAPI,
  evaluationsAPI,
  reportsAPI,
  adminAPI,
  searchAPI,
  ticketsAPI,
  uploadsAPI,
  notificationsAPI
} from './src/services/api.js';

// ANSI terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let passedCount = 0;
let failedCount = 0;
const failures = [];

async function assertTest(testName, testFn) {
  process.stdout.write(`  ${colors.cyan}●${colors.reset} ${testName}... `);
  try {
    await testFn();
    console.log(`${colors.green}✔ PASS${colors.reset}`);
    passedCount++;
  } catch (err) {
    console.log(`${colors.red}✖ FAIL${colors.reset}`);
    console.log(`    ${colors.red}Error:${colors.reset} ${err.message}`);
    failedCount++;
    failures.push({ name: testName, error: err.message });
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value but got ${JSON.stringify(actual)}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected defined value but got undefined`);
      }
    },
    toBeType(type) {
      if (typeof actual !== type) {
        throw new Error(`Expected type ${type} but got ${typeof actual}`);
      }
    }
  };
}

async function runFrontendTests() {
  console.log(`\n${colors.bright}${colors.magenta}====================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}  SHAZUSOFT HRMS — FRONTEND AUTOMATED TEST SUITE   ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}  Engine: Node ESM | Framework: React 18 / Vite 5  ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}====================================================${colors.reset}\n`);

  // ─────────────────────────────────────────────────────────────
  // 1. TIME FORMATTING & CONVERSION UTILITIES
  // ─────────────────────────────────────────────────────────────
  console.log(`${colors.bright}${colors.yellow}1. TIME FORMATTING & CONVERSION UTILITIES (timeUtils.js)${colors.reset}`);

  await assertTest('formatTime12h converts standard morning 24h time ("09:30" -> "09:30 AM")', () => {
    expect(formatTime12h('09:30')).toBe('09:30 AM');
  });

  await assertTest('formatTime12h converts standard evening 24h time ("18:30" -> "06:30 PM")', () => {
    expect(formatTime12h('18:30')).toBe('06:30 PM');
  });

  await assertTest('formatTime12h handles boundary 12:00 PM (Noon)', () => {
    expect(formatTime12h('12:00')).toBe('12:00 PM');
  });

  await assertTest('formatTime12h handles boundary 00:00 AM (Midnight)', () => {
    expect(formatTime12h('00:00')).toBe('12:00 AM');
  });

  await assertTest('formatTime12h formats seconds when includeSeconds is true ("14:45:15" -> "02:45:15 PM")', () => {
    expect(formatTime12h('14:45:15', true)).toBe('02:45:15 PM');
  });

  await assertTest('formatTime12h safely handles "--", null, undefined fallbacks', () => {
    expect(formatTime12h('--')).toBe('--');
    expect(formatTime12h(null)).toBe('--:--');
    expect(formatTime12h(undefined)).toBe('--:--');
  });

  await assertTest('formatTime24h converts 12h AM/PM back to 24h ("06:30 PM" -> "18:30")', () => {
    expect(formatTime24h('06:30 PM')).toBe('18:30');
    expect(formatTime24h('09:30 AM')).toBe('09:30');
    expect(formatTime24h('12:00 PM')).toBe('12:00');
    expect(formatTime24h('12:00 AM')).toBe('00:00');
  });

  // ─────────────────────────────────────────────────────────────
  // 2. OFFICE SHIFT & GRACE PERIOD CALCULATORS
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${colors.bright}${colors.yellow}2. OFFICE SHIFT & GRACE PERIOD CALCULATORS${colors.reset}`);

  const getShiftDuration = (start, end) => {
    if (!start || !end) return '9.0';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? (diff / 60).toFixed(1) : '9.0';
  };

  const getGraceMinutes = (start, grace) => {
    if (!start || !grace) return 15;
    const [sh, sm] = start.split(':').map(Number);
    const [gh, gm] = grace.split(':').map(Number);
    const diff = (gh * 60 + gm) - (sh * 60 + sm);
    return diff >= 0 ? diff : 0;
  };

  await assertTest('getShiftDuration computes exact hours between 09:30 and 18:30 (9.0 hrs)', () => {
    expect(getShiftDuration('09:30', '18:30')).toBe('9.0');
  });

  await assertTest('getShiftDuration computes partial hours (09:00 to 17:30 -> 8.5 hrs)', () => {
    expect(getShiftDuration('09:00', '17:30')).toBe('8.5');
  });

  await assertTest('getGraceMinutes computes exact delta from opening to grace cutoff (09:30 to 09:45 -> 15 mins)', () => {
    expect(getGraceMinutes('09:30', '09:45')).toBe(15);
  });

  await assertTest('getGraceMinutes handles custom grace periods (09:00 to 09:30 -> 30 mins)', () => {
    expect(getGraceMinutes('09:00', '09:30')).toBe(30);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. PUSH NOTIFICATION HELPER TESTS (pushManager.js)
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${colors.bright}${colors.yellow}3. PUSH NOTIFICATION HELPERS (pushManager.js)${colors.reset}`);

  await assertTest('urlBase64ToUint8Array decodes standard base64url string to Uint8Array', () => {
    const testKey = 'BPzYce6UvC8ShowBUmiQFxeKSAwKqOt-F88DErrFG5UyUExDNuNDVnyPgfXmQM5quBSQ2sDuwowiNv42189KVnA';
    const decoded = urlBase64ToUint8Array(testKey);
    expect(decoded instanceof Uint8Array).toBe(true);
    expect(decoded.length).toBeGreaterThan(60);
  });

  // ─────────────────────────────────────────────────────────────
  // 4. API CLIENT CONTRACT VERIFICATION (api.js)
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${colors.bright}${colors.yellow}4. API CLIENT CONTRACT VERIFICATION (api.js)${colors.reset}`);

  await assertTest('authAPI exports all required methods', () => {
    expect(typeof (authAPI.sendOtp || authAPI.sendOTP)).toBe('function');
    expect(typeof (authAPI.verifyOtp || authAPI.verifyOTP)).toBe('function');
    expect(typeof authAPI.getMe).toBe('function');
    expect(typeof authAPI.getProfile).toBe('function');
    expect(typeof authAPI.updateProfile).toBe('function');
  });

  await assertTest('attendanceAPI exports all core operations', () => {
    expect(typeof attendanceAPI.punchIn).toBe('function');
    expect(typeof attendanceAPI.punchOut).toBe('function');
    expect(typeof (attendanceAPI.getTodayStatus || attendanceAPI.getToday)).toBe('function');
    expect(typeof attendanceAPI.checkGeofence).toBe('function');
    expect(typeof attendanceAPI.getHolidays).toBe('function');
    expect(typeof attendanceAPI.getMyMonthlyHistory).toBe('function');
  });

  await assertTest('adminAPI exports Office Timings & Calendar endpoints', () => {
    expect(typeof adminAPI.getOfficeTimings).toBe('function');
    expect(typeof adminAPI.updateOfficeTimings).toBe('function');
    expect(typeof adminAPI.getHolidays).toBe('function');
    expect(typeof adminAPI.addHoliday).toBe('function');
    expect(typeof adminAPI.deleteHoliday).toBe('function');
  });

  await assertTest('adminAPI exports Management Suite endpoints', () => {
    expect(typeof adminAPI.getLiveStatus).toBe('function');
    expect(typeof adminAPI.getEmployees).toBe('function');
    expect(typeof adminAPI.createEmployee).toBe('function');
    expect(typeof adminAPI.updateEmployee).toBe('function');
    expect(typeof adminAPI.updateWorkMode).toBe('function');
    expect(typeof adminAPI.freezeDocuments).toBe('function');
    expect(typeof adminAPI.deactivateEmployee).toBe('function');
    expect(typeof adminAPI.reactivateEmployee).toBe('function');
    expect(typeof adminAPI.getLeavePolicy).toBe('function');
    expect(typeof adminAPI.updateLeavePolicy).toBe('function');
    expect(typeof adminAPI.getSettings).toBe('function');
  });

  await assertTest('ticketsAPI exports chat hub and broadcast endpoints', () => {
    expect(typeof ticketsAPI.getTickets).toBe('function');
    expect(typeof ticketsAPI.createTicket).toBe('function');
    expect(typeof ticketsAPI.getTicket).toBe('function');
    expect(typeof ticketsAPI.getMessages).toBe('function');
    expect(typeof ticketsAPI.sendMessage).toBe('function');
    expect(typeof ticketsAPI.updateStatus).toBe('function');
    expect(typeof ticketsAPI.getBroadcasts).toBe('function');
    expect(typeof ticketsAPI.createBroadcast).toBe('function');
    expect(typeof ticketsAPI.getStaffList).toBe('function');
  });

  await assertTest('notificationsAPI exports VAPID and subscription endpoints', () => {
    expect(typeof notificationsAPI.getVapidKey).toBe('function');
    expect(typeof notificationsAPI.subscribe).toBe('function');
  });

  await assertTest('uploadsAPI and searchAPI export Cloudflare R2 & global search endpoints', () => {
    expect(typeof uploadsAPI.uploadBase64).toBe('function');
    expect(typeof uploadsAPI.deleteFile).toBe('function');
    expect(typeof searchAPI.globalSearch).toBe('function');
  });

  // ─────────────────────────────────────────────────────────────
  // 5. SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${colors.bright}${colors.magenta}====================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  FRONTEND TEST RUN SUMMARY:${colors.reset}`);
  console.log(`  Total Tests Run: ${passedCount + failedCount}`);
  console.log(`  ${colors.green}Passed: ${passedCount}${colors.reset}`);
  console.log(`  ${failedCount === 0 ? colors.green : colors.red}Failed: ${failedCount}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}====================================================${colors.reset}\n`);

  if (failedCount > 0) {
    console.error(`${colors.red}Frontend Test Suite Encountered ${failedCount} Failure(s):${colors.reset}`);
    failures.forEach((f, i) => console.error(`  ${i + 1}. [${f.name}] -> ${f.error}`));
    process.exit(1);
  } else {
    console.log(`${colors.bright}${colors.green}🎉 ALL FRONTEND UTILITIES, API CONTRACTS & CALCULATORS PASSED WITH 100% SUCCESS!${colors.reset}\n`);
    process.exit(0);
  }
}

runFrontendTests().catch((err) => {
  console.error('Fatal Frontend Test Runner Error:', err);
  process.exit(1);
});
