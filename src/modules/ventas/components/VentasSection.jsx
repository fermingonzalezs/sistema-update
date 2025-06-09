import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';

const VentasSection = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center space-x-3">
            <ShoppingCartIcon sx={{ fontSize: 40, mr: 2, color: '#fff' }} />
            <div>
              <h1 className="text-2xl font-bold">Registro de Ventas</h1>
              <p className="text-blue-100 mt-1">Gestión de ventas y transacciones</p>
            </div>
          </div>
        </div>
        <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#fff' }}>
          <Grid container spacing={2}>
            <Grid item>
              <Button variant="contained" color="primary" startIcon={<ShoppingCartIcon />} sx={{ backgroundColor: '#1976d2' }}>
                Nueva Venta
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" color="success" sx={{ backgroundColor: '#2e7d32' }}>
                Ver Historial
              </Button>
            </Grid>
          </Grid>
        </Paper>
        {/* Aquí irá el contenido principal de la sección */}
      </div>
    </div>
  );
};

export default VentasSection; 