import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, Grid, List, Folder, Loader2, AlertCircle, Package } from 'lucide-react';
import apiService from "../services/api";
import config from "../config/config";

const getImageUrl = (imgPath) => {
  if (!imgPath) return '';
  if (imgPath.startsWith('http')) return imgPath;
  return `${config.BACKEND_URL}/pawnbackend/data/${imgPath}`;
};

// Utility function to compare ObjectIds
const compareObjectIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};

const Subcategories = () => {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('subcategories'); // 'subcategories' or 'products'
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Fetch category and subcategories
  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch category details
      const categoryResponse = await apiService.getCategory(categoryId);
      setCategory(categoryResponse.data.category);
      
      // Fetch subcategories
      const subcategoriesResponse = await apiService.getSubCategories(categoryId);
      setSubcategories(subcategoriesResponse.data.subCategories || []);
      
    } catch (error) {
      console.error("Failed to fetch category data", error);
      setError("Failed to load category data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for a subcategory
  const fetchSubcategoryProducts = async (subcategoryId) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching products for subcategory:', subcategoryId);
      
      // Clear previous products first
      setProducts([]);
      
      // Try method 1: Use backend API with subcategory filter
      try {
        const apiUrl = `${config.API_BASE_URL}/api/shop?subCategory=${subcategoryId}`;
        console.log('📡 Method 1 - API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Method 1 - Raw API Response:', data);
          
          let subcategoryProducts = Array.isArray(data) ? data : data.products || [];
          
          // Additional client-side filtering as fallback
          const filteredProducts = subcategoryProducts.filter(product => {
            const matches = compareObjectIds(product.subCategory, subcategoryId);
            console.log(`🔍 Product "${product.name}": subCategory=${product.subCategory}, target=${subcategoryId}, matches=${matches}`);
            return matches;
          });
          
          console.log('📦 Method 1 - Products found (before filter):', subcategoryProducts.length);
          console.log('📦 Method 1 - Products found (after filter):', filteredProducts.length);
          
          if (filteredProducts.length > 0) {
            setProducts(filteredProducts);
            return;
          }
        }
      } catch (method1Error) {
        console.log('❌ Method 1 failed:', method1Error);
      }
      
      // Try method 2: Fetch all products and filter client-side
      console.log('🔄 Trying Method 2 - Fetch all products and filter client-side');
      const allProductsResponse = await fetch(`${config.API_BASE_URL}/api/shop`);
      const allProductsData = await allProductsResponse.json();
      const allProducts = Array.isArray(allProductsData) ? allProductsData : allProductsData.products || [];
      
      console.log('📦 Method 2 - All products fetched:', allProducts.length);
      
      const filteredProducts = allProducts.filter(product => {
        const matches = compareObjectIds(product.subCategory, subcategoryId);
        console.log(`🔍 Product "${product.name}": subCategory=${product.subCategory}, target=${subcategoryId}, matches=${matches}`);
        return matches;
      });
      
      console.log('📦 Method 2 - Products found (after filter):', filteredProducts.length);
      console.log('📋 Product names (after filter):', filteredProducts.map(p => p.name));
      console.log('🔍 Product details (after filter):', filteredProducts.map(p => ({
        name: p.name,
        category: p.category,
        subCategory: p.subCategory
      })));
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error("❌ All methods failed:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      fetchCategoryData();
    }
  }, [categoryId]);

  const filteredSubcategories = subcategories.filter(subcategory =>
    subcategory.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SubcategoryCard = ({ subcategory }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 sm:h-40 lg:h-48">
        {subcategory.video ? (
          <video
            src={subcategory.video}
            className="w-full h-full object-cover"
            controls
            muted
            loop
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : subcategory.image ? (
          <img
            src={subcategory.image}
            alt={subcategory.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ display: 'flex' }}>
            <Folder className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{subcategory.name}</h3>
          <button
            onClick={() => {
              console.log('🖱️ Clicked View Products for subcategory:', subcategory.name, 'ID:', subcategory._id);
              setSelectedSubcategory(subcategory);
              setActiveTab('products');
              fetchSubcategoryProducts(subcategory._id);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Products
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{subcategory.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Link
              to={`/admin/categories/edit/${subcategory._id}`}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this subcategory?')) {
                  // Handle delete
                }
              }}
              className="text-red-600 hover:text-red-800 p-1"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 sm:h-40 lg:h-48">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ display: 'flex' }}>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-green-600">₹{product.price}</span>
          <div className="flex space-x-2">
            <Link
              to={`/admin/products/edit/${product._id}`}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/categories"
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Categories
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {category?.name} - {activeTab === 'subcategories' ? 'Subcategories' : selectedSubcategory?.name || 'Products'}
            </h1>
            <p className="text-gray-600">
              {activeTab === 'subcategories' 
                ? `Manage subcategories for ${category?.name}`
                : `Products in ${selectedSubcategory?.name || 'selected subcategory'}`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('subcategories')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'subcategories'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Subcategories ({subcategories.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {selectedSubcategory ? `${selectedSubcategory.name} Products` : 'Products'} ({products.length})
            </button>
          </div>
          
          {activeTab === 'subcategories' && (
            <Link
              to={`/admin/categories/edit/new?parent=${categoryId}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subcategory
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'subcategories' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSubcategories.map((subcategory) => (
            <SubcategoryCard key={subcategory._id} subcategory={subcategory} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {activeTab === 'subcategories' && filteredSubcategories.length === 0 && (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subcategories found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No subcategories match your search.' : 'This category has no subcategories yet.'}
          </p>
          <Link
            to={`/admin/categories/edit/new?parent=${categoryId}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Subcategory
          </Link>
        </div>
      )}

      {activeTab === 'products' && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'No products match your search.' 
              : `The subcategory "${selectedSubcategory?.name || 'selected'}" has no products yet.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Subcategories;
