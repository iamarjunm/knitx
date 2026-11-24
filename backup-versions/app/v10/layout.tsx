import type { Metadata } from "next";
import V10Shell from "@/components/v10/V10Shell";

export const metadata: Metadata = {
  title: "KNITX — Limited-Edition Streetwear House",
  description:
    "Numbered small-batch and one-of-one Indian streetwear released exclusively to waitlist members. Cut to order with zero deadstock.",
};

export default function V10Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <V10Shell>{children}</V10Shell>;
}
