import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchDialog from './SearchDialog';
import { useIsMobile } from '@/mobile/hooks/useIsMobile';

export default function SearchButton() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Set up keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsSearchOpen(true)}
        className={`relative bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 ${
          isMobile ? 'w-full justify-between' : ''
        }`}
      >
        <Search className="h-4 w-4 mr-2" />
        <span>Buscar...</span>
        {!isMobile && (
          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-xs font-medium text-slate-600">
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </Button>
      
      <SearchDialog 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen} 
      />
    </>
  );
}