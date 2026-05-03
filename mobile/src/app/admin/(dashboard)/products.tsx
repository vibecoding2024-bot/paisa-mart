import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Image,
  Switch,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  Check,
  ChevronDown,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import {
  useProductStore,
  type ProductDetails,
  type Language,
} from '@/lib/product-store';
import { useAdminStore } from '@/lib/admin-store';

const CATEGORIES = [
  { id: 'credit-cards', label: 'Credit Cards' },
  { id: 'bank-accounts', label: 'Bank Accounts' },
  { id: 'home-loans', label: 'Home Loans' },
  { id: 'personal-loans', label: 'Personal Loans' },
  { id: 'vehicle-loans', label: 'Vehicle Loans' },
  { id: 'business-loans', label: 'Business Loans' },
  { id: 'insta-loans', label: 'Insta Loans' },
  { id: 'health-insurance', label: 'Health Insurance' },
  { id: 'life-insurance', label: 'Life Insurance' },
  { id: 'motor-insurance', label: 'Motor Insurance' },
  { id: 'gold-loans', label: 'Gold Loans' },
  { id: 'real-estate', label: 'Real Estate' },
];

export default function ProductsAdminScreen() {
  const products = useProductStore((s) => s.products);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const addProduct = useProductStore((s) => s.addProduct);
  const deleteProduct = useProductStore((s) => s.deleteProduct);

  const currentAdmin = useAdminStore((s) => s.currentAdmin);
  const logAction = useAdminStore((s) => s.logAction);

  const isAdmin = currentAdmin?.role === 'admin';

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetails | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      product.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle edit
  const handleEdit = useCallback((product: ProductDetails) => {
    setEditingProduct({ ...product });
    setShowEditModal(true);
  }, []);

  // Handle toggle enabled
  const handleToggleEnabled = useCallback(
    (productId: string, enabled: boolean) => {
      updateProduct(productId, { enabled });
      logAction(`${enabled ? 'Enabled' : 'Disabled'} product: ${productId}`, 'setting');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [updateProduct, logAction]
  );

  // Handle save product
  const handleSaveProduct = useCallback(() => {
    if (!editingProduct) return;

    if (!editingProduct.providerName || !editingProduct.productName) {
      Alert.alert('Error', 'Provider name and product name are required');
      return;
    }

    const existingProduct = products.find((p) => p.id === editingProduct.id);

    if (existingProduct) {
      updateProduct(editingProduct.id, editingProduct);
      logAction(`Updated product: ${editingProduct.id}`, 'setting');
    } else {
      addProduct(editingProduct);
      logAction(`Added new product: ${editingProduct.id}`, 'setting');
    }

    setShowEditModal(false);
    setEditingProduct(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [editingProduct, products, updateProduct, addProduct, logAction]);

  // Handle delete
  const handleDelete = useCallback(
    (productId: string) => {
      Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct(productId);
            logAction(`Deleted product: ${productId}`, 'setting');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]);
    },
    [deleteProduct, logAction]
  );

  // Handle create new
  const handleCreateNew = useCallback(() => {
    const newProduct: ProductDetails = {
      id: `new-product-${Date.now()}`,
      providerName: '',
      productName: '',
      category: 'credit-cards',
      bannerImageUrl: '',
      commission: '',
      tag: 'Bank',
      enabled: true,
      content: {
        headline: {
          english: '',
          hindi: '',
          telugu: '',
        },
        description: {
          english: '',
          hindi: '',
          telugu: '',
        },
        benefits: [
          { english: '', hindi: '', telugu: '' },
          { english: '', hindi: '', telugu: '' },
          { english: '', hindi: '', telugu: '' },
        ],
        reasons: [
          { english: '', hindi: '', telugu: '' },
          { english: '', hindi: '', telugu: '' },
        ],
      },
    };
    setEditingProduct(newProduct);
    setShowEditModal(true);
  }, []);

  // Update editing product field
  const updateEditingField = useCallback(
    (field: string, value: string | boolean) => {
      if (!editingProduct) return;
      setEditingProduct((prev) => (prev ? { ...prev, [field]: value } : null));
    },
    [editingProduct]
  );

  // Update content field
  const updateContentField = useCallback(
    (
      section: 'headline' | 'description',
      lang: Language,
      value: string
    ) => {
      if (!editingProduct) return;
      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              content: {
                ...prev.content,
                [section]: {
                  ...prev.content[section],
                  [lang]: value,
                },
              },
            }
          : null
      );
    },
    [editingProduct]
  );

  // Update benefit
  const updateBenefit = useCallback(
    (index: number, lang: Language, value: string) => {
      if (!editingProduct) return;
      setEditingProduct((prev) => {
        if (!prev) return null;
        const newBenefits = [...prev.content.benefits];
        newBenefits[index] = { ...newBenefits[index], [lang]: value };
        return {
          ...prev,
          content: { ...prev.content, benefits: newBenefits },
        };
      });
    },
    [editingProduct]
  );

  // Update reason
  const updateReason = useCallback(
    (index: number, lang: Language, value: string) => {
      if (!editingProduct) return;
      setEditingProduct((prev) => {
        if (!prev) return null;
        const newReasons = [...prev.content.reasons];
        newReasons[index] = { ...newReasons[index], [lang]: value };
        return {
          ...prev,
          content: { ...prev.content, reasons: newReasons },
        };
      });
    },
    [editingProduct]
  );

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="p-4 border-b border-slate-800">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xl font-bold">Product Management</Text>
            <Text className="text-slate-400 text-sm mt-1">
              Manage banners, content, and T&C for products
            </Text>
          </View>
          {isAdmin && (
            <Pressable
              onPress={handleCreateNew}
              className="bg-orange-500 rounded-xl px-4 py-2 flex-row items-center"
            >
              <Plus size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Add</Text>
            </Pressable>
          )}
        </View>

        {/* Search */}
        <View className="bg-slate-800 rounded-xl flex-row items-center px-4 mt-4">
          <Search size={18} color="#64748B" />
          <TextInput
            className="flex-1 text-white py-3 ml-3"
            placeholder="Search products..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filter */}
      <View className="border-b border-slate-800">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 12 }}
          style={{ flexGrow: 0 }}
        >
          <Pressable
            onPress={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg mr-2 ${
              !selectedCategory ? 'bg-orange-500' : 'bg-slate-800'
            }`}
          >
            <Text className={!selectedCategory ? 'text-white' : 'text-slate-400'}>
              All
            </Text>
          </Pressable>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg mr-2 ${
                selectedCategory === cat.id ? 'bg-orange-500' : 'bg-slate-800'
              }`}
            >
              <Text
                className={
                  selectedCategory === cat.id ? 'text-white' : 'text-slate-400'
                }
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Products List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <Text className="text-slate-400 text-sm mb-4">
            {filteredProducts.length} products found
          </Text>

          {filteredProducts.map((product, index) => (
            <Animated.View
              key={product.id}
              entering={FadeInDown.delay(index * 50)}
              className="bg-slate-800 rounded-xl mb-3 overflow-hidden"
            >
              {/* Product Header */}
              <View className="flex-row p-4">
                {/* Banner Preview */}
                <View className="w-20 h-20 bg-slate-700 rounded-xl overflow-hidden mr-4">
                  {product.bannerImageUrl ? (
                    <Image
                      source={{ uri: product.bannerImageUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <ImageIcon size={24} color="#64748B" />
                    </View>
                  )}
                </View>

                {/* Product Info */}
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white font-semibold flex-1">
                      {product.providerName}
                    </Text>
                    <Switch
                      value={product.enabled}
                      onValueChange={(value) => handleToggleEnabled(product.id, value)}
                      trackColor={{ false: '#374151', true: '#22C55E' }}
                      thumbColor="#fff"
                    />
                  </View>
                  <Text className="text-slate-400 text-sm">{product.productName}</Text>
                  <View className="flex-row items-center mt-2">
                    {product.tag && (
                      <View className="bg-slate-700 px-2 py-0.5 rounded mr-2">
                        <Text className="text-slate-300 text-xs">{product.tag}</Text>
                      </View>
                    )}
                    <Text className="text-green-400 text-xs">{product.commission}</Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              {isAdmin && (
                <View className="flex-row border-t border-slate-700">
                  <Pressable
                    onPress={() => handleEdit(product)}
                    className="flex-1 flex-row items-center justify-center py-3 border-r border-slate-700"
                  >
                    <Edit2 size={16} color="#94A3B8" />
                    <Text className="text-slate-400 ml-2">Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(product.id)}
                    className="flex-1 flex-row items-center justify-center py-3"
                  >
                    <Trash2 size={16} color="#EF4444" />
                    <Text className="text-red-400 ml-2">Delete</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          ))}

          {filteredProducts.length === 0 && (
            <View className="bg-slate-800 rounded-xl p-8 items-center">
              <Package size={40} color="#64748B" />
              <Text className="text-slate-400 mt-4">No products found</Text>
            </View>
          )}
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-slate-900 rounded-t-3xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-slate-800">
              <Text className="text-white text-lg font-semibold">
                {editingProduct?.id.startsWith('new-') ? 'Add Product' : 'Edit Product'}
              </Text>
              <View className="flex-row items-center">
                <Pressable
                  onPress={handleSaveProduct}
                  className="bg-orange-500 rounded-lg px-4 py-2 mr-2"
                >
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="p-2"
                >
                  <X size={24} color="#94A3B8" />
                </Pressable>
              </View>
            </View>

            {editingProduct && (
              <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                {/* Basic Info */}
                <View className="bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-white font-semibold mb-4">Basic Information</Text>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Provider Name *</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="e.g. Axis Bank"
                      placeholderTextColor="#64748B"
                      value={editingProduct.providerName}
                      onChangeText={(text) => updateEditingField('providerName', text)}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Product Name *</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="e.g. Credit Card"
                      placeholderTextColor="#64748B"
                      value={editingProduct.productName}
                      onChangeText={(text) => updateEditingField('productName', text)}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Category</Text>
                    <Pressable
                      onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="bg-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between"
                    >
                      <Text className="text-white">
                        {CATEGORIES.find((c) => c.id === editingProduct.category)?.label ||
                          'Select Category'}
                      </Text>
                      <ChevronDown size={18} color="#94A3B8" />
                    </Pressable>
                    {showCategoryDropdown && (
                      <View className="bg-slate-700 rounded-xl mt-2 overflow-hidden">
                        {CATEGORIES.map((cat) => (
                          <Pressable
                            key={cat.id}
                            onPress={() => {
                              updateEditingField('category', cat.id);
                              setShowCategoryDropdown(false);
                            }}
                            className={`px-4 py-3 border-b border-slate-600 ${
                              editingProduct.category === cat.id ? 'bg-orange-500/20' : ''
                            }`}
                          >
                            <Text
                              className={
                                editingProduct.category === cat.id
                                  ? 'text-orange-400'
                                  : 'text-white'
                              }
                            >
                              {cat.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Commission</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="e.g. Earn up to ₹2,000"
                      placeholderTextColor="#64748B"
                      value={editingProduct.commission}
                      onChangeText={(text) => updateEditingField('commission', text)}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Tag</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="e.g. Bank, NBFC, Insurance"
                      placeholderTextColor="#64748B"
                      value={editingProduct.tag || ''}
                      onChangeText={(text) => updateEditingField('tag', text)}
                    />
                  </View>
                </View>

                {/* Banner Image */}
                <View className="bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-white font-semibold mb-4">Banner Image</Text>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Image URL</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="https://example.com/banner.jpg"
                      placeholderTextColor="#64748B"
                      value={editingProduct.bannerImageUrl}
                      onChangeText={(text) => updateEditingField('bannerImageUrl', text)}
                    />
                  </View>

                  {editingProduct.bannerImageUrl && (
                    <View className="bg-slate-700 rounded-xl overflow-hidden">
                      <Image
                        source={{ uri: editingProduct.bannerImageUrl }}
                        className="w-full h-40"
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  <Text className="text-slate-500 text-xs mt-2">
                    You can use images from Unsplash, Pexels, or upload to your server
                  </Text>
                </View>

                {/* Content - English */}
                <View className="bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-white font-semibold mb-4">Content (English)</Text>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Headline</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="Experience a world of rewards!"
                      placeholderTextColor="#64748B"
                      value={editingProduct.content.headline.english}
                      onChangeText={(text) => updateContentField('headline', 'english', text)}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Description</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="Choose from a variety of cards..."
                      placeholderTextColor="#64748B"
                      multiline
                      numberOfLines={3}
                      value={editingProduct.content.description.english}
                      onChangeText={(text) => updateContentField('description', 'english', text)}
                    />
                  </View>

                  <Text className="text-slate-400 text-sm mb-2">Benefits</Text>
                  {editingProduct.content.benefits.map((benefit, index) => (
                    <TextInput
                      key={index}
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white mb-2"
                      placeholder={`Benefit ${index + 1}`}
                      placeholderTextColor="#64748B"
                      value={benefit.english}
                      onChangeText={(text) => updateBenefit(index, 'english', text)}
                    />
                  ))}

                  <Text className="text-slate-400 text-sm mb-2 mt-4">Why Apply (Reasons)</Text>
                  {editingProduct.content.reasons.map((reason, index) => (
                    <TextInput
                      key={index}
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white mb-2"
                      placeholder={`Reason ${index + 1}`}
                      placeholderTextColor="#64748B"
                      value={reason.english}
                      onChangeText={(text) => updateReason(index, 'english', text)}
                    />
                  ))}
                </View>

                {/* Content - Hindi */}
                <View className="bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-white font-semibold mb-4">Content (Hindi)</Text>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Headline</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="रिवॉर्ड्स की दुनिया का अनुभव करें!"
                      placeholderTextColor="#64748B"
                      value={editingProduct.content.headline.hindi}
                      onChangeText={(text) => updateContentField('headline', 'hindi', text)}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Description</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="विभिन्न कार्ड्स में से चुनें..."
                      placeholderTextColor="#64748B"
                      multiline
                      numberOfLines={3}
                      value={editingProduct.content.description.hindi}
                      onChangeText={(text) => updateContentField('description', 'hindi', text)}
                    />
                  </View>

                  <Text className="text-slate-400 text-sm mb-2">Benefits</Text>
                  {editingProduct.content.benefits.map((benefit, index) => (
                    <TextInput
                      key={index}
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white mb-2"
                      placeholder={`लाभ ${index + 1}`}
                      placeholderTextColor="#64748B"
                      value={benefit.hindi}
                      onChangeText={(text) => updateBenefit(index, 'hindi', text)}
                    />
                  ))}

                  <Text className="text-slate-400 text-sm mb-2 mt-4">Why Apply (Reasons)</Text>
                  {editingProduct.content.reasons.map((reason, index) => (
                    <TextInput
                      key={index}
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white mb-2"
                      placeholder={`कारण ${index + 1}`}
                      placeholderTextColor="#64748B"
                      value={reason.hindi}
                      onChangeText={(text) => updateReason(index, 'hindi', text)}
                    />
                  ))}
                </View>

                {/* Content - Telugu */}
                <View className="bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-white font-semibold mb-4">Content (Telugu)</Text>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Headline</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="రివార్డ్స్ ప్రపంచాన్ని అనుభవించండి!"
                      placeholderTextColor="#64748B"
                      value={editingProduct.content.headline.telugu}
                      onChangeText={(text) => updateContentField('headline', 'telugu', text)}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Description</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="వివిధ కార్డ్స్ నుండి ఎంచుకోండి..."
                      placeholderTextColor="#64748B"
                      multiline
                      numberOfLines={3}
                      value={editingProduct.content.description.telugu}
                      onChangeText={(text) => updateContentField('description', 'telugu', text)}
                    />
                  </View>

                  <Text className="text-slate-400 text-sm mb-2">Benefits</Text>
                  {editingProduct.content.benefits.map((benefit, index) => (
                    <TextInput
                      key={index}
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white mb-2"
                      placeholder={`ప్రయోజనం ${index + 1}`}
                      placeholderTextColor="#64748B"
                      value={benefit.telugu}
                      onChangeText={(text) => updateBenefit(index, 'telugu', text)}
                    />
                  ))}

                  <Text className="text-slate-400 text-sm mb-2 mt-4">Why Apply (Reasons)</Text>
                  {editingProduct.content.reasons.map((reason, index) => (
                    <TextInput
                      key={index}
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white mb-2"
                      placeholder={`కారణం ${index + 1}`}
                      placeholderTextColor="#64748B"
                      value={reason.telugu}
                      onChangeText={(text) => updateReason(index, 'telugu', text)}
                    />
                  ))}
                </View>

                <View className="h-20" />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
