import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Upload, X, ImagePlus, Video, AlertCircle, CheckCircle, Loader2, Folder, FolderOpen, ArrowLeft } from 'lucide-react';
import apiService from "../services/api";

const EditCategoriesNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = id === "new";
  const parentId = searchParams.get('parent');

  const [category, setCategory] = useState({
    _id: "",
    name: "",
    description: "",
    image: "",
    video: "",
    parentCategory: parentId || "",
    categoryType: parentId ? "sub" : "main",
    sortOrder: 0,
    isActive: true,
  });

  const [mainCategories, setMainCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [files, setFiles] = useState({
    image: null,
    video: null,
  });

  const [previewUrls, setPreviewUrls] = useState({
    image: "",
    video: "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [dragOver, setDragOver] = useState({
    image: false,
    video: false,
  });

  // Load main categories for sub-category selection
  useEffect(() => {
    const loadMainCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await apiService.getMainCategories();
        setMainCategories(response.data.mainCategories || []);
      } catch (error) {
        console.error("Error loading main categories:", error);
        showToast("Failed to load main categories", "error");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadMainCategories();
  }, []);

  useEffect(() => {
    if (!isNew) {
      apiService.getCategory(id)
        .then((response) => {
          const cat = response.data.category || response.data;
          if (cat) {
            setCategory({
              _id: cat._id || cat.id,
              name: cat.name || '',
              description: cat.description || '',
              image: cat.image || '',
              video: cat.video || '',
              parentCategory: cat.parentCategory || '',
              categoryType: cat.categoryType || 'main',
              sortOrder: cat.sortOrder || 0,
              isActive: cat.isActive !== false,
            });
            if (cat.image) {
              setPreviewUrls(prev => ({
                ...prev,
                image: cat.image
              }));
            }
            if (cat.video) {
              setPreviewUrls(prev => ({
                ...prev,
                video: cat.video
              }));
            }
          } else {
            showToast("Category not found", "error");
            navigate("/admin/categories");
          }
        })
        .catch((error) => {
          console.error("Error fetching category:", error);
          showToast("Failed to load category details", "error");
        });
    }
  }, [id, isNew, navigate]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategory(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrls(prev => ({ ...prev, [type]: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange({ target: { files: [file] } }, type);
    }
  };

  const removeFile = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setPreviewUrls(prev => ({ ...prev, [type]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!category.name.trim() || !category.description.trim()) {
      showToast("Name and description are required", "error");
      return;
    }

    setLoading(true);

    try {
      console.log('=== Category Form Data ===');
      console.log('isNew:', isNew);
      console.log('id from params:', id);
      console.log('category._id:', category._id);
      console.log('Category Data:', category);
      console.log('Files:', files);
      
      const formData = new FormData();
      formData.append('name', category.name);
      formData.append('description', category.description);
      formData.append('sortOrder', category.sortOrder);
      formData.append('isActive', category.isActive);
      
      if (category.parentCategory && category.parentCategory !== '' && category.parentCategory !== 'undefined') {
        formData.append('parentCategory', category.parentCategory);
        console.log('Adding parentCategory:', category.parentCategory);
      } else {
        console.log('No parentCategory added (main category)');
      }

      if (files.image) {
        formData.append('image', files.image);
      }
      if (files.video) {
        formData.append('video', files.video);
      }

      let response;
      if (isNew || !category._id || category._id === '') {
        console.log('Creating new category...');
        response = await apiService.createCategory(formData);
        console.log('Category creation response:', response);
      } else {
        console.log('Updating existing category...');
        response = await apiService.updateCategory(category._id, formData);
        console.log('Category update response:', response);
      }

      const isCreating = isNew || !category._id || category._id === '';
      showToast(
        isCreating ? "Category created successfully!" : "Category updated successfully!",
        "success"
      );
      
      // Navigate immediately after success
      navigate("/admin/categories");

    } catch (error) {
      console.error("Error saving category:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      showToast(
        error.response?.data?.message || "Failed to save category",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const getPageTitle = () => {
    if (isNew) {
      return category.categoryType === 'sub' ? 'Add Sub-Category' : 'Add Main Category';
    }
    return category.categoryType === 'sub' ? 'Edit Sub-Category' : 'Edit Main Category';
  };

  const getPageDescription = () => {
    if (isNew) {
      return category.categoryType === 'sub' 
        ? 'Create a new sub-category under a main category'
        : 'Create a new main category for your products';
    }
    return category.categoryType === 'sub' 
      ? 'Edit sub-category details'
      : 'Edit main category details';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate("/admin/categories")}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              {category.categoryType === 'sub' ? (
                <Folder className="w-8 h-8 text-green-600 mr-3" />
              ) : (
                <FolderOpen className="w-8 h-8 text-blue-600 mr-3" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="mt-1 text-sm text-gray-500">{getPageDescription()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                
                {/* Category Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Type
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="main"
                        name="categoryType"
                        value="main"
                        checked={category.categoryType === 'main'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label htmlFor="main" className="text-sm text-gray-700">
                        Main Category
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="sub"
                        name="categoryType"
                        value="sub"
                        checked={category.categoryType === 'sub'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label htmlFor="sub" className="text-sm text-gray-700">
                        Sub-Category
                      </label>
                    </div>
                  </div>
                </div>

                {/* Parent Category (for sub-categories) */}
                {category.categoryType === 'sub' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Category
                    </label>
                    {loadingCategories ? (
                      <div className="flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm text-gray-500">Loading categories...</span>
                      </div>
                    ) : (
                      <select
                        name="parentCategory"
                        value={category.parentCategory}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a main category</option>
                        {mainCategories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={category.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter category name"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={category.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter category description"
                    required
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={category.sortOrder}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={category.isActive}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active (visible to users)
                  </label>
                </div>
              </div>

              {/* Right Column - Media Upload */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Upload</h2>
                
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragOver.image
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 'image')}
                    onDragLeave={(e) => handleDragLeave(e, 'image')}
                    onDrop={(e) => handleDrop(e, 'image')}
                  >
                    {previewUrls.image ? (
                      <div className="relative">
                        <img
                          src={previewUrls.image}
                          alt="Preview"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile('image')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Drag and drop an image here, or click to select
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'image')}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Video
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragOver.video
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 'video')}
                    onDragLeave={(e) => handleDragLeave(e, 'video')}
                    onDrop={(e) => handleDrop(e, 'video')}
                  >
                    {previewUrls.video ? (
                      <div className="relative">
                        <video
                          src={previewUrls.video}
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                          controls
                        />
                        <button
                          type="button"
                          onClick={() => removeFile('video')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Video className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Drag and drop a video here, or click to select
                        </p>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleFileChange(e, 'video')}
                          className="hidden"
                          id="video-upload"
                        />
                        <label
                          htmlFor="video-upload"
                          className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Video
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/admin/categories")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isNew ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  isNew ? 'Create Category' : 'Update Category'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Toast */}
        {toast.show && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`flex items-center p-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCategoriesNew;
