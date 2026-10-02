import { useState, useCallback, useEffect } from 'react';

export function useGlobalSearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce search term by 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Only enable the API query when expanded, and debounced term has 1+ chars
  const isQueryEnabled = isExpanded && debouncedTerm.length >= 1;

  // Show dropdown when expanded and user has typed something
  const showDropdown = isExpanded && searchTerm.length >= 1;

  return {
    isExpanded,
    searchTerm,
    debouncedTerm,
    isQueryEnabled,
    showDropdown,
    expand,
    collapse,
    handleSearchChange,
  };
}
