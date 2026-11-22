import type { Metadata } from "next";
import V12Shell from "@/components/v12/V12Shell";

export const metadata: Metadata = {
  title: "KNITX — Official Streetwear Flagship",
  description:
    "Limited-run Indian streetwear. 1–4 numbered units per silhouette and one-of-one archival pieces released through private access.",
};

export default function V12Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <V12Shell>{children}</V12Shell>;
}
