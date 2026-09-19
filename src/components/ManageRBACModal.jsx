import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  TextField,
  Card,
  CardContent,
  Switch,
  Alert,
  IconButton
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  AdminPanelSettings as SuperAdminIcon,
  SupervisorAccount as HrIcon,
  GroupWork as LeadIcon,
  Person as StaffIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Key as KeyIcon,
  AssignmentTurnedIn as TaskIcon,
  Payments as PayrollIcon,
  EventBusy as LeaveIcon,
  AccessTime as AttendanceIcon,
  Campaign as MemoIcon,
  AutoAwesome as AiIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import toast from '../utils/muiToast';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_PRESETS = [
  {
    id: 'admin',
    title: 'System Administrator',
    badge: 'FULL ACCESS',
    icon: SuperAdminIcon,
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    description: 'Unrestricted master administrative access to all system modules, payroll, security logs, and company configurations.',
    permissions: {
      'attendance.view_team': true,
      'attendance.regularize': true,
      'attendance.override': true,
      'attendance.shift_config': true,
      'leaves.apply': true,
      'leaves.approve': true,
      'leaves.policy_edit': true,
      'tasks.assign': true,
      'tasks.manage_all': true,
      'workdone.review_team': true,
      'payroll.view_own': true,
      'payroll.manage_structures': true,
      'payroll.generate_month': true,
      'memos.acknowledge': true,
      'memos.publish': true,
      'memos.manage_all': true,
      'reports.view_own': true,
      'reports.generate_ai': true,
      'reports.export_all': true,
      'system.settings_edit': true,
      'system.security_audit': true,
      'rbac.manage_users': true
    }
  },
  {
    id: 'hr_manager',
    title: 'HR & People Operations',
    badge: 'MANAGEMENT',
    icon: HrIcon,
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    description: 'Manage staff directory, approve leaves & attendance regularizations, issue official memos, and inspect timesheets.',
    permissions: {
      'attendance.view_team': true,
      'attendance.regularize': true,
      'attendance.override': true,
      'attendance.shift_config': true,
      'leaves.apply': true,
      'leaves.approve': true,
      'leaves.policy_edit': false,
      'tasks.assign': true,
      'tasks.manage_all': false,
      'workdone.review_team': true,
      'payroll.view_own': true,
      'payroll.manage_structures': false,
      'payroll.generate_month': false,
      'memos.acknowledge': true,
      'memos.publish': true,
      'memos.manage_all': true,
      'reports.view_own': true,
      'reports.generate_ai': true,
      'reports.export_all': true,
      'system.settings_edit': false,
      'system.security_audit': false,
      'rbac.manage_users': false
    }
  },
  {
    id: 'team_lead',
    title: 'Team Lead / Project Lead',
    badge: 'SUPERVISOR',
    icon: LeadIcon,
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    description: 'Assign tasks to team members, review daily work done logs, monitor progress, and review monthly performance appraisals.',
    permissions: {
      'attendance.view_team': true,
      'attendance.regularize': false,
      'attendance.override': false,
      'attendance.shift_config': false,
      'leaves.apply': true,
      'leaves.approve': false,
      'leaves.policy_edit': false,
      'tasks.assign': true,
      'tasks.manage_all': true,
      'workdone.review_team': true,
      'payroll.view_own': true,
      'payroll.manage_structures': false,
      'payroll.generate_month': false,
      'memos.acknowledge': true,
      'memos.publish': false,
      'memos.manage_all': false,
      'reports.view_own': true,
      'reports.generate_ai': false,
      'reports.export_all': false,
      'system.settings_edit': false,
      'system.security_audit': false,
      'rbac.manage_users': false
    }
  },
  {
    id: 'employee',
    title: 'Standard Employee / Staff',
    badge: 'SELF-SERVICE',
    icon: StaffIcon,
    color: '#475569',
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0',
    description: 'Self-service portal: GPS attendance clock-in, daily task updates, leave submissions, and personal payslips viewing.',
    permissions: {
      'attendance.view_team': false,
      'attendance.regularize': false,
      'attendance.override': false,
      'attendance.shift_config': false,
      'leaves.apply': true,
      'leaves.approve': false,
      'leaves.policy_edit': false,
      'tasks.assign': false,
      'tasks.manage_all': false,
      'workdone.review_team': false,
      'payroll.view_own': true,
      'payroll.manage_structures': false,
      'payroll.generate_month': false,
      'memos.acknowledge': true,
      'memos.publish': false,
      'memos.manage_all': false,
      'reports.view_own': true,
      'reports.generate_ai': false,
      'reports.export_all': false,
      'system.settings_edit': false,
      'system.security_audit': false,
      'rbac.manage_users': false
    }
  }
];

