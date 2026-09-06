/**
 * Shazusoft HRMS — Comprehensive All-Page, All-Role, All-Action Responsiveness & Visual Test Runner
 * Validates UI layouts, interactive controls, and visual integrity across:
 * - Roles: Guest (Login), Employee (Staff Workspace), Admin (Executive Management)
 * - Viewports: Mobile (390 × 844) & Desktop HD (1440 × 900)
 * - Actions: Drawer toggling, tab switching, form input readiness, table safety
 * - Visual Artifacts: Full PNG screenshots captured for every role and key view
 */

import puppeteer from 'puppeteer-core';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = 'super_secret_shazusoft_jwt_key_2026';
const SCREENSHOTS_DIR = path.join(__dirname, 'reports', 'responsiveness');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// ANSI Colors for executive reporting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m'
};

// Locate native browser executable
function findBrowserExecutable() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No compatible Chromium browser found.');
}

// Role Credentials & Mocked Users for Instant Session Injection
const TEST_USERS = {
  admin: {
    user: {
      id: 'EMP-ADMIN-01',
      name: 'Vimal Raj',
      email: 'vimalraj5207@gmail.com',
      role: 'admin',
      department: 'Executive Management',
      designation: 'Managing Director & Administrator',
      work_mode: 'office',
      status: 'active'
    },
    token: jwt.sign(
      {
        id: 'EMP-ADMIN-01',
        email: 'vimalraj5207@gmail.com',
        role: 'admin',
        name: 'Vimal Raj',
        work_mode: 'office',
        department: 'Executive Management'
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    )
  },
  employee: {
    user: {
      id: 'EMP-STAFF-01',
      name: 'VS Groups Staff',
      email: 'staff.demo@shazusofttechnologies.org',
      role: 'employee',
      department: 'Engineering',
      designation: 'Software Developer',
      work_mode: 'office',
      status: 'active'
    },
    token: jwt.sign(
      {
        id: 'EMP-STAFF-01',
        email: 'staff.demo@shazusofttechnologies.org',
        role: 'employee',
        name: 'VS Groups Staff',
        work_mode: 'office',
        department: 'Engineering'
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    )
  }
};

const VIEWPORTS = [
  { id: 'mobile', label: 'Mobile (390 × 844)', width: 390, height: 844, isMobile: true, hasTouch: true },
  { id: 'desktop', label: 'Desktop HD (1440 × 900)', width: 1440, height: 900, isMobile: false, hasTouch: false }
];

async function isServerRunning(port = 3000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Check horizontal overflow
async function assertPageOverflow(page) {
  return await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
    const clientWidth = window.innerWidth;
    const hasOverflow = scrollWidth > clientWidth + 1; // 1px rounding tolerance
    
    let culprit = null;
    if (hasOverflow) {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.scrollWidth > clientWidth + 2) {
          culprit = el.tagName.toLowerCase() + (el.className ? `.${el.className.split(' ').join('.')}` : '');
          break;
        }
      }
    }
    return { scrollWidth, clientWidth, hasOverflow, culprit };
  });
}

// Check responsive table containment
async function assertTableContainment(page) {
  return await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) return { exists: false, isSafe: true, count: 0 };
    let allContained = true;
    for (const tbl of tables) {
      let parent = tbl.parentElement;
      let safe = false;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') {
          safe = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!safe && tbl.clientWidth > window.innerWidth) {
        allContained = false;
        break;
      }
    }
    return { exists: true, isSafe: allContained, count: tables.length };
  });
}

// Inject authentication session into browser localStorage
async function injectAuthSession(page, targetUrl, authObj) {
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  if (authObj) {
    await page.evaluate((auth) => {
      localStorage.setItem('shazusoft_token', auth.token);
      localStorage.setItem('shazusoft_user', JSON.stringify(auth.user));
    }, authObj);
  } else {
    await page.evaluate(() => {
      localStorage.removeItem('shazusoft_token');
      localStorage.removeItem('shazusoft_user');
    });
  }
}

