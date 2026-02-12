"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Pie, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

type ByCategory = { category: string; total: number };
type ByMonth = { month: string; total: number };

export function DashboardCharts({
  byCategory,
  byMonth,
}: {
  byCategory: ByCategory[];
  byMonth: ByMonth[];
}) {
  const pieData = {
    labels: byCategory.map((c) => c.category),
    datasets: [
      {
        data: byCategory.map((c) => c.total),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(236, 72, 153, 0.8)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: byMonth.map((m) => m.month),
    datasets: [
      {
        label: "Spending (MYR)",
        data: byMonth.map((m) => m.total),
        fill: true,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: "bottom" as const },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="mt-8 space-y-8">
      {byCategory.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Spending by category
          </h3>
          <div className="mx-auto mt-2 max-h-[280px] w-full max-w-sm">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      )}
      {byMonth.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Monthly trend
          </h3>
          <div className="mt-2 h-[240px] w-full">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      )}
    </div>
  );
}
