import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  Button,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';

const ReportBug = () => {
  const [bugReport, setBugReport] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [showAlert, setShowAlert] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('form-name', 'bug-report');
      formData.append('bug-description', bugReport);
      formData.append('user-email', email);

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setBugReport('');
        setEmail('');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
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
        {/* Hidden form for Netlify Forms detection */}
        <form name="bug-report" netlify="true" netlify-honeypot="bot-field" hidden>
          <input type="text" name="form-name" value="bug-report" readOnly />
          <textarea name="bug-description"></textarea>
          <input type="email" name="user-email" />
        </form>

        {/* Actual form */}
        <form onSubmit={handleSubmit}>
          {/* Honeypot field for spam protection */}
          <input type="text" name="bot-field" style={{ display: 'none' }} />
          
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
