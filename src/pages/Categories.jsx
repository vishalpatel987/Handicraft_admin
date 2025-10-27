import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Grid, List, FolderOpen, Loader2, AlertCircle, ChevronDown, ChevronRight, Folder, FolderPlus } from 'lucide-react';
import apiService from "../services/api";
import config from "../config/config";

const getImageUrl = (imgPath) => {
  if (!imgPath) return '';
  if (imgPath.startsWith('http')) return imgPath;
  return `${config.BACKEND_URL}/pawnbackend/data/${imgPath}`;
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showMainOnly, setShowMainOnly] = useState(false);

  // Fetch all categories from backend API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCategoryHierarchy();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
      setError("Failed to load categories. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Delete category by id
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        setLoading(true);
        await apiService.deleteCategory(id);
        await fetchCategories();
      } catch (error) {
        console.error("Failed to delete category", error);
        setError("Failed to delete category. Please try again later.");
      }
    }
  };

  // Filter categories based on search term and view mode
  const getFilteredCategories = () => {
    let filtered = categories;
    
    // Filter by search term
    if (searchTerm) {
      filtered = categories.filter(category => {
        const matchesMain = category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           category.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesSub = category.subCategories?.some(sub => 
          sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return matchesMain || matchesSub;
      });
    }
    
    // Filter by view mode
    if (showMainOnly) {
      filtered = filtered.filter(category => category.categoryType === 'main');
    }
    
    return filtered;
  };

  const filteredCategories = getFilteredCategories();

  const CategoryCard = ({ category, isSubCategory = false }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${isSubCategory ? 'ml-6 border-l-2 border-blue-200' : ''}`}>
      <div className="relative h-48 sm:h-40 lg:h-48">
        {category.video ? (
          <video
            src={category.video}
            className="w-full h-full object-cover"
            controls
            muted
            loop
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ display: 'flex' }}>
            {isSubCategory ? <Folder className="w-8 h-8 text-gray-400" /> : <FolderOpen className="w-8 h-8 text-gray-400" />}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{category.name}</h3>
          <div className="flex items-center space-x-2">
            {!isSubCategory && (
              <Link
                to={`/admin/products?category=${category._id}`}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                View Products
              </Link>
            )}
            {!isSubCategory && category.subCategories && category.subCategories.length > 0 && (
              <Link
                to={`/admin/categories/${category._id}/subcategories`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Subcategories
              </Link>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{category.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link
              to={`/admin/categories/edit/${category._id}`}
              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </Link>
            <button
              onClick={() => handleDelete(category._id)}
              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          {!isSubCategory && (
            <Link
              to={`/admin/categories/edit/new?parent=${category._id}`}
              className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50"
              title="Add Sub-Category"
            >
              <FolderPlus className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories & Sub-Categories</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your product categories and sub-categories
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/categories/edit/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Main Category
            </Link>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories and sub-categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMainOnly(!showMainOnly)}
              className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                showMainOnly ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Main Only
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Categories Grid/List */}
        {!loading && !error && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map((category) => (
                  <CategoryCard key={category._id} category={category} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCategories.map((category) => (
                        <React.Fragment key={category._id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {category.video ? (
                                    <video
                                      src={category.video}
                                      className="h-10 w-10 rounded-lg object-cover"
                                      controls
                                      muted
                                      loop
                                      preload="metadata"
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  ) : category.image ? (
                                    <img
                                      className="h-10 w-10 rounded-lg object-cover"
                                      src={category.image}
                                      alt={category.name}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                      <FolderOpen className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 line-clamp-2">{category.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Main Category
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <Link
                                  to={`/admin/categories/edit/${category._id}`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </Link>
                                <Link
                                  to={`/admin/categories/edit/new?parent=${category._id}`}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Add Sub
                                </Link>
                                <button
                                  onClick={() => handleDelete(category._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Sub-categories */}
                          {category.subCategories && category.subCategories.length > 0 && expandedCategories.has(category._id) && 
                            category.subCategories.map((subCategory) => (
                              <tr key={subCategory._id} className="hover:bg-gray-50 bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap pl-12">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8">
                                      {subCategory.image ? (
                                        <img
                                          className="h-8 w-8 rounded-lg object-cover"
                                          src={subCategory.image}
                                          alt={subCategory.name}
                                        />
                                      ) : (
                                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                          <Folder className="w-4 h-4 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-700">{subCategory.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600 line-clamp-2">{subCategory.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Sub-Category
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-2">
                                    <Link
                                      to={`/admin/categories/edit/${subCategory._id}`}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Edit
                                    </Link>
                                    <button
                                      onClick={() => handleDelete(subCategory._id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          }
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? "Try adjusting your search term." : "Get started by adding a new main category."}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Link
                      to="/admin/categories/edit/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Main Category
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Categories;
