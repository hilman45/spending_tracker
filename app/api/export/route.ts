import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function escapeCsvCell(value: string): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const category = searchParams.get("category") ?? undefined;

  let query = supabase
    .from("transactions")
    .select("date, amount, currency, description, confirmed_category, files(name)")
    .eq("user_id", user.id);

  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo) query = query.lte("date", dateTo);
  if (category) query = query.eq("confirmed_category", category);

  const { data: rows } = await query.order("date", { ascending: false });

  const header = [
    "Date",
    "Description",
    "Category",
    "Amount",
    "Currency",
    "Source file",
  ];
  const lines = [header.map(escapeCsvCell).join(",")];

  for (const r of rows ?? []) {
    const files = r.files as { name: string }[] | { name: string } | null | undefined;
    const fileObj = Array.isArray(files) ? files[0] : files;
    const file_name = fileObj?.name ?? "";
    lines.push(
      [
        r.date,
        r.description ?? "",
        r.confirmed_category ?? "Other",
        Number(r.amount),
        r.currency ?? "MYR",
        file_name,
      ].map(escapeCsvCell).join(",")
    );
  }

  const csv = lines.join("\n");
  const filename = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
