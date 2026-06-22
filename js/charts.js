/* ═══════════════════════════════════════════════════════════════
   AETHER Chart Helpers
   Enterprise AI Workforce Platform — Chart.js Configuration
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};

AETHER.charts = (function () {
  const chartInstances = {};

  // ─── Global Chart.js Defaults ────────────────────────────
  function applyDefaults() {
    if (!window.Chart) return;
    Chart.defaults.color = '#7a85a0';
    Chart.defaults.borderColor = 'rgba(30, 37, 69, 0.6)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = '#1a1f3a';
    Chart.defaults.plugins.tooltip.titleColor = '#e8ecf4';
    Chart.defaults.plugins.tooltip.bodyColor = '#7a85a0';
    Chart.defaults.plugins.tooltip.borderColor = '#1e2545';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
    Chart.defaults.animation = { duration: 800, easing: 'easeOutQuart' };
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
  }

  // ─── Destroy existing chart instance ─────────────────────
  function destroy(id) {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      delete chartInstances[id];
    }
  }

  function destroyAll() {
    Object.keys(chartInstances).forEach(destroy);
  }

  // ─── Common scale configs ────────────────────────────────
  function getScales(opts = {}) {
    return {
      x: {
        grid: { color: 'rgba(30, 37, 69, 0.4)', drawBorder: false },
        ticks: { color: '#4a5470', font: { size: 10 }, maxRotation: 0 },
        border: { display: false },
        ...opts.x
      },
      y: {
        grid: { color: 'rgba(30, 37, 69, 0.4)', drawBorder: false },
        ticks: {
          color: '#4a5470',
          font: { size: 10 },
          callback: opts.yFormat || null
        },
        border: { display: false },
        beginAtZero: opts.beginAtZero !== false,
        ...opts.y
      }
    };
  }

  // ─── Line Chart ──────────────────────────────────────────
  function createLineChart(canvasId, labels, datasets, options = {}) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const defaultDatasets = datasets.map((ds, i) => ({
      label: ds.label || 'Data',
      data: ds.data,
      borderColor: ds.color || ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'][i % 4],
      backgroundColor: ds.fill ? hexToRgba(ds.color || '#3b82f6', 0.08) : 'transparent',
      borderWidth: ds.width || 2.5,
      pointRadius: ds.points === false ? 0 : 3,
      pointHoverRadius: 5,
      pointBackgroundColor: ds.color || '#3b82f6',
      pointBorderColor: '#111631',
      pointBorderWidth: 2,
      tension: 0.4,
      fill: ds.fill || false,
      borderDash: ds.dashed ? [5, 5] : [],
      order: ds.order || 0
    }));

    chartInstances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets: defaultDatasets },
      options: {
        scales: getScales(options),
        plugins: {
          legend: { display: datasets.length > 1, position: 'top', align: 'end', labels: { boxWidth: 8, usePointStyle: true, pointStyle: 'circle', padding: 16 } },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'index', intersect: false },
        ...options.chartOptions
      }
    });

    return chartInstances[canvasId];
  }

  // ─── Area Chart ──────────────────────────────────────────
  function createAreaChart(canvasId, labels, datasets, options = {}) {
    datasets.forEach(ds => { ds.fill = true; });
    return createLineChart(canvasId, labels, datasets, options);
  }

  // ─── Bar Chart ───────────────────────────────────────────
  function createBarChart(canvasId, labels, datasets, options = {}) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const defaultDatasets = datasets.map((ds, i) => ({
      label: ds.label || 'Data',
      data: ds.data,
      backgroundColor: ds.colors || ds.color || ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'][i % 4],
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: ds.radius !== undefined ? ds.radius : 6,
      borderSkipped: false,
      maxBarThickness: ds.maxWidth || 40,
      categoryPercentage: ds.categoryPercentage || 0.7,
      barPercentage: ds.barPercentage || 0.8
    }));

    chartInstances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: defaultDatasets },
      options: {
        indexAxis: options.horizontal ? 'y' : 'x',
        scales: getScales({ beginAtZero: true, ...options }),
        plugins: {
          legend: { display: datasets.length > 1, position: 'top', align: 'end', labels: { boxWidth: 8, usePointStyle: true, pointStyle: 'rect', padding: 16 } }
        },
        ...options.chartOptions
      }
    });

    return chartInstances[canvasId];
  }

  // ─── Horizontal Bar Chart ────────────────────────────────
  function createHorizontalBar(canvasId, labels, data, colors, options = {}) {
    return createBarChart(canvasId, labels, [{ data, colors }], { horizontal: true, ...options });
  }

  // ─── Doughnut Chart ──────────────────────────────────────
  function createDoughnutChart(canvasId, labels, data, colors, options = {}) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    chartInstances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#111631',
          borderWidth: 2,
          hoverBorderColor: '#1e2545',
          hoverOffset: 4
        }]
      },
      options: {
        cutout: options.cutout || '72%',
        plugins: {
          legend: {
            display: options.legend !== false,
            position: options.legendPosition || 'bottom',
            labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', padding: 12, color: '#7a85a0', font: { size: 11 } }
          }
        },
        ...options.chartOptions
      }
    });

    return chartInstances[canvasId];
  }

  // ─── Radar Chart ─────────────────────────────────────────
  function createRadarChart(canvasId, labels, datasets, options = {}) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const defaultDatasets = datasets.map((ds, i) => ({
      label: ds.label || 'Data',
      data: ds.data,
      borderColor: ds.color || ['#3b82f6', '#8b5cf6'][i % 2],
      backgroundColor: hexToRgba(ds.color || ['#3b82f6', '#8b5cf6'][i % 2], 0.1),
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: ds.color || ['#3b82f6', '#8b5cf6'][i % 2],
      pointBorderColor: '#111631',
      pointBorderWidth: 2
    }));

    chartInstances[canvasId] = new Chart(canvas, {
      type: 'radar',
      data: { labels, datasets: defaultDatasets },
      options: {
        scales: {
          r: {
            angleLines: { color: 'rgba(30, 37, 69, 0.4)' },
            grid: { color: 'rgba(30, 37, 69, 0.4)' },
            pointLabels: { color: '#7a85a0', font: { size: 10 } },
            ticks: { display: false, stepSize: 20 },
            suggestedMin: 0,
            suggestedMax: 100,
            ...options.r
          }
        },
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', padding: 16, color: '#7a85a0' } }
        },
        ...options.chartOptions
      }
    });

    return chartInstances[canvasId];
  }

  // ─── Sparkline (tiny inline chart) ───────────────────────
  function createSparkline(canvasId, data, color) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    chartInstances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data,
          borderColor: color || '#3b82f6',
          backgroundColor: hexToRgba(color || '#3b82f6', 0.1),
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { display: false }, y: { display: false } },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { duration: 600 }
      }
    });

    return chartInstances[canvasId];
  }

  // ─── Utility ─────────────────────────────────────────────
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  return {
    applyDefaults,
    destroy,
    destroyAll,
    createLineChart,
    createAreaChart,
    createBarChart,
    createHorizontalBar,
    createDoughnutChart,
    createRadarChart,
    createSparkline,
    hexToRgba
  };
})();
