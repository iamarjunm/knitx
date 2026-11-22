"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Lock, X } from "lucide-react";
import { useVault } from "@/context/VaultContext";
import type { DropCampaign, Product } from "@/lib/types";
import { formatInr } from "@/lib/utils";
import {
  cleanV10Text,
  formatEditionLabel,
  getV10CleanImage,
  getV10ProductImage,
} from "@/components/v10/v10-media";

type FilterKey = "all" | "one-of-one" | "small-batch" | "unveiled";

interface V10ReleaseClientProps {
  drop: DropCampaign;
  products: Product[];
}

export default function V10ReleaseClient({
  drop,
  products,
}: V10ReleaseClientProps) {
  const {
    waitlistPass,
    isVaultUnlocked,
    addToCart,
    unlockVaultWithCode,
    lockVaultPreview,
  } = useVault();

  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [reserveFeedback, setReserveFeedback] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProduct]);

  const editionLabel = formatEditionLabel(drop.dropNumber);

  const revealedPreview = useMemo(
    () => products.filter((p) => !p.isMystery).slice(0, 4),
    [products]
  );

  const oneOfOneCount = useMemo(
    () => products.filter((p) => p.tier === "one-of-one").length,
    [products]
  );

  const smallBatchCount = useMemo(
    () => products.filter((p) => p.tier === "small-batch").length,
    [products]
  );

  const mysteryCount = useMemo(
    () => products.filter((p) => p.isMystery).length,
    [products]
  );

  const indexedProducts = useMemo(
    () => products.map((product, originalIndex) => ({ product, originalIndex })),
    [products]
  );

  const filteredProducts = useMemo(() => {
    switch (activeFilter) {
      case "one-of-one":
        return indexedProducts.filter(
          ({ product }) => product.tier === "one-of-one"
        );
      case "small-batch":
        return indexedProducts.filter(
          ({ product }) => product.tier === "small-batch"
        );
      case "unveiled":
        return indexedProducts.filter(({ product }) => product.isMystery);
      default:
        return indexedProducts;
    }
  }, [activeFilter, indexedProducts]);

  const filterTabs: Array<{ key: FilterKey; label: string }> = [
    { key: "all", label: `ALL SILHOUETTES (${products.length})` },
    { key: "one-of-one", label: `ONE OF ONE (${oneOfOneCount})` },
    { key: "small-batch", label: `SMALL BATCH (${smallBatchCount})` },
    { key: "unveiled", label: `RECENTLY UNVEILED (${mysteryCount})` },
  ];

  const handleUnlockSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setCodeError("Please enter your personal invitation code.");
      return;
    }

    const ok = unlockVaultWithCode(trimmed);
    if (!ok) {
      setCodeError(
        "Invitation code not recognized. Verify your admission email or use the preview code below."
      );
      return;
    }

    setCodeError("");
  };

  const handleOpenDossier = (product: Product, originalIndex: number) => {
    setSelectedProduct(product);
    setSelectedProductIndex(originalIndex);
    setSelectedSize(product.sizes[0] ?? "ONE SIZE");
    setReserveFeedback("");
  };

  const handleReserve = () => {
    if (!selectedProduct) return;
    const chosenSize = selectedSize || selectedProduct.sizes[0] || "ONE SIZE";
    const result = addToCart(selectedProduct, chosenSize);

    if (!result.ok) {
      setReserveFeedback(
        cleanV10Text(
          result.message || "Unable to reserve this garment right now."
        )
      );
      return;
    }

    setReserveFeedback("");
    setSelectedProduct(null);
  };

  const flagshipProduct = products[0];
  const flagshipImage = getV10CleanImage(flagshipProduct?.imageUrl, 0);

  // STATE A — PRIVATE ACCESS GATE
  if (!mounted || !isVaultUnlocked) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] text-[#111110]">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#111110]/10">
            {/* Left — Editorial Preview Column */}
            <div className="lg:col-span-6 p-6 sm:p-10 lg:p-14 lg:border-r border-[#111110]/10 flex flex-col justify-between bg-[#FAF9F6]">
              <div>
                <div className="flex items-center justify-between gap-4 pb-4 font-mono text-[10px] tracking-[0.2em] uppercase text-[#6E6A63]">
                  <span>{editionLabel} · PUBLIC PREVIEW</span>
                  <span>{drop.title}</span>
                </div>

                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#141413]">
                  <Image
                    src={flagshipImage}
                    alt={flagshipProduct?.title || drop.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 48vw"
                    className="object-cover"
                  />
                </div>

                <div className="mt-4 grid grid-cols-4 gap-3">
                  {revealedPreview.map((item, idx) => (
                    <div
                      key={item._id}
                      className="relative aspect-[3/4] w-full overflow-hidden bg-[#141413]"
                    >
                      <Image
                        src={getV10CleanImage(item.imageUrl, idx)}
                        alt={item.title}
                        fill
                        sizes="(max-width: 1024px) 24vw, 11vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#111110]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="font-sans text-xs text-[#6E6A63]">
                  Five silhouettes publicly previewed · Five sealed until
                  admission.
                </p>
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#6E6A63]">
                  {String(products.length).padStart(2, "0")} EDITION PIECES
                </span>
              </div>
            </div>

            {/* Right — Private Admission Desk */}
            <div className="lg:col-span-6 p-6 sm:p-10 lg:p-16 xl:p-24 flex flex-col justify-center bg-[#FFFFFF]">
              <div className="w-full max-w-md mx-auto">
                <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-[#6E6A63]">
                  <span className="inline-block h-1.5 w-1.5 bg-[#8C1D18]" />
                  <span>{editionLabel} · PRIVATE ACCESS</span>
                </div>

                <h1 className="font-editorial text-5xl sm:text-6xl leading-[0.96] tracking-[-0.015em] text-[#111110] mt-5">
                  Reserved for <span className="italic">admitted</span> members.
                </h1>

                <p className="font-sans text-sm leading-relaxed text-[#6E6A63] mt-6">
                  Enter the personal invitation code sent to your email when
                  your waitlist number is called to view all ten garments and
                  reserve pieces.
                </p>

                {mounted && waitlistPass && (
                  <div className="mt-8 border border-[#111110]/10 bg-[#F2EFE9]/70 px-4 py-3.5 flex items-center justify-between gap-4">
                    <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#6E6A63]">
                      YOUR QUEUE POSITION
                    </span>
                    <span className="font-mono text-xs tracking-[0.16em] text-[#111110]">
                      #{String(waitlistPass.position).padStart(4, "0")}
                    </span>
                  </div>
                )}

                <form onSubmit={handleUnlockSubmit} className="mt-10 space-y-6">
                  <div>
                    <label
                      htmlFor="v10-invitation-code"
                      className="block font-mono text-[10px] tracking-[0.2em] uppercase text-[#6E6A63] mb-2"
                    >
                      INVITATION CODE
                    </label>
                    <input
                      id="v10-invitation-code"
                      type="text"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        if (codeError) setCodeError("");
                      }}
                      placeholder="ENTER INVITATION CODE"
                      autoComplete="off"
                      spellCheck={false}
                      suppressHydrationWarning
                      className="w-full rounded-none border-0 border-b border-[#111110]/25 bg-transparent pb-3.5 pt-2 font-mono text-sm uppercase tracking-[0.22em] text-[#111110] placeholder:text-[#6E6A63]/55 focus:border-[#111110] focus:outline-none transition-colors"
                    />
                    {codeError && (
                      <p className="mt-3 font-sans text-xs text-[#8C1D18]">
                        {codeError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    suppressHydrationWarning
                    className="w-full rounded-none bg-[#111110] hover:bg-[#111110]/90 text-[#FAF9F6] px-6 py-4 font-sans text-[11px] font-medium uppercase tracking-[0.22em] transition-colors flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <span>UNLOCK EDITION ROOM</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[#111110]/10 space-y-3">
                  <p className="font-sans text-xs text-[#6E6A63]">
                    Preview invitation code:{" "}
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => {
                        setCode("KNITX-001");
                        setCodeError("");
                      }}
                      className="font-mono text-[11px] tracking-[0.14em] text-[#111110] underline underline-offset-4 decoration-[#111110]/30 hover:decoration-[#111110] transition-colors cursor-pointer"
                    >
                      KNITX-001
                    </button>
                  </p>

                  <div>
                    <Link
                      href="/v10#waitlist-desk"
                      className="inline-flex items-center gap-1.5 font-sans text-xs text-[#6E6A63] hover:text-[#111110] transition-colors"
                    >
                      <span>Not on the list yet? Join the waitlist</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STATE B — UNLOCKED PRIVATE EDITION CATALOG
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111110]">
      {/* Architectural Header Band */}
      <header className="bg-[#FAF9F6] border-b border-[#111110]/10">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14 py-12 sm:py-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-[#6E6A63]">
                <span className="inline-block h-1.5 w-1.5 bg-[#8C1D18]" />
                <span>{editionLabel} · PRIVATE ACCESS ACTIVE</span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-6xl leading-[0.98] tracking-[-0.015em] text-[#111110] mt-4">
                {drop.title}
              </h1>

              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#6E6A63] mt-4">
                {products.length} Numbered Silhouettes · Made To Order
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/v10/archive"
                className="inline-flex items-center gap-2 rounded-none border border-[#111110]/15 bg-[#FFFFFF] hover:border-[#111110] px-5 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-[#111110] transition-colors"
              >
                <span>EDITIONS ARCHIVE</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

              <button
                type="button"
                suppressHydrationWarning
                onClick={lockVaultPreview}
                className="inline-flex items-center gap-2 rounded-none border border-[#111110]/15 bg-transparent hover:border-[#111110] px-5 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-[#6E6A63] hover:text-[#111110] transition-colors cursor-pointer"
              >
                <Lock className="h-3 w-3" />
                <span>LOCK ACCESS</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Hairline Filter Bar */}
      <nav
        aria-label="Edition catalog filters"
        className="sticky top-16 z-20 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#111110]/10"
      >
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14 flex items-center justify-between gap-6 overflow-x-auto">
          <div className="flex items-center gap-7 sm:gap-9 shrink-0">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setActiveFilter(tab.key)}
                  className={`relative py-4 font-sans text-[11px] uppercase tracking-[0.2em] whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? "text-[#111110]"
                      : "text-[#6E6A63] hover:text-[#111110]"
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#111110]" />
                  )}
                </button>
              );
            })}
          </div>

          <span className="hidden lg:inline-block shrink-0 font-mono text-[10px] tracking-[0.18em] uppercase text-[#6E6A63]">
            SELECT ANY SILHOUETTE FOR DOSSIER
          </span>
        </div>
      </nav>

      {/* Editorial Catalog Grid */}
      <section className="bg-[#FFFFFF] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {filteredProducts.map(({ product, originalIndex }) => {
              const isOneOfOne = product.tier === "one-of-one";
              const isSoldOut = product.remainingUnits <= 0;

              return (
                <button
                  key={product._id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleOpenDossier(product, originalIndex)}
                  className="group block w-full rounded-none text-left focus:outline-none cursor-pointer"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#141413]">
                    <Image
                      src={getV10ProductImage(product, originalIndex, true)}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="pt-4 text-left">
                    <div className="flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.18em] uppercase">
                      <span className="text-[#6E6A63]">
                        {product.serialCode}
                      </span>
                      <span
                        className={
                          isOneOfOne ? "text-[#8C1D18]" : "text-[#6E6A63]"
                        }
                      >
                        {isOneOfOne
                          ? "ONE OF ONE"
                          : `EDITION OF ${String(product.totalUnits).padStart(2, "0")}`}
                      </span>
                    </div>

                    <h2 className="font-editorial text-2xl leading-[1.15] text-[#111110] mt-1.5 group-hover:text-[#111110]/70 transition-colors">
                      {product.title}
                    </h2>

                    <div className="flex items-baseline justify-between gap-3 mt-2 pt-2.5 border-t border-[#111110]/10">
                      <span className="font-mono text-xs text-[#111110]">
                        {formatInr(product.priceInr)}
                      </span>
                      <span
                        className={`font-mono text-[10px] tracking-[0.14em] uppercase ${
                          isSoldOut ? "text-[#8C1D18]" : "text-[#6E6A63]"
                        }`}
                      >
                        {isSoldOut
                          ? "Sold Out"
                          : `${product.remainingUnits} of ${product.totalUnits} available`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full-Height Luxury Slide-Over Garment Dossier */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              key="v10-dossier-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 z-50 bg-[#111110]/35 backdrop-blur-[3px]"
            />

            <motion.aside
              key="v10-dossier-panel"
              role="dialog"
              aria-modal="true"
              aria-label={selectedProduct.title}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[#FAF9F6] border-l border-[#111110]/10 overflow-y-auto flex flex-col"
            >
              {/* Sticky Top Dossier Bar */}
              <div className="sticky top-0 z-10 h-14 px-6 sm:px-8 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#111110]/10 flex items-center justify-between gap-4 shrink-0">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6E6A63]">
                  {selectedProduct.serialCode} ·{" "}
                  {selectedProduct.tier === "one-of-one"
                    ? "ONE OF ONE COLLECTOR PIECE"
                    : "SMALL-BATCH EDITION"}
                </span>

                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close garment dossier"
                  className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-[#6E6A63] hover:text-[#111110] transition-colors cursor-pointer"
                >
                  <span>CLOSE</span>
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Editorial Garment Photograph */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#141413] shrink-0">
                <Image
                  src={getV10ProductImage(
                    selectedProduct,
                    selectedProductIndex,
                    true
                  )}
                  alt={selectedProduct.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                />
              </div>

              {/* Dossier Content */}
              <div className="flex-1 bg-[#FFFFFF] p-6 sm:p-10 space-y-8">
                <div>
                  <div className="flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.2em] uppercase">
                    <span
                      className={
                        selectedProduct.tier === "one-of-one"
                          ? "text-[#8C1D18]"
                          : "text-[#6E6A63]"
                      }
                    >
                      {selectedProduct.tier === "one-of-one"
                        ? "ONE OF ONE COLLECTOR PIECE"
                        : `SMALL-BATCH EDITION · ${String(selectedProduct.totalUnits).padStart(2, "0")} UNITS`}
                    </span>
                    <span className="text-[#6E6A63]">{editionLabel}</span>
                  </div>

                  <h2 className="font-editorial text-4xl sm:text-[42px] leading-[1.02] text-[#111110] mt-2.5">
                    {selectedProduct.title}
                  </h2>

                  <div className="mt-4 flex items-baseline justify-between gap-4 pb-6 border-b border-[#111110]/10">
                    <span className="font-mono text-base text-[#111110]">
                      {formatInr(selectedProduct.priceInr)}
                    </span>
                    <span
                      className={`font-mono text-[11px] tracking-[0.16em] uppercase ${
                        selectedProduct.remainingUnits <= 0
                          ? "text-[#8C1D18]"
                          : "text-[#6E6A63]"
                      }`}
                    >
                      {selectedProduct.remainingUnits <= 0
                        ? "Sold Out"
                        : `${selectedProduct.remainingUnits} of ${selectedProduct.totalUnits} available`}
                    </span>
                  </div>

                  <p className="mt-6 font-sans text-sm leading-relaxed text-[#6E6A63]">
                    {cleanV10Text(selectedProduct.description)}
                  </p>
                </div>

                {/* Fabric & GSM Specification Table */}
                <div className="border-t border-b border-[#111110]/10 divide-y divide-[#111110]/10">
                  <div className="py-3.5 grid grid-cols-12 gap-4 items-baseline">
                    <span className="col-span-4 font-mono text-[10px] tracking-[0.18em] uppercase text-[#6E6A63]">
                      FABRIC
                    </span>
                    <span className="col-span-8 font-sans text-xs text-[#111110]">
                      {selectedProduct.fabric}
                    </span>
                  </div>

                  <div className="py-3.5 grid grid-cols-12 gap-4 items-baseline">
                    <span className="col-span-4 font-mono text-[10px] tracking-[0.18em] uppercase text-[#6E6A63]">
                      WEIGHT
                    </span>
                    <span className="col-span-8 font-mono text-xs text-[#111110]">
                      {selectedProduct.gsmWeight}
                    </span>
                  </div>

                  <div className="py-3.5 grid grid-cols-12 gap-4 items-baseline">
                    <span className="col-span-4 font-mono text-[10px] tracking-[0.18em] uppercase text-[#6E6A63]">
                      CUT &amp; SEW LEAD TIME
                    </span>
                    <span className="col-span-8 font-mono text-xs text-[#111110]">
                      {selectedProduct.productionDays} Days
                    </span>
                  </div>

                  {selectedProduct.creatorCredit && (
                    <div className="py-3.5 grid grid-cols-12 gap-4 items-baseline">
                      <span className="col-span-4 font-mono text-[10px] tracking-[0.18em] uppercase text-[#6E6A63]">
                        CREATOR CREDIT
                      </span>
                      <span className="col-span-8 font-mono text-xs text-[#111110]">
                        {selectedProduct.creatorCredit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Craftsmanship Details */}
                <div>
                  <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6E6A63]">
                    CRAFTSMANSHIP &amp; CONSTRUCTION
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {selectedProduct.craftsmanship.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-start gap-3 font-sans text-xs leading-relaxed text-[#111110]"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 bg-[#111110]" />
                        <span>{cleanV10Text(detail)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Architectural Size Selector */}
                <div className="pt-2">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6E6A63]">
                      SELECT SIZE
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#6E6A63]">
                      MADE TO ORDER
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          suppressHydrationWarning
                          onClick={() => {
                            setSelectedSize(size);
                            if (reserveFeedback) setReserveFeedback("");
                          }}
                          className={`min-w-[52px] h-11 px-4 rounded-none border font-mono text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                            isSelected
                              ? "border-[#111110] bg-[#111110] text-[#FAF9F6]"
                              : "border-[#111110]/15 bg-[#FFFFFF] text-[#111110] hover:border-[#111110]"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {reserveFeedback && (
                  <p className="font-sans text-xs text-[#8C1D18]">
                    {reserveFeedback}
                  </p>
                )}

                {/* Primary Reserve Action */}
                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    suppressHydrationWarning
                    disabled={selectedProduct.remainingUnits <= 0}
                    onClick={handleReserve}
                    className="w-full rounded-none bg-[#111110] hover:bg-[#111110]/90 disabled:bg-[#F2EFE9] disabled:text-[#6E6A63] text-[#FAF9F6] px-6 py-4 font-sans text-[11px] font-medium uppercase tracking-[0.22em] transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {selectedProduct.remainingUnits > 0
                      ? `RESERVE PIECE — ${formatInr(selectedProduct.priceInr)}`
                      : "EDITION CLAIMED — SOLD OUT"}
                  </button>

                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#6E6A63] text-center">
                    Individually numbered · Pattern retired permanently once
                    claimed
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
