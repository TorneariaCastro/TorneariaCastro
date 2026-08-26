"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusDonutChartProps {
  data: { status: string; label: string; quantidade: number; cor: string }[];
}

export function StatusDonutChart({ data }: StatusDonutChartProps) {
  const total = data.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Status das Ordens de Serviço</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="quantidade"
              nameKey="label"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.cor} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--popover-foreground)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-2">
          {data.map((item) => (
            <div key={item.status} className="flex items-center gap-2 text-xs">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.cor }} />
              <span className="truncate text-muted-foreground">{item.label}</span>
              <span className="ml-auto font-medium tabular-nums">{item.quantidade}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">{total} ordens no total</p>
      </CardContent>
    </Card>
  );
}
