// Chart.js Integration for XP Farming Simulator
import { fmtK, loc } from './utils.js';

let chartInstance = null;

const BAR_COLORS = ['#FFD700', '#2E86DE', '#00E5FF', '#E04040', '#B04FFF'];
const LABELS = ['Attacks', 'Builders', 'Donations', 'Wars', 'Season'];

/**
 * Initialize the bar chart
 * @param {string} canvasId - Canvas element ID
 * @returns {Object|null} Chart instance or null if canvas not found
 */
export function initChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error('Canvas element not found:', canvasId);
    return null;
  }
  
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded');
    return null;
  }
  
  const ctx = canvas.getContext('2d');
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: LABELS,
      datasets: [{
        label: 'Daily XP',
        data: [0, 0, 0, 0, 0],
        backgroundColor: BAR_COLORS,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 400,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#10161e',
          borderColor: 'rgba(255, 215, 0, 0.2)',
          borderWidth: 1,
          titleColor: '#FFD700',
          bodyColor: '#8899aa',
          padding: 10,
          callbacks: {
            label: (context) => '  ' + loc(context.parsed.y) + ' XP / day'
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11, family: 'Barlow' },
            color: '#556677'
          }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          border: { display: false },
          ticks: {
            font: { size: 11, family: 'Barlow' },
            color: '#556677',
            callback: (v) => fmtK(v) + ' XP'
          }
        }
      }
    }
  });
  
  return chartInstance;
}

/**
 * Update chart with new data
 * @param {Object} xpData - XP breakdown object from calculator
 * @returns {boolean} Success status
 */
export function updateChart(xpData) {
  if (!chartInstance) {
    console.warn('Chart not initialized');
    return false;
  }
  
  const newData = [
    xpData.attacks.xp,
    xpData.builders.xp,
    xpData.donations.xp,
    xpData.wars.xp,
    xpData.season.xp
  ];
  
  chartInstance.data.datasets[0].data = newData;
  chartInstance.update('active');
  
  return true;
}

/**
 * Destroy the chart instance
 */
export function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

/**
 * Get current chart instance
 * @returns {Object|null} Chart instance
 */
export function getChartInstance() {
  return chartInstance;
}

/**
 * Export chart as image
 * @param {string} format - Image format ('png' or 'jpeg')
 * @param {number} quality - Image quality (0-1, JPEG only)
 * @returns {string|null} Data URL or null if export fails
 */
export function exportChart(format = 'png', quality = 1) {
  if (!chartInstance) {
    console.warn('Chart not initialized');
    return null;
  }
  
  try {
    return chartInstance.canvas.toDataURL(`image/${format}`, quality);
  } catch (error) {
    console.error('Failed to export chart:', error);
    return null;
  }
}
