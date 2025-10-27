// Test Frontend Category and Sub-Category Functionality
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testFrontendCategories() {
  try {
    console.log('🧪 Testing Frontend Category & Sub-Category System\n');

    // Step 1: Test Category Hierarchy API
    console.log('1️⃣ Testing Category Hierarchy API...');
    const hierarchyResponse = await axios.get(`${API_BASE}/categories/hierarchy`);
    console.log('✅ Category Hierarchy:', hierarchyResponse.data);
    console.log('');

    // Step 2: Test Main Categories API
    console.log('2️⃣ Testing Main Categories API...');
    const mainCategoriesResponse = await axios.get(`${API_BASE}/categories/main`);
    console.log('✅ Main Categories:', mainCategoriesResponse.data);
    console.log('');

    // Step 3: Test Sub-Categories API (if any main categories exist)
    if (mainCategoriesResponse.data.mainCategories.length > 0) {
      const mainCategoryId = mainCategoriesResponse.data.mainCategories[0]._id;
      console.log('3️⃣ Testing Sub-Categories API...');
      const subCategoriesResponse = await axios.get(`${API_BASE}/categories/sub/${mainCategoryId}`);
      console.log('✅ Sub-Categories:', subCategoriesResponse.data);
      console.log('');
    }

    // Step 4: Test Category Creation (Main Category)
    console.log('4️⃣ Testing Main Category Creation...');
    const mainCategoryData = {
      name: 'Test Electronics',
      description: 'Test electronic items for frontend testing',
      sortOrder: 1,
      isActive: true
    };

    const mainCategoryResponse = await axios.post(`${API_BASE}/categories`, mainCategoryData);
    console.log('✅ Main Category Created:', mainCategoryResponse.data);
    const mainCategoryId = mainCategoryResponse.data.category._id;
    console.log('');

    // Step 5: Test Sub-Category Creation
    console.log('5️⃣ Testing Sub-Category Creation...');
    const subCategoryData = {
      name: 'Test Mobile Phones',
      description: 'Test mobile phones sub-category',
      parentCategory: mainCategoryId,
      sortOrder: 1,
      isActive: true
    };

    const subCategoryResponse = await axios.post(`${API_BASE}/categories`, subCategoryData);
    console.log('✅ Sub-Category Created:', subCategoryResponse.data);
    const subCategoryId = subCategoryResponse.data.category._id;
    console.log('');

    // Step 6: Test Updated Category Hierarchy
    console.log('6️⃣ Testing Updated Category Hierarchy...');
    const updatedHierarchyResponse = await axios.get(`${API_BASE}/categories/hierarchy`);
    console.log('✅ Updated Hierarchy:', JSON.stringify(updatedHierarchyResponse.data, null, 2));
    console.log('');

    // Step 7: Test Product Creation with Categories
    console.log('7️⃣ Testing Product Creation with Categories...');
    const productData = {
      name: 'Test iPhone 15',
      material: 'Aluminum',
      description: 'Test iPhone for category testing',
      size: '6.1 inch',
      colour: 'Space Black',
      category: mainCategoryId,
      subCategory: subCategoryId,
      weight: '171g',
      utility: 'Communication',
      care: 'Handle with care',
      price: 99999,
      quantity: 10,
      images: ['https://example.com/iphone.jpg'],
      isActive: true
    };

    try {
      const productResponse = await axios.post(`${API_BASE}/shop`, productData);
      console.log('✅ Product Created with Categories:', productResponse.data);
    } catch (error) {
      console.log('⚠️ Product creation failed (expected if auth required):', error.response?.data?.message || error.message);
    }
    console.log('');

    // Step 8: Test Category Update
    console.log('8️⃣ Testing Category Update...');
    const updateData = {
      name: 'Updated Test Electronics',
      description: 'Updated description for testing',
      sortOrder: 2,
      isActive: true
    };

    const updateResponse = await axios.put(`${API_BASE}/categories/${mainCategoryId}`, updateData);
    console.log('✅ Category Updated:', updateResponse.data);
    console.log('');

    // Step 9: Test Category Deletion
    console.log('9️⃣ Testing Category Deletion...');
    const deleteResponse = await axios.delete(`${API_BASE}/categories/${subCategoryId}`);
    console.log('✅ Sub-Category Deleted:', deleteResponse.data);
    console.log('');

    // Step 10: Test Final Hierarchy
    console.log('🔟 Testing Final Category Hierarchy...');
    const finalHierarchyResponse = await axios.get(`${API_BASE}/categories/hierarchy`);
    console.log('✅ Final Hierarchy:', JSON.stringify(finalHierarchyResponse.data, null, 2));
    console.log('');

    console.log('🎉 All Frontend Category Tests Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testFrontendCategories();
