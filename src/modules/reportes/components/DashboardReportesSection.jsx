import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

const DashboardReportesSection = () => {
  return (
    <Box>
      <Box sx={{
        borderRadius: 2,
        p: 3,
        mb: 3,
        background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AssessmentIcon sx={{ fontSize: 40, mr: 2, color: '#fff' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#fff' }}>
            Dashboard de Reportes
          </Typography>
        </Box>
        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
          Visualización y análisis de reportes.
        </Typography>
      </Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#fff' }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button variant="contained" color="primary" startIcon={<AssessmentIcon />} sx={{ backgroundColor: '#1976d2' }}>
              Generar Reporte
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" color="success" sx={{ backgroundColor: '#2e7d32' }}>
              Exportar Datos
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {/* Aquí irá el contenido principal de la sección */}
    </Box>
  );
};

export default DashboardReportesSection; 