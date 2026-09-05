import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Divider,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Tooltip,
  Backdrop
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  AccountBalance as BankIcon,
  Description as DocumentIcon,
  ContactPhone as EmergencyIcon,
  CheckCircle as VerifiedIcon,
  UploadFile as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Save as SaveIcon,
  Spa as LeafLogoIcon,
  Security as SecurityIcon,
  Fingerprint as IdIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  CheckCircleOutline as VerifiedOutlineIcon
} from '@mui/icons-material';
import { authAPI, adminAPI, uploadsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast, { muiToast } from '../utils/muiToast';
import { format } from 'date-fns';

const REQUIRED_DOCUMENTS = [
  { key: 'govt_id', label: 'Government ID (Aadhaar / Passport / Voter ID)', required: true },
  { key: 'pan_card', label: 'PAN Card Copy', required: true },
  { key: 'bank_proof', label: 'Bank Passbook / Cancelled Cheque', required: true },
  { key: 'education_cert', label: 'Highest Educational Certificate', required: false },
  { key: 'relieving_exp', label: 'Experience / Relieving Letter', required: false }
];

/** Efficient Storage Helper: Compresses images client-side before Cloudflare R2 upload */
function compressImageFile(file, maxDimension = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function UserProfile() {
  const { user: authUser, isAdmin, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState(null);

  // Form State
  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    department: '',
    designation: '',
    work_mode: 'office',
    phone: '',
    avatar_url: '',
    documents_frozen: false,
    frozen_at: null,
    frozen_by: null,
    frozen_by_name: null,
    personal_info: {
      dob: '',
      gender: '',
      blood_group: '',
      marital_status: '',
      personal_email: '',
      alternate_phone: '',
      current_address: '',
      permanent_address: ''
    },
    statutory_info: {
      bank_name: '',
      bank_account_number: '',
      ifsc_code: '',
      account_holder_name: '',
      upi_id: '',
      pan_number: '',
      aadhaar_number: '',
      uan_pf_number: ''
    },
    emergency_contacts: {
      contact_name: '',
      relationship: '',
      contact_phone: '',
      alternate_phone: ''
    },
    documents: [],
    profile_completeness: 0
  });

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [currentDocKey, setCurrentDocKey] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getProfile();
      if (res.data?.profile) {
        const p = res.data.profile;
        setProfileData({
          id: p.id || authUser?.id || '',
          name: p.name || authUser?.name || '',
          email: p.email || authUser?.email || '',
          role: p.role || authUser?.role || 'employee',
          department: p.department || authUser?.department || 'Operations',
          designation: p.designation || authUser?.designation || 'Staff',
          work_mode: p.work_mode || authUser?.work_mode || 'office',
          phone: p.phone || '',
          avatar_url: p.avatar_url || '',
          documents_frozen: Boolean(p.documents_frozen),
          frozen_at: p.frozen_at || null,
          frozen_by: p.frozen_by || null,
          frozen_by_name: p.frozen_by_name || null,
          personal_info: {
            dob: p.personal_info?.dob || '',
            gender: p.personal_info?.gender || '',
            blood_group: p.personal_info?.blood_group || '',
            marital_status: p.personal_info?.marital_status || '',
            personal_email: p.personal_info?.personal_email || '',
            alternate_phone: p.personal_info?.alternate_phone || '',
            current_address: p.personal_info?.current_address || '',
            permanent_address: p.personal_info?.permanent_address || ''
          },
          statutory_info: {
            bank_name: p.statutory_info?.bank_name || '',
            bank_account_number: p.statutory_info?.bank_account_number || '',
            ifsc_code: p.statutory_info?.ifsc_code || '',
            account_holder_name: p.statutory_info?.account_holder_name || '',
            upi_id: p.statutory_info?.upi_id || '',
            pan_number: p.statutory_info?.pan_number || '',
            aadhaar_number: p.statutory_info?.aadhaar_number || '',
            uan_pf_number: p.statutory_info?.uan_pf_number || ''
          },
          emergency_contacts: {
            contact_name: p.emergency_contacts?.contact_name || '',
            relationship: p.emergency_contacts?.relationship || '',
            contact_phone: p.emergency_contacts?.contact_phone || '',
            alternate_phone: p.emergency_contacts?.alternate_phone || ''
          },
          documents: p.documents || [],
          profile_completeness: p.profile_completeness || 0
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      toast.error('Failed to load employee profile records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePersonalChange = (field, value) => {
    if (!isAdmin && profileData.documents_frozen) return;
    setProfileData(prev => ({
      ...prev,
      personal_info: { ...prev.personal_info, [field]: value }
    }));
  };

  const handleStatutoryChange = (field, value) => {
    if (!isAdmin && profileData.documents_frozen) return;
    setProfileData(prev => ({
      ...prev,
      statutory_info: { ...prev.statutory_info, [field]: value }
    }));
  };

  const handleEmergencyChange = (field, value) => {
    if (!isAdmin && profileData.documents_frozen) return;
    setProfileData(prev => ({
      ...prev,
      emergency_contacts: { ...prev.emergency_contacts, [field]: value }
    }));
  };

  // Admin Toggle Freeze / Lock Handler
  const handleToggleFreeze = async () => {
    const isFreezing = !profileData.documents_frozen;
    const confirmed = await muiToast.confirm({
      title: isFreezing ? 'Freeze & Lock Compliance Records?' : 'Unfreeze Compliance Records?',
      message: isFreezing
        ? `Are you sure you want to FREEZE and LOCK all compliance documents and statutory records for ${profileData.name}? Non-admin editing will be restricted.`
        : `Are you sure you want to UNFREEZE records for ${profileData.name}? The employee will be able to edit statutory info and upload replacement documents.`,
      confirmText: isFreezing ? 'Freeze & Lock Records' : 'Unfreeze for Edits',
      cancelText: 'Cancel',
      severity: isFreezing ? 'warning' : 'info'
    });

    if (!confirmed) return;

    setFreezing(true);
    try {
      const res = await adminAPI.freezeDocuments(profileData.id, { frozen: isFreezing });
      setProfileData(prev => ({
        ...prev,
        documents_frozen: isFreezing,
        frozen_at: isFreezing ? new Date().toISOString() : null,
        frozen_by: isFreezing ? authUser?.id : null,
        frozen_by_name: isFreezing ? authUser?.name : null
      }));
      toast.success(res.data?.message || (isFreezing ? 'Employee documents locked & frozen.' : 'Employee documents unlocked.'));
    } catch (err) {
      console.error('Error toggling freeze:', err);
      toast.error(err.response?.data?.error || 'Failed to update document lock status.');
    } finally {
      setFreezing(false);
    }
  };

  // Avatar Image Upload Handler (Compressed client-side before Cloudflare R2 upload)
  const handleAvatarFile = async (e) => {
    if (!isAdmin && profileData.documents_frozen) {
      toast.error('Profile records are frozen & locked by HR. Contact HR for changes.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size exceeds 10MB limit. Please select a smaller photo.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 800, 0.85);

      const uploadRes = await uploadsAPI.uploadBase64({
        data_url: compressedDataUrl,
        filename: file.name,
        folder: 'avatars'
      });

      // Clean up old avatar file from Cloudflare R2
      if (profileData.avatar_url && profileData.avatar_url.includes('/api/uploads/file/')) {
        const oldAvatarKey = profileData.avatar_url.split('/api/uploads/file/')[1];
        if (oldAvatarKey) {
          uploadsAPI.deleteFile(oldAvatarKey).catch(() => {});
        }
      }

      const r2Url = uploadRes.data.url;
      setProfileData(prev => ({
        ...prev,
        avatar_url: r2Url
      }));

      // Auto-save avatar link to profile
      await authAPI.updateProfile({
        avatar_url: r2Url
      });

      if (updateUser) {
        updateUser({ avatar_url: r2Url });
      }

      toast.success('Profile avatar optimized & uploaded to Cloudflare R2 storage.');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Failed to upload avatar to Cloudflare R2.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Document Upload Handler (Direct compressed upload to Cloudflare R2)
  const triggerDocumentUpload = (docKey) => {
    if (!isAdmin && profileData.documents_frozen) {
      toast.error('Documents are locked & verified by HR. Re-uploading is disabled.');
      return;
    }
    setCurrentDocKey(docKey);
    docInputRef.current?.click();
  };

  const handleDocumentFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentDocKey) return;

    if (!isAdmin && profileData.documents_frozen) {
      toast.error('Documents are locked & verified by HR.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Document exceeds 10MB size limit.');
      return;
    }

    const docKey = currentDocKey;
    setUploadingDocKey(docKey);

    try {
      // Compress if image (PNG/JPG), pass through if PDF
      const processedDataUrl = await compressImageFile(file, 1600, 0.85);

      const uploadRes = await uploadsAPI.uploadBase64({
        data_url: processedDataUrl,
        filename: file.name,
        folder: 'compliance_documents'
      });

      // Delete old document from R2 if replacing an existing one
      const oldDoc = profileData.documents.find(d => d.key === docKey);
      if (oldDoc?.r2_key) {
        uploadsAPI.deleteFile(oldDoc.r2_key).catch(() => {});
      }

      const newDoc = {
        key: docKey,
        name: file.name,
        size: uploadRes.data.size || `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type,
        url: uploadRes.data.url,
        r2_key: uploadRes.data.key,
        uploaded_at: new Date().toISOString()
      };

      const updatedDocs = [...profileData.documents.filter(d => d.key !== docKey), newDoc];

      setProfileData(prev => ({
        ...prev,
        documents: updatedDocs
      }));

      // Persist to database
      await authAPI.updateProfile({
        documents: updatedDocs
      });

      toast.success(`"${file.name}" uploaded to Cloudflare R2 bucket.`);
    } catch (err) {
      console.error('Document upload error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to upload document to Cloudflare R2.');
    } finally {
      setUploadingDocKey(null);
    }
  };

  const removeDocument = async (docKey) => {
    if (!isAdmin && profileData.documents_frozen) {
      toast.error('Documents are locked & verified by HR. Deletion is restricted.');
      return;
    }

    const doc = profileData.documents.find(d => d.key === docKey);
    if (doc?.r2_key) {
      uploadsAPI.deleteFile(doc.r2_key).catch(() => {});
    }

    const updatedDocs = profileData.documents.filter(d => d.key !== docKey);
    setProfileData(prev => ({
      ...prev,
      documents: updatedDocs
    }));

    await authAPI.updateProfile({
      documents: updatedDocs
    });

    toast.info('Document removed from records.');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        phone: profileData.phone,
        avatar_url: profileData.avatar_url,
        personal_info: profileData.personal_info,
        statutory_info: profileData.statutory_info,
        emergency_contacts: profileData.emergency_contacts,
        documents: profileData.documents
      });

      if (res.data?.profile) {
        setProfileData(prev => ({
          ...prev,
          profile_completeness: res.data.profile.profile_completeness
        }));
        if (updateUser) {
          updateUser(res.data.profile);
        }
      }

      toast.success('Employee profile & documents saved to secure company records.');
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to update employee profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress size={36} sx={{ color: '#133829' }} />
      </Box>
    );
  }

  const completeness = profileData.profile_completeness || 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 4, position: 'relative' }}>
      {/* Uploading File Loading Backdrop */}
      <Backdrop
        sx={{
          color: '#ffffff',
          zIndex: (theme) => theme.zIndex.drawer + 999,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)'
        }}
        open={Boolean(uploadingAvatar || uploadingDocKey)}
      >
        <CircularProgress size={52} thickness={4} sx={{ color: '#22c55e' }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff' }}>
            {uploadingAvatar ? 'Optimizing & Uploading Profile Photo...' : 'Uploading Document to Cloudflare R2...'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
            Compressing media and syncing to encrypted cloud storage vault
          </Typography>
        </Box>
      </Backdrop>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFile}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleDocumentFile}
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
      />

      {/* Top Profile Header Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          {/* Avatar with Camera Overlay */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profileData.avatar_url || ''}
              alt={profileData.name}
              sx={{
                width: { xs: 74, sm: 88 },
                height: { xs: 74, sm: 88 },
                borderRadius: '4px',
                bgcolor: '#133829',
                fontSize: 28,
                fontWeight: 800,
                color: '#ffffff',
                border: '2px solid #133829',
                boxShadow: '0 4px 12px rgba(19, 56, 41, 0.15)'
              }}
            >
              {profileData.name?.charAt(0) || 'U'}
            </Avatar>
            <Tooltip title="Upload Profile Photo" arrow>
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  bgcolor: '#133829',
                  color: '#ffffff',
                  p: 0.7,
                  borderRadius: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  '&:hover': { bgcolor: '#0f291e' }
                }}
              >
                <CameraIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {profileData.name}
              </Typography>
              <Chip
                label={profileData.id}
                size="small"
                sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#133829', borderRadius: '4px', fontSize: 11 }}
              />
              <Chip
                label={profileData.role?.toUpperCase()}
                size="small"
                color={profileData.role === 'admin' ? 'primary' : 'default'}
                sx={{ fontWeight: 700, borderRadius: '4px', fontSize: 10, height: 20 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mt: 0.3 }}>
              {profileData.designation} • <strong>{profileData.department}</strong> • {profileData.email}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <SecurityIcon sx={{ fontSize: 14, color: '#15803d' }} />
              Company Verified Employee Record • Work Mode: <strong>{profileData.work_mode === 'wfh' ? 'Remote (WFH)' : 'In-Office (GPS)'}</strong>
            </Typography>
            {profileData.documents_frozen && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.4, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', mt: 1 }}>
                <LockIcon sx={{ fontSize: 14, color: '#dc2626' }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#dc2626', fontSize: 11 }}>
                  Documents Frozen & Verified {profileData.frozen_by_name ? `by ${profileData.frozen_by_name}` : ''}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Side: Profile Completeness Meter & Save Button */}
        <Box sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Profile Completion
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: completeness === 100 ? '#15803d' : '#2563eb' }}>
              {completeness}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completeness}
            sx={{
              height: 6,
              borderRadius: '3px',
              bgcolor: '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                bgcolor: completeness === 100 ? '#16a34a' : completeness >= 70 ? '#2563eb' : '#f59e0b'
              }
            }}
          />

          <Button
            variant="contained"
            fullWidth
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveProfile}
            disabled={saving || (!isAdmin && profileData.documents_frozen)}
            sx={{
              mt: 2,
              fontWeight: 700,
              bgcolor: (!isAdmin && profileData.documents_frozen) ? '#94a3b8' : '#133829',
              color: '#ffffff',
              borderRadius: '4px',
              textTransform: 'none',
              '&:hover': { bgcolor: (!isAdmin && profileData.documents_frozen) ? '#94a3b8' : '#0f291e' }
            }}
          >
            {saving ? 'Saving Profile...' : (!isAdmin && profileData.documents_frozen) ? '🔒 Records Locked by Admin' : 'Save Profile Changes'}
          </Button>

          {/* Admin Freeze / Lock Toggle Button */}
          {isAdmin && (
            <Button
              variant="outlined"
              fullWidth
              color={profileData.documents_frozen ? 'warning' : 'error'}
              startIcon={freezing ? <CircularProgress size={16} color="inherit" /> : profileData.documents_frozen ? <LockOpenIcon /> : <LockIcon />}
              onClick={handleToggleFreeze}
              disabled={freezing}
              sx={{
                mt: 1,
                fontWeight: 700,
                borderRadius: '4px',
                textTransform: 'none',
                fontSize: 12
              }}
            >
              {freezing ? 'Updating Lock...' : profileData.documents_frozen ? 'Unfreeze Documents' : 'Freeze Compliance Documents'}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Frozen Alert Banner */}
      {profileData.documents_frozen && (
        <Paper elevation={0} sx={{ p: 2, mb: 2.5, bgcolor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LockIcon sx={{ color: '#d97706', fontSize: 24 }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#92400e' }}>
              Compliance Documents & Statutory Records are Frozen
            </Typography>
            <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600 }}>
              All uploaded compliance files and statutory tax records have been locked & verified by Company Administration. {!isAdmin ? 'Contact HR to request changes.' : 'As an Administrator, you can unfreeze documents anytime.'}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Navigation Tabs for Profile Categories */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '4px', bgcolor: '#ffffff', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              minHeight: 48,
              color: '#64748b',
              '&.Mui-selected': { color: '#133829', bgcolor: '#ffffff' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#133829',
              height: 3
            }
          }}
        >
          <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Personal Details" />
          <Tab icon={<BadgeIcon fontSize="small" />} iconPosition="start" label="Company & Employment" />
          <Tab icon={<BankIcon fontSize="small" />} iconPosition="start" label="Statutory & Bank Records" />
          <Tab icon={<DocumentIcon fontSize="small" />} iconPosition="start" label={`Company Documents (${profileData.documents.length})`} />
          <Tab icon={<EmergencyIcon fontSize="small" />} iconPosition="start" label="Emergency Contacts" />
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* TAB 0: Personal Information */}
          {activeTab === 0 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.04em', mb: 1 }}>
                  Contact & Identification
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Official Mobile Number"
                  size="small"
                  fullWidth
                  placeholder="+91 98765 43210"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Alternate Contact Number"
                  size="small"
                  fullWidth
                  placeholder="+91 98765 43211"
                  value={profileData.personal_info.alternate_phone}
                  onChange={(e) => handlePersonalChange('alternate_phone', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Personal Email Address"
                  size="small"
                  fullWidth
                  placeholder="personal@gmail.com"
                  value={profileData.personal_info.personal_email}
                  onChange={(e) => handlePersonalChange('personal_email', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={profileData.personal_info.dob}
                  onChange={(e) => handlePersonalChange('dob', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Gender"
                  size="small"
                  fullWidth
                  value={profileData.personal_info.gender}
                  onChange={(e) => handlePersonalChange('gender', e.target.value)}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                  <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Blood Group"
                  size="small"
                  fullWidth
                  value={profileData.personal_info.blood_group}
                  onChange={(e) => handlePersonalChange('blood_group', e.target.value)}
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Marital Status"
                  size="small"
                  fullWidth
                  value={profileData.personal_info.marital_status}
                  onChange={(e) => handlePersonalChange('marital_status', e.target.value)}
                >
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Residential Address"
                  size="small"
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Door No, Street Name, Landmark, City, State, PIN"
                  value={profileData.personal_info.current_address}
                  onChange={(e) => handlePersonalChange('current_address', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Permanent Address"
                  size="small"
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Permanent Residential Address with PIN code"
                  value={profileData.personal_info.permanent_address}
                  onChange={(e) => handlePersonalChange('permanent_address', e.target.value)}
                />
              </Grid>
            </Grid>
          )}

          {/* TAB 1: Company & Employment */}
          {activeTab === 1 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.04em', mb: 1 }}>
                  Official Organization Record (Verified by HR)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Employee ID (System Assigned)"
                  size="small"
                  fullWidth
                  value={profileData.id}
                  disabled
                  helperText="Official system identifier"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Official Company Email"
                  size="small"
                  fullWidth
                  value={profileData.email}
                  disabled
                  helperText="Primary corporate login credential"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Department"
                  size="small"
                  fullWidth
                  value={profileData.department}
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Designation / Position"
                  size="small"
                  fullWidth
                  value={profileData.designation}
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Operating Work Mode"
                  size="small"
                  fullWidth
                  value={profileData.work_mode === 'wfh' ? 'Work From Home (WFH - Remote Authorized)' : 'In-Office (GPS Perimeter Verification)'}
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="User Role & Permission Tier"
                  size="small"
                  fullWidth
                  value={profileData.role === 'admin' ? 'System Administrator / Executive' : 'Employee / Staff Member'}
                  disabled
                />
              </Grid>
            </Grid>
          )}

          {/* TAB 2: Statutory & Bank Records */}
          {activeTab === 2 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.04em', mb: 1 }}>
                  Payroll Bank Account & Statutory Tax Credentials
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Bank Name"
                  size="small"
                  fullWidth
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={profileData.statutory_info.bank_name}
                  onChange={(e) => handleStatutoryChange('bank_name', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Bank Account Number"
                  size="small"
                  fullWidth
                  placeholder="Enter full account number"
                  value={profileData.statutory_info.bank_account_number}
                  onChange={(e) => handleStatutoryChange('bank_account_number', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Bank IFSC Code"
                  size="small"
                  fullWidth
                  placeholder="e.g. HDFC0001234"
                  value={profileData.statutory_info.ifsc_code}
                  onChange={(e) => handleStatutoryChange('ifsc_code', e.target.value.toUpperCase())}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Account Holder Name (As per Bank Records)"
                  size="small"
                  fullWidth
                  placeholder="Full Name as in Passbook"
                  value={profileData.statutory_info.account_holder_name}
                  onChange={(e) => handleStatutoryChange('account_holder_name', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="UPI ID / VPA (For Instant Digital Payroll Payouts)"
                  size="small"
                  fullWidth
                  placeholder="e.g. employee@okaxis, user@okhdfcbank"
                  value={profileData.statutory_info.upi_id || ''}
                  onChange={(e) => handleStatutoryChange('upi_id', e.target.value)}
                  helperText="Instant settlement UPI Virtual Payment Address"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Permanent Account Number (PAN)"
                  size="small"
                  fullWidth
                  placeholder="ABCDE1234F"
                  value={profileData.statutory_info.pan_number}
                  onChange={(e) => handleStatutoryChange('pan_number', e.target.value.toUpperCase())}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Aadhaar Card Number"
                  size="small"
                  fullWidth
                  placeholder="12-digit Aadhaar Number"
                  value={profileData.statutory_info.aadhaar_number}
                  onChange={(e) => handleStatutoryChange('aadhaar_number', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Universal Account Number (UAN / PF)"
                  size="small"
                  fullWidth
                  placeholder="UAN / PF Number (Optional)"
                  value={profileData.statutory_info.uan_pf_number}
                  onChange={(e) => handleStatutoryChange('uan_pf_number', e.target.value)}
                />
              </Grid>
            </Grid>
          )}

          {/* TAB 3: Company Required Documents */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.04em', mb: 1 }}>
                Company Compliance & Verification Documents
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                Please upload clear scanned copies or photos of the documents required for company audit and compliance. Max size: 5MB per file.
              </Typography>

              <Grid container spacing={2}>
                {REQUIRED_DOCUMENTS.map((docDef) => {
                  const uploaded = profileData.documents.find(d => d.key === docDef.key);

                  return (
                    <Grid item xs={12} sm={6} key={docDef.key}>
                      <Card sx={{ border: '1px solid', borderColor: uploaded ? '#bbf7d0' : '#e2e8f0', bgcolor: uploaded ? '#f0fdf4' : '#ffffff', borderRadius: '4px' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DocumentIcon sx={{ color: uploaded ? '#15803d' : '#64748b', fontSize: 20 }} />
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                                {docDef.label}
                              </Typography>
                            </Box>
                            {docDef.required && (
                              <Chip label="Required" size="small" sx={{ height: 18, fontSize: 9, fontWeight: 800, bgcolor: uploaded ? '#dcfce7' : '#fee2e2', color: uploaded ? '#15803d' : '#dc2626', borderRadius: '4px' }} />
                            )}
                          </Box>

                          {uploaded ? (
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#ffffff', p: 1, borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {uploaded.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                                    {uploaded.size} • Uploaded on {uploaded.uploaded_at ? format(new Date(uploaded.uploaded_at), 'MMM d, yyyy') : 'Recent'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                  {uploaded.url && (
                                    <IconButton
                                      size="small"
                                      component="a"
                                      href={uploaded.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ p: 0.5, color: '#133829' }}
                                      title="View Document in Cloudflare R2"
                                    >
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                  {(!isAdmin && profileData.documents_frozen) ? (
                                    <Tooltip title="Document is locked & verified by Company HR" arrow>
                                      <Box sx={{ p: 0.5, display: 'flex', alignItems: 'center' }}>
                                        <LockIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                                      </Box>
                                    </Tooltip>
                                  ) : (
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => removeDocument(docDef.key)}
                                      sx={{ p: 0.5 }}
                                      title="Delete document"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={(!isAdmin && profileData.documents_frozen) ? <LockIcon fontSize="small" /> : <UploadIcon />}
                              onClick={() => triggerDocumentUpload(docDef.key)}
                              disabled={!isAdmin && profileData.documents_frozen}
                              sx={{
                                mt: 1,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                borderRadius: '4px',
                                borderColor: (!isAdmin && profileData.documents_frozen) ? '#e2e8f0' : '#cbd5e1',
                                color: (!isAdmin && profileData.documents_frozen) ? '#94a3b8' : '#334155',
                                '&:hover': { bgcolor: '#f8fafc', borderColor: '#133829' }
                              }}
                            >
                              {(!isAdmin && profileData.documents_frozen) ? 'Upload Locked by Admin' : 'Upload Document'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* TAB 4: Emergency Contacts */}
          {activeTab === 4 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.04em', mb: 1 }}>
                  Primary Emergency Contact Person
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Person Name"
                  size="small"
                  fullWidth
                  placeholder="Full Name of Contact"
                  value={profileData.emergency_contacts.contact_name}
                  onChange={(e) => handleEmergencyChange('contact_name', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Relationship to Employee"
                  size="small"
                  fullWidth
                  value={profileData.emergency_contacts.relationship}
                  onChange={(e) => handleEmergencyChange('relationship', e.target.value)}
                >
                  <MenuItem value="Parent / Father / Mother">Parent / Father / Mother</MenuItem>
                  <MenuItem value="Spouse / Partner">Spouse / Partner</MenuItem>
                  <MenuItem value="Sibling / Brother / Sister">Sibling / Brother / Sister</MenuItem>
                  <MenuItem value="Guardian / Relative">Guardian / Relative</MenuItem>
                  <MenuItem value="Friend / Colleague">Friend / Colleague</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Primary Contact Phone Number"
                  size="small"
                  fullWidth
                  placeholder="+91 98765 43210"
                  value={profileData.emergency_contacts.contact_phone}
                  onChange={(e) => handleEmergencyChange('contact_phone', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Alternate Emergency Phone Number"
                  size="small"
                  fullWidth
                  placeholder="+91 98765 43211 (Optional)"
                  value={profileData.emergency_contacts.alternate_phone}
                  onChange={(e) => handleEmergencyChange('alternate_phone', e.target.value)}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