const PERMISSION_GROUPS = [
  {
    id: 'attendance',
    title: 'Attendance & Office Shift Timings',
    icon: AttendanceIcon,
    color: '#059669',
    items: [
      { key: 'attendance.view_team', label: 'View Team Live Presence Board', desc: 'Inspect live punches, punch timestamps, and status' },
      { key: 'attendance.regularize', label: 'Approve Attendance Regularizations', desc: 'Review & approve employee missing punch requests' },
      { key: 'attendance.override', label: 'Administrative Attendance Overrides', desc: 'Manually insert or correct past punch timestamps' },
      { key: 'attendance.shift_config', label: 'Configure Custom Shift Timings', desc: 'Set employee-specific shift hours and grace minutes' }
    ]
  },
  {
    id: 'leaves',
    title: 'Leaves & Short Permission Passes',
    icon: LeaveIcon,
    color: '#d97706',
    items: [
      { key: 'leaves.apply', label: 'Apply for Leaves & Passes', desc: 'Submit personal leave and 2-hour pass applications' },
      { key: 'leaves.approve', label: 'Approve / Reject Leave Requests', desc: 'Review and approve/reject staff leave applications' },
      { key: 'leaves.policy_edit', label: 'Configure Leave Policies', desc: 'Adjust monthly casual, sick, and permission quotas' }
    ]
  },
  {
    id: 'tasks',
    title: 'Tasks, Work Done & Milestones',
    icon: TaskIcon,
    color: '#2563eb',
    items: [
      { key: 'tasks.assign', label: 'Assign Tasks to Team Members', desc: 'Create tasks and allocate them to staff members' },
      { key: 'tasks.manage_all', label: 'Manage All Department Tasks', desc: 'Edit milestone deadlines, priorities, and assignments' },
      { key: 'workdone.review_team', label: 'Review Team Daily Work Done Logs', desc: 'Inspect daily work deliverables logged across staff' }
    ]
  },
  {
    id: 'payroll',
    title: 'Payroll, Remuneration & Payslips',
    icon: PayrollIcon,
    color: '#0f766e',
    items: [
      { key: 'payroll.view_own', label: 'View Personal Payslips', desc: 'Download personal monthly salary compensation slips' },
      { key: 'payroll.manage_structures', label: 'Manage Salary Structures', desc: 'Configure staff CTC, bank details, and statutory info' },
      { key: 'payroll.generate_month', label: 'Generate & Finalize Monthly Payroll', desc: 'Run auto-payroll calculations and lock payout records' }
    ]
  },
  {
    id: 'memos',
    title: 'Official Memos & Corporate Directives',
    icon: MemoIcon,
    color: '#7c3aed',
    items: [
      { key: 'memos.acknowledge', label: 'Receive & Acknowledge Memos', desc: 'View and digitally sign official company directives' },
      { key: 'memos.publish', label: 'Issue & Publish Official Memos', desc: 'Publish memorandums to individual staff or company-wide' },
      { key: 'memos.manage_all', label: 'Manage All Memos & Reminders', desc: 'Edit, retract, and dispatch reminder notifications' }
    ]
  },
  {
    id: 'reports',
    title: 'Reports, AI Analytics & Exports',
    icon: AiIcon,
    color: '#db2777',
    items: [
      { key: 'reports.view_own', label: 'View Individual Report', desc: 'Access personal monthly attendance and performance reports' },
      { key: 'reports.generate_ai', label: 'Generate AI Executive Reports', desc: 'Run Mistral AI workforce intelligence and insight summaries' },
      { key: 'reports.export_all', label: 'Export Company-Wide Timesheets', desc: 'Export full attendance CSV and PDF performance reports' }
    ]
  },
  {
    id: 'system',
    title: 'Security, Audit & System Administration',
    icon: SettingsIcon,
    color: '#475569',
    items: [
      { key: 'system.settings_edit', label: 'Configure Office Timings & Calendar', desc: 'Adjust default shifts, working Sundays, and holiday list' },
      { key: 'system.security_audit', label: 'Inspect Security & Audit Trail', desc: 'Access immutable communications and action logs' },
      { key: 'rbac.manage_users', label: 'Manage RBAC Roles & User Access', desc: 'Grant and revoke permissions or promote users' }
    ]
  }
];

