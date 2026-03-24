import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FoodCard from '../../components/food/FoodCard';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { getAllMenuItems } from '../../services/menuService';
import toast from 'react-hot-toast';

const Menu = () => {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();

  // Temporarily removed lunch and dinner
  // Original: const categories = ['all', 'breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts'];
  const categories = ['all', 'breakfast', 'snacks', 'beverages', 'desserts'];
  
  /* To restore lunch and dinner later, uncomment the line below and comment the line above
  const categories = ['all', 'breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts'];
  */

  useEffect(() => {
    loadMenuItems();
  }, []);

  useEffect(() => {
    filterFoods();
  }, [searchTerm, selectedCategory, foods]);

  const loadMenuItems = async () => {
    setLoading(true);
    try {
      console.log('Loading menu items from Firestore...');
      const items = await getAllMenuItems();
      console.log('Menu items loaded:', items);
      
      // Show ALL items - don't filter out anything
      // Students should see everything available at the stall
      setFoods(items);
      setFilteredFoods(items);
      
      if (items.length === 0) {
        toast.success('No menu items available yet. Check back later!');
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const filterFoods = () => {
    let filtered = [...foods];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(food => 
        food.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(food => food.category === selectedCategory);
    }

    setFilteredFoods(filtered);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setShowFilters(false);
  };

  const handleRefresh = () => {
    loadMenuItems();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Our Menu</h1>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search for food items..."
              value={searchTerm}
              onChange={handleSearch}
              icon={MagnifyingGlassIcon}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <FunnelIcon className="h-5 w-5" />
            </Button>
            
            {/* Desktop Category Filter */}
            <div className="hidden md:flex gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Mobile Category Filter */}
            {showFilters && (
              <div className="absolute top-20 left-0 right-0 bg-white p-4 shadow-lg rounded-lg z-10 md:hidden">
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredFoods.length} {filteredFoods.length === 1 ? 'item' : 'items'}
      </div>

      {/* Menu Grid */}
      {filteredFoods.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No items found</h2>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'all'
              ? "No items match your search criteria. Try adjusting your filters."
              : "No menu items available at the moment."}
          </p>
          {(searchTerm || selectedCategory !== 'all') && (
            <Button
              variant="primary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFoods.map(food => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;