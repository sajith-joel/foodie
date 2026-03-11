import { useState, useMemo } from 'react';

export const useFilters = (items, filterConfig) => {
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const filterFn = filterConfig[key]?.filterFn;
        if (filterFn) {
          filtered = filtered.filter(item => filterFn(item, value));
        } else {
          filtered = filtered.filter(item => 
            item[key]?.toString().toLowerCase().includes(value.toLowerCase())
          );
        }
      }
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        }
        return bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [items, filters, sortBy, sortDirection, filterConfig]);

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const setSorting = (key) => {
    if (sortBy === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  return {
    filteredItems,
    filters,
    setFilter,
    clearFilters,
    sortBy,
    sortDirection,
    setSorting
  };
};