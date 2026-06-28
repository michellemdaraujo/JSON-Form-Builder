"use client";

import dynamic from "next/dynamic";

const FormBuilder = dynamic(
  () => import("@/components/FormBuilder").then((m) => m.FormBuilder),
  { ssr: false },
);

export default function Home() {
  return (
    <main className="h-full">
      <FormBuilder />
    </main>
  );
}
