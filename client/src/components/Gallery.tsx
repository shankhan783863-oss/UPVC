import React, { useState, useEffect, useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { galleryItems } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { m } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Gallery() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const [selectedItem, setSelectedItem] = useState<typeof galleryItems[0] | null>(null);
  const selectedItemIndex = galleryItems.findIndex((i) => i.id === selectedItem?.id);

  const navigatePreview = useCallback((dir: 1 | -1) => {
    setSelectedItem((cur) => {
      const idx = galleryItems.findIndex((i) => i.id === cur?.id);
      if (idx === -1) return cur;
      return galleryItems[(idx + dir + galleryItems.length) % galleryItems.length];
    });
  }, []);

  useEffect(() => {
    if (!selectedItem) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigatePreview(1);
      if (e.key === "ArrowLeft") navigatePreview(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedItem, navigatePreview]);

  // Handle carousel selection change
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  // Auto-scroll for mobile
  useEffect(() => {
    if (!emblaApi || !isMobile || !isAutoScrollActive) return;

    const startAutoScroll = () => {
      autoScrollTimerRef.current = setInterval(() => {
        if (emblaApi) {
          emblaApi.scrollNext();
        }
      }, 3000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [emblaApi, isMobile, isAutoScrollActive]);

  // Handle user scroll - pause auto-scroll
  const handleUserScroll = () => {
    if (isMobile) {
      setIsAutoScrollActive(false);

      // Clear existing inactivity timer
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }

      // Resume auto-scroll after 5 seconds of inactivity
      inactivityTimerRef.current = setTimeout(() => {
        setIsAutoScrollActive(true);
      }, 5000);
    }
  };

  const scrollPrev = () => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      handleUserScroll();
    }
  };

  const scrollNext = () => {
    if (emblaApi) {
      emblaApi.scrollNext();
      handleUserScroll();
    }
  };

  return (
    <section id="gallery" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
        >
          <div>
            <span className="text-primary font-bold tracking-wider uppercase text-sm">Our Portfolio</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mt-2">
              Signature <span className="text-primary">Projects</span>
            </h2>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              aria-label="Previous project"
              className="rounded-full w-12 h-12 border-primary/20 hover:bg-primary/10"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              aria-label="Next project"
              className="rounded-full w-12 h-12 border-primary/20 hover:bg-primary/10"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </Button>
          </div>
        </m.div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {galleryItems.map((item) => (
              <div key={item.id} className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 pl-4">
                <m.div whileHover={!isMobile ? { y: -10 } : {}} className="h-full">
                  <Card className="border-none shadow-none h-full bg-transparent cursor-pointer" onClick={() => setSelectedItem(item)}>
                    <CardContent className="p-0 h-[400px] relative group rounded-2xl overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Overlay - Show on hover for desktop, always for mobile */}
                      <div
                        className={`absolute inset-0 transition-opacity duration-300 flex flex-col justify-end p-6 ${
                          isMobile
                            ? "bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100"
                            : "bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <span className="text-accent text-sm font-bold uppercase tracking-wider mb-2">
                          {item.category}
                        </span>
                        <h3 className="text-white text-xl font-serif font-bold">{item.title}</h3>
                      </div>
                    </CardContent>
                  </Card>
                </m.div>
              </div>
            ))}
          </div>
        </div>

        {/* Lightbox Dialog */}
        <Dialog open={selectedItem !== null} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
            {selectedItem && (
              <div className="space-y-3">
                <div className="relative h-[60vh] flex items-center justify-center bg-black/90 rounded-lg overflow-hidden">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    className="max-w-full max-h-full object-contain"
                  />
                  <button
                    onClick={() => navigatePreview(-1)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => navigatePreview(1)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
                <div className="bg-card p-5 rounded-lg flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold mb-1">{selectedItem.title}</h2>
                    <p className="text-primary font-semibold">{selectedItem.category}</p>
                  </div>
                  <span className="text-muted-foreground text-sm shrink-0">
                    {selectedItemIndex + 1} / {galleryItems.length}
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