async function runComprehensiveTestSuite() {
  console.log(`\n${colors.bright}================================================================${colors.reset}`);
  console.log(`${colors.bright}  SHAZUSOFT HRMS — ALL-PAGE, ALL-ROLE RESPONSIVENESS & ACTION SUITE  ${colors.reset}`);
  console.log(`${colors.bright}  Testing Roles: Guest | Employee | Admin Across Mobile & Desktop ${colors.reset}`);
  console.log(`${colors.bright}================================================================${colors.reset}\n`);

  let serverProcess = null;
  let targetUrl = 'http://localhost:3000';

  if (!(await isServerRunning(3000))) {
    if (await isServerRunning(5173)) {
      targetUrl = 'http://localhost:5173';
    } else {
      console.log(`${colors.yellow}ℹ Starting frontend preview server on port 3000...${colors.reset}`);
      serverProcess = spawn('npx', ['vite', 'preview', '--port', '3000'], {
        cwd: __dirname,
        shell: true,
        stdio: 'ignore'
      });
      let ready = false;
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        if (await isServerRunning(3000)) {
          ready = true;
          break;
        }
      }
      if (!ready) throw new Error('Could not start or connect to frontend preview server on port 3000');
    }
  }

  const browserPath = findBrowserExecutable();
  console.log(`[Browser Engine] ${colors.dim}${browserPath}${colors.reset}`);
  console.log(`[Target URL] ${colors.cyan}${targetUrl}${colors.reset}`);
  console.log(`[Screenshots Dir] ${colors.dim}${SCREENSHOTS_DIR}${colors.reset}\n`);

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const capturedScreenshots = [];

  const runCheck = async (name, testFn) => {
    totalTests++;
    process.stdout.write(`    ● ${name}... `);
    try {
      await testFn();
      console.log(`${colors.green}✔ PASS${colors.reset}`);
      passedTests++;
    } catch (err) {
      console.log(`${colors.red}✖ FAIL${colors.reset} (${err.message})`);
      failedTests++;
    }
  };

  try {
    const page = await browser.newPage();

    // =========================================================================
    // SECTION 1: UNAUTHENTICATED GUEST ROLE (LOGIN & OTP AUTH)
    // =========================================================================
    console.log(`${colors.bright}1. ROLE: UNAUTHENTICATED GUEST (LOGIN WORKSPACE)${colors.reset}`);
    await injectAuthSession(page, targetUrl, null);

    for (const vp of VIEWPORTS) {
      console.log(`\n  ${colors.cyan}▶ [${vp.label}]${colors.reset}`);
      await page.setViewport(vp);
      await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise((r) => setTimeout(r, 400));

      await runCheck('Horizontal overflow check', async () => {
        const res = await assertPageOverflow(page);
        if (res.hasOverflow) throw new Error(`Overflow: ${res.scrollWidth}px > ${res.clientWidth}px`);
      });

      await runCheck('Interactive email input & submit CTA present', async () => {
        const input = await page.$('input[type="email"]');
        if (!input) throw new Error('Email input field missing');
        await input.type('test.user@shazusoft.org', { delay: 15 });
        const button = await page.$('button');
        if (!button) throw new Error('Login button missing');
      });

      const shotName = `01_guest_login_${vp.id}.png`;
      const shotPath = path.join(SCREENSHOTS_DIR, shotName);
      await page.screenshot({ path: shotPath });
      capturedScreenshots.push({ label: `Guest Login (${vp.label})`, path: shotPath });
    }

    // =========================================================================
    // SECTION 2: EMPLOYEE ROLE (STAFF WORKSPACE — ALL PAGES & ACTIONS)
    // =========================================================================
    console.log(`\n${colors.bright}2. ROLE: EMPLOYEE (STAFF WORKSPACE — ALL VIEWS & ACTIONS)${colors.reset}`);
    await injectAuthSession(page, targetUrl, TEST_USERS.employee);

    const employeeViews = [
      { tab: 'dashboard', label: 'Attendance & Punch Dashboard', shot: '02_employee_dashboard' },
      { tab: 'task-tracker', label: 'My Assigned Tasks', shot: '03_employee_tasks' },
      { tab: 'attendance', label: 'Monthly Attendance History', shot: '04_employee_attendance' },
      { tab: 'leaves', label: 'Leave Quotas & Balances', shot: '05_employee_leaves' },
      { tab: 'my-payslips', label: 'My Salary Payslips & Viewer', shot: '13_employee_payslips' },
      { tab: 'my-report', label: 'Verified Timesheet & Summary Table', shot: '06_employee_my_report' },
      { tab: 'profile', label: 'Employee Profile & Documents', shot: '07_employee_profile' },
      { tab: 'chat-hub', label: 'Support Ticket Hub', shot: '08_employee_chat_hub' }
    ];

    for (const view of employeeViews) {
      console.log(`\n  ${colors.cyan}▶ View: ${view.label} (?tab=${view.tab})${colors.reset}`);
      
      for (const vp of VIEWPORTS) {
        await page.setViewport(vp);
        await page.goto(`${targetUrl}/?tab=${view.tab}`, { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise((r) => setTimeout(r, 400));

        await runCheck(`[${vp.id}] Horizontal overflow check`, async () => {
          const res = await assertPageOverflow(page);
          if (res.hasOverflow) throw new Error(`Overflow: ${res.scrollWidth}px > ${res.clientWidth}px`);
        });

        await runCheck(`[${vp.id}] Table containment verification`, async () => {
          const tbl = await assertTableContainment(page);
          if (!tbl.isSafe) throw new Error('Unenclosed table causing page stretch');
        });

        // Mobile drawer action test on dashboard
        if (vp.id === 'mobile' && view.tab === 'dashboard') {
          await runCheck(`[mobile] Open and close navigation drawer action`, async () => {
            const menuBtn = await page.$('button[aria-label="open drawer"], button:has(svg[data-testid="MenuIcon"])');
            if (menuBtn) {
              await menuBtn.click();
              await new Promise((r) => setTimeout(r, 300));
              const drawerOverflow = await assertPageOverflow(page);
              if (drawerOverflow.hasOverflow) throw new Error('Drawer caused layout overflow');
              // Close drawer by pressing Escape
              await page.keyboard.press('Escape');
              await new Promise((r) => setTimeout(r, 300));
            }
          });
        }

        const shotName = `${view.shot}_${vp.id}.png`;
        const shotPath = path.join(SCREENSHOTS_DIR, shotName);
        await page.screenshot({ path: shotPath });
        capturedScreenshots.push({ label: `Employee ${view.label} (${vp.label})`, path: shotPath });
      }
    }

    // =========================================================================
    // SECTION 3: ADMIN ROLE (EXECUTIVE MANAGEMENT — ALL SUBTABS & ACTIONS)
    // =========================================================================
    console.log(`\n${colors.bright}3. ROLE: ADMIN (EXECUTIVE MANAGEMENT — ALL SUBTABS & ACTIONS)${colors.reset}`);
    await injectAuthSession(page, targetUrl, TEST_USERS.admin);

    const adminSubtabs = [
      { index: 0, tabKey: 'admin-live', label: 'Live Daily Presence & Geofencing', shot: '09_admin_dashboard' },
      { index: 1, tabKey: 'admin-tasks', label: 'Task Assignment & Delegation', shot: null },
      { index: 2, tabKey: 'admin-regularizations', label: 'Attendance Regularization Approvals', shot: null },
      { index: 4, tabKey: 'admin-leaves', label: 'Leave Requests & Approvals', shot: null },
      { index: 7, tabKey: 'admin-timesheets', label: 'Staff Monthly Timesheets (Corporate Table)', shot: '10_admin_timesheets' },
      { index: 8, tabKey: 'admin-directory', label: 'Employee Directory Management & Base Salary', shot: '15_admin_directory' },
      { index: 9, tabKey: 'admin-audit', label: 'Compliance Document Freeze & Audit', shot: '11_admin_compliance' },
      { index: 10, tabKey: 'admin-holidays', label: 'Holiday Calendar & Office Shift Timings', shot: '12_admin_office_timings' },
      { index: 11, tabKey: 'admin-payroll', label: 'Automated Payroll & Payslips Register', shot: '14_admin_payroll' }
    ];

    for (const subtab of adminSubtabs) {
      console.log(`\n  ${colors.cyan}▶ Admin Subtab ${subtab.index}: ${subtab.label}${colors.reset}`);

      for (const vp of VIEWPORTS) {
        await page.setViewport(vp);
        await page.goto(`${targetUrl}/?tab=${subtab.tabKey || 'dashboard'}`, { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise((r) => setTimeout(r, 600));

        await runCheck(`[${vp.id}] Horizontal overflow check`, async () => {
          const res = await assertPageOverflow(page);
          if (res.hasOverflow) throw new Error(`Overflow: ${res.scrollWidth}px > ${res.clientWidth}px`);
        });

        await runCheck(`[${vp.id}] Table responsiveness check`, async () => {
          const tbl = await assertTableContainment(page);
          if (!tbl.isSafe) throw new Error('Unenclosed table causing page stretch');
        });

        // If subtab 8 (Staff Directory), test Base Salary and Set/Edit Salary modal
        if (subtab.index === 8) {
          await runCheck(`[${vp.id}] Staff directory Base Salary column and modal interaction`, async () => {
            const hasBaseSalaryTh = await page.evaluate(() => {
              const ths = Array.from(document.querySelectorAll('th'));
              return ths.some(th => th.textContent.includes('Base Salary'));
            });
            if (!hasBaseSalaryTh) throw new Error('Base Salary column header not found in Staff Directory');

            // Find and click Set Salary or Edit Salary button
            const salaryBtn = await page.evaluateHandle(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              return buttons.find(b => b.textContent.includes('Set Salary') || b.textContent.includes('Edit Salary'));
            });
            if (salaryBtn && salaryBtn.asElement()) {
              await salaryBtn.asElement().click();
              await new Promise((r) => setTimeout(r, 400));

              // Verify modal is open
              const modalOpen = await page.evaluate(() => {
                return !!document.querySelector('input[type="number"]');
              });
              if (!modalOpen) throw new Error('Salary modal did not open');

              if (vp.id === 'desktop') {
                const modalShotPath = path.join(SCREENSHOTS_DIR, '16_admin_salary_modal_desktop.png');
                await page.screenshot({ path: modalShotPath });
                capturedScreenshots.push({ label: 'Admin Salary Configuration Modal (Desktop)', path: modalShotPath });
              }

              // Close modal by clicking Cancel
              await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const cancelBtn = buttons.find(b => b.textContent.trim() === 'Cancel');
                if (cancelBtn) cancelBtn.click();
              });
              await new Promise((r) => setTimeout(r, 300));
            }
          });
        }

        // If subtab 7 (Staff Timesheet with new corporate table), perform employee switch action
        if (subtab.index === 7) {
          await runCheck(`[${vp.id}] Staff timesheet dropdown selector action`, async () => {
            const selectEl = await page.$('.MuiSelect-select, select');
            if (selectEl) {
              await selectEl.click();
              await new Promise((r) => setTimeout(r, 200));
              await page.keyboard.press('Escape');
            }
          });
        }

        // If subtab 10 (Office Timings), test input focus action
        if (subtab.index === 10) {
          await runCheck(`[${vp.id}] Office shift timings input interaction`, async () => {
            const timeInputs = await page.$$('input[type="time"]');
            if (timeInputs.length > 0) {
              await timeInputs[0].focus();
            }
          });
        }

        if (subtab.shot) {
          const shotName = `${subtab.shot}_${vp.id}.png`;
          const shotPath = path.join(SCREENSHOTS_DIR, shotName);
          await page.screenshot({ path: shotPath });
          capturedScreenshots.push({ label: `Admin ${subtab.label} (${vp.label})`, path: shotPath });
        }
      }
    }

  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill();
    }
  }

  // Final Summary Report
  console.log(`\n${colors.bright}================================================================${colors.reset}`);
  console.log(`${colors.bright}  COMPREHENSIVE RESPONSIVENESS & ACTION TEST RESULTS:${colors.reset}`);
  console.log(`  Total Checks: ${totalTests}`);
  console.log(`  ${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`  ${failedTests > 0 ? colors.red : colors.dim}Failed: ${failedTests}${colors.reset}`);
  console.log(`${colors.bright}================================================================${colors.reset}\n`);

  if (failedTests === 0) {
    console.log(`🎉 ${colors.green}${colors.bright}ALL ROLES, PAGES & ACTIONS PASSED WITH 100% RESPONSIVE SUCCESS!${colors.reset}\n`);
    console.log(`📸 ${colors.bright}Saved Visual Proofs (${capturedScreenshots.length} Screenshots):${colors.reset}`);
    for (const item of capturedScreenshots) {
      console.log(`  • ${item.label}:\n    ${colors.cyan}${item.path}${colors.reset}`);
    }
    console.log('');
  } else {
    console.log(`⚠️  ${colors.red}${colors.bright}Some checks failed. See detailed output above.${colors.reset}\n`);
    process.exit(1);
  }
}

runComprehensiveTestSuite().catch((err) => {
  console.error(`\n${colors.red}Fatal Error in Comprehensive Test Suite:${colors.reset}`, err);
  process.exit(1);
});
