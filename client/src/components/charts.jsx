import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { compact } from '../utils/format.js';

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.color = '#64748b';

// Doughnut — expense distribution by category
export const CategoryDoughnut = ({ labels, data, colors }) => (
  <Doughnut
    data={{
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 6,
        },
      ],
    }}
    options={{
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14, usePointStyle: true } },
      },
    }}
  />
);

// Line — spending trend over months
export const TrendLine = ({ labels, data }) => (
  <Line
    data={{
      labels,
      datasets: [
        {
          label: 'Spending',
          data,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#6366f1',
        },
      ],
    }}
    options={{
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => compact(v) }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } },
      },
    }}
  />
);

// Grouped bar — income vs expense
export const IncomeExpenseBar = ({ labels, income, expense }) => (
  <Bar
    data={{
      labels,
      datasets: [
        { label: 'Income', data: income, backgroundColor: '#22c55e', borderRadius: 6 },
        { label: 'Expense', data: expense, backgroundColor: '#f43f5e', borderRadius: 6 },
      ],
    }}
    options={{
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 10 } } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => compact(v) }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } },
      },
    }}
  />
);

// Horizontal bar — budget vs spent
export const BudgetBar = ({ labels, limits, spent }) => (
  <Bar
    data={{
      labels,
      datasets: [
        { label: 'Limit', data: limits, backgroundColor: '#c7d2fe', borderRadius: 6 },
        { label: 'Spent', data: spent, backgroundColor: '#6366f1', borderRadius: 6 },
      ],
    }}
    options={{
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 10 } } },
      scales: {
        x: { beginAtZero: true, ticks: { callback: (v) => compact(v) }, grid: { color: '#f1f5f9' } },
        y: { grid: { display: false } },
      },
    }}
  />
);
