import type { Metadata } from "next";
import AdminPortalClient from "@/components/admin/AdminPortalClient";

export const metadata: Metadata = {
  title: "KNITX Admin — Command Center",
  description:
    "KNITX Backstage Command Center for live storefront customization, drop inventory, Core Wardrobe controls, waitlist queue management, community ballot moderation, and atelier fulfillment.",
};

export default function AdminPage() {
  return <AdminPortalClient />;
}
