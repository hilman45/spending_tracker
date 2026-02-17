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
          "rgba(16, 185, 129, 0.8)", // Green (Food)
          "rgba(59, 130, 246, 0.8)", // Blue (Transport)
          "rgba(139, 92, 246, 0.8)", // Purple (Housing)
          "rgba(249, 115, 22, 0.8)", // Orange (Entertainment)
          "rgba(236, 72, 153, 0.8)", // Pink (Other)
          "rgba(107, 114, 128, 0.8)", // Gray
        ],
        borderWidth: 0,
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
        borderColor: "#10b981", // Primary green
        backgroundColor: "rgba(16, 185, 129, 0.1)", // Light green fill
        tension: 0.3,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#10b981",
        pointBorderWidth: 2,
        pointRadius: 4,
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
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      {byCategory.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Spending by category
          </h3>
          <div className="mx-auto mt-4 max-h-[300px] w-full max-w-sm flex justify-center">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      )}
      {byMonth.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Monthly trend
          </h3>
          <div className="mt-4 h-[300px] w-full">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      )}
    </div>
  );
}