export default function ManageRBACModal({
  open,
  onClose,
  employee,
  onSaveSuccess
}) {
  const { user: currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState('employee');
  const [permissions, setPermissions] = useState({});
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (employee) {
      const normalizedRole = (employee.role || 'employee').toLowerCase();
      setSelectedRole(normalizedRole);

      // Load existing permissions or fallback to preset
      let existingPerms = {};
      try {
        existingPerms = employee.permissions
          ? (typeof employee.permissions === 'string' ? JSON.parse(employee.permissions) : employee.permissions)
          : (employee.permissions_json ? (typeof employee.permissions_json === 'string' ? JSON.parse(employee.permissions_json) : employee.permissions_json) : {});
      } catch (e) {}

      const preset = ROLE_PRESETS.find(p => p.id === normalizedRole) || ROLE_PRESETS[3];
      setPermissions({
        ...(preset.permissions || {}),
        ...existingPerms
      });
      setReason('');
      setShowAdvanced(false);
    }
  }, [employee]);

  if (!employee) return null;

  const isSelf = employee.id === currentUser?.id;
  const isSuperAdmin = selectedRole === 'admin';

  const handleSelectRolePreset = (presetId) => {
    setSelectedRole(presetId);
    const preset = ROLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setPermissions({ ...preset.permissions });
    }
  };

  const handleTogglePermission = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (isSelf && employee.role === 'admin' && selectedRole !== 'admin') {
      toast.error('Safety Guard: You cannot revoke Admin privileges from your own active account.');
      return;
    }

    setSaving(true);
    try {
      const res = await adminAPI.updateUserRBAC(employee.id, {
        role: selectedRole,
        permissions,
        reason: reason.trim() || `Assigned ${selectedRole.toUpperCase()} role by ${currentUser?.name || 'Administrator'}`
      });

      toast.success(res.data?.message || `RBAC role updated for ${employee.name}`);
      if (onSaveSuccess) {
        onSaveSuccess(res.data?.employee || { ...employee, role: selectedRole, permissions });
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update user RBAC.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }
      }}
    >
      {/* Header Banner */}
      <DialogTitle
        sx={{
          bgcolor: '#133829',
          color: '#ffffff',
          py: 2.2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SecurityIcon sx={{ color: '#86efac', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#ffffff' }}>
              Role-Based Access Control (RBAC)
            </Typography>
            <Typography variant="caption" sx={{ color: '#a7f3d0', fontWeight: 600 }}>
              Configure system roles, elevated permissions, and feature privileges
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} disabled={saving} sx={{ color: '#ffffff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {/* User Identity Banner */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '12px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: '#133829',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {employee.name?.charAt(0)?.toUpperCase() || 'U'}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {employee.name}
                </Typography>
                <Chip
                  label={employee.id}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569', height: 22, fontSize: 11 }}
                />
                {isSelf && (
                  <Chip
                    label="YOU"
                    size="small"
                    sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#166534', height: 22, fontSize: 11 }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: 12 }}>
                {employee.email} • {employee.department || 'General'} ({employee.designation || 'Staff'})
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
              Current Role:
            </Typography>
            <Chip
              label={employee.role?.toUpperCase() || 'EMPLOYEE'}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: 11,
                bgcolor: employee.role === 'admin' ? '#f3e8ff' : '#ecfdf5',
                color: employee.role === 'admin' ? '#7e22ce' : '#047857',
                border: employee.role === 'admin' ? '1px solid #d8b4fe' : '1px solid #6ee7b7'
              }}
            />
          </Box>
        </Box>

        {isSelf && employee.role === 'admin' && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: '10px', fontWeight: 600 }}>
            <strong>Safety Notice:</strong> You are currently configuring your own administrative account. Self-demotion is prevented to ensure access integrity.
          </Alert>
        )}

        {/* Primary Role Selector Cards */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyIcon sx={{ fontSize: 18, color: '#133829' }} /> Select Primary System Role
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {ROLE_PRESETS.map((preset) => {
            const isSelected = selectedRole === preset.id;
            const IconComp = preset.icon;

            return (
              <Grid item xs={12} sm={6} key={preset.id}>
                <Card
                  onClick={() => handleSelectRolePreset(preset.id)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: isSelected ? preset.color : '#e2e8f0',
                    bgcolor: isSelected ? preset.bgColor : '#ffffff',
                    boxShadow: isSelected ? `0 4px 12px ${preset.color}25` : '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: preset.color
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            bgcolor: isSelected ? preset.color : '#f1f5f9',
                            color: isSelected ? '#ffffff' : preset.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <IconComp sx={{ fontSize: 18 }} />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {preset.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={preset.badge}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 9.5,
                          fontWeight: 800,
                          bgcolor: isSelected ? preset.color : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#64748b'
                        }}
                      />
                    </Box>

                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: 11.5, display: 'block', lineHeight: 1.4 }}>
                      {preset.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Granular Permission Matrix Toggle */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldIcon sx={{ color: '#133829', fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Granular Privilege Matrix
            </Typography>
            <Chip
              label={`${Object.values(permissions).filter(Boolean).length} Enabled`}
              size="small"
              sx={{ fontWeight: 800, fontSize: 10, bgcolor: '#dcfce7', color: '#166534', height: 20 }}
            />
          </Box>

          <Button
            size="small"
            variant="text"
            onClick={() => setShowAdvanced(!showAdvanced)}
            sx={{ fontWeight: 700, fontSize: 12, textTransform: 'none', color: '#133829' }}
          >
            {showAdvanced ? 'Hide Fine-Grained Controls ▲' : 'Customize Permissions ▼'}
          </Button>
        </Box>

        {showAdvanced && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            {PERMISSION_GROUPS.map((group) => {
              const GroupIcon = group.icon;
              return (
                <Card
                  key={group.id}
                  sx={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.2,
                      bgcolor: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <GroupIcon sx={{ fontSize: 18, color: group.color }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>
                      {group.title}
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Grid container spacing={1.5}>
                      {group.items.map((item) => {
                        const isGranted = Boolean(permissions[item.key]);
                        return (
                          <Grid item xs={12} sm={6} key={item.key}>
                            <Box
                              onClick={() => handleTogglePermission(item.key)}
                              sx={{
                                p: 1.2,
                                borderRadius: '8px',
                                border: '1px solid',
                                borderColor: isGranted ? '#86efac' : '#f1f5f9',
                                bgcolor: isGranted ? '#f0fdf4' : '#fafafa',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  borderColor: isGranted ? '#4ade80' : '#cbd5e1',
                                  bgcolor: isGranted ? '#dcfce7' : '#f1f5f9'
                                }
                              }}
                            >
                              <Box sx={{ pr: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, color: isGranted ? '#14532d' : '#334155' }}>
                                  {item.label}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: 10.5, display: 'block' }}>
                                  {item.desc}
                                </Typography>
                              </Box>

                              <Switch
                                size="small"
                                checked={isGranted}
                                onChange={() => handleTogglePermission(item.key)}
                                color="success"
                                sx={{ mt: -0.5 }}
                              />
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Audit Note / Reason Input */}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Administrative Reason / Audit Note (Optional)"
            placeholder="e.g., Promoted to Team Lead for Q3 Sprint Oversight"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            helperText="This entry will be permanently recorded in the system security and communications audit log."
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, px: 3, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} disabled={saving} color="inherit" sx={{ fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={isSuperAdmin ? <SuperAdminIcon /> : <CheckIcon />}
          sx={{
            fontWeight: 800,
            borderRadius: '10px',
            bgcolor: isSuperAdmin ? '#7c3aed' : '#133829',
            color: '#ffffff',
            px: 3,
            '&:hover': {
              bgcolor: isSuperAdmin ? '#6d28d9' : '#0e2b1f'
            }
          }}
        >
          {saving ? 'Updating RBAC...' : `Save & Apply ${selectedRole.toUpperCase()} Role`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
