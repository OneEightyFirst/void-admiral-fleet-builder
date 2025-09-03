import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  Button,
  Paper,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Folder as FolderIcon, 
  Build as BuildIcon, 
  Palette as PaletteIcon, 
  Edit as EditIcon, 
  PlayArrow as PlayIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import emailjs from '@emailjs/browser';

const ReportBug = ({ FACTIONS, user }) => {
  const [bugReport, setBugReport] = useState('');
  const [email, setEmail] = useState('');
  const [appLocation, setAppLocation] = useState('');
  const [faction, setFaction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [showAlert, setShowAlert] = useState(false);

  // App location options with icons
  const appLocationOptions = [
    { label: 'General', icon: HomeIcon },
    { label: 'Saved Fleets page', icon: FolderIcon },
    { label: 'Fleet build page', icon: EditIcon },
    { label: 'Fleet play page', icon: PlayIcon },
    { label: 'New fleet page', icon: BuildIcon },
    { label: 'Theme page', icon: PaletteIcon }
  ];

  // Faction options (excluding Universal)
  const factionOptions = ['N/A', ...(FACTIONS ? Object.keys(FACTIONS).filter(faction => faction !== 'Universal') : [])];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // EmailJS configuration
      const serviceId = 'service_p5ztxn6';
      const templateId = 'template_q2mxetf';
      const publicKey = 'eO0v_chs0vT7UV0B9';

      // Template parameters (must match your EmailJS template variables)
      const templateParams = {
        message: bugReport,
        user_email: user ? user.email : (email || 'Not provided'),
        user_name: user ? user.displayName : 'Anonymous',
        app_location: appLocation || 'Not specified',
        faction: faction || 'Not specified',
        browser_info: `${navigator.userAgent}`,
        submitted_at: new Date().toLocaleString()
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      setSubmitStatus('success');
      setBugReport('');
      setEmail('');
      setAppLocation('');
      setFaction('');
    } catch (error) {
      console.error('EmailJS error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setShowAlert(true);
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    setSubmitStatus(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Report Bug
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit}>
          {/* Honeypot field for spam protection */}
          <input type="text" name="bot-field" style={{ display: 'none' }} />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>App Location</InputLabel>
            <Select
              value={appLocation}
              label="App Location"
              onChange={(e) => setAppLocation(e.target.value)}
              renderValue={(selected) => {
                const option = appLocationOptions.find(opt => opt.label === selected);
                if (!option) return selected;
                const IconComponent = option.icon;
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconComponent fontSize="small" />
                    {option.label}
                  </Box>
                );
              }}
            >
              {appLocationOptions.map((option) => (
                <MenuItem key={option.label} value={option.label}>
                  <ListItemIcon>
                    <option.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{option.label}</ListItemText>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Faction</InputLabel>
            <Select
              value={faction}
              label="Faction"
              onChange={(e) => setFaction(e.target.value)}
            >
              {factionOptions.map((factionName) => (
                <MenuItem key={factionName} value={factionName}>
                  {factionName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Only show email field for non-authenticated users */}
          {!user && (
            <TextField
              fullWidth
              label="Your Email (optional)"
              placeholder="your@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
              helperText="Optional - only if you want a response"
            />
          )}
          
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Describe the bug"
            placeholder="Please describe what happened, what you expected to happen, and any steps to reproduce the issue..."
            value={bugReport}
            onChange={(e) => setBugReport(e.target.value)}
            variant="outlined"
            sx={{ mb: 3 }}
            required
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!bugReport.trim() || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
          </Button>
        </form>
      </Paper>

      {/* Success/Error Messages */}
      <Snackbar 
        open={showAlert} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={submitStatus === 'success' ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {submitStatus === 'success' 
            ? 'Bug report submitted successfully! Thank you for your feedback.' 
            : 'Failed to submit bug report. Please try again later.'}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportBug;
