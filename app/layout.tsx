import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "医疗行业 2027 秋招岗位情报",
  description: "个人医疗健康行业校招岗位信息雷达",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
