import { useState, useMemo } from 'react';

interface FilterOptions<T> {
  searchFields: (keyof T)[];
  filterFunctions?: Record<string, (item: T) => boolean>;
}

export function useTableFiltering<T>(
  data: T[],
  options: FilterOptions<T>
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        options.searchFields.some(field => {
          const value = item[field];
          return value && 
            typeof value === 'string' && 
            value.toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply custom filters
    if (options.filterFunctions) {
      Object.entries(activeFilters).forEach(([filterKey, isActive]) => {
        if (isActive && options.filterFunctions![filterKey]) {
          filtered = filtered.filter(options.filterFunctions![filterKey]);
        }
      });
    }

    return filtered;
  }, [data, searchTerm, activeFilters, options]);

  const toggleFilter = (filterKey: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveFilters({});
  };

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
    activeFilters,
    toggleFilter,
    clearFilters,
    hasActiveFilters: searchTerm.trim() !== '' || Object.values(activeFilters).some(Boolean)
  };
}