'use client';

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from 'next/navigation';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const pathname = usePathname();
  const id = pathname?.split('/').filter(Boolean)[1]; // Extract ID from path if it exists

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {pathname === '/' || pathname?.startsWith('/chat/') ? (
          <Index id={id} />
        ) : (
          <NotFound />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
