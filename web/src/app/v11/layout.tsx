import type { Metadata } from "next";
import V11Shell from "@/components/v11/V11Shell";

export const metadata: Metadata = {
  title: "KNITX — Limited-Edition Streetwear",
  description:
    "Numbered small-batch and one-of-one Indian streetwear released exclusively to waitlist members. Cut only when claimed with zero deadstock.",
};

export default function V11Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <V11Shell>{children}</V11Shell>;
}
