import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { ClothingContext } from "../contexts/ClothingContext";
import { segmentClothingItems, SegmentedClothingItem } from "../services/ImageSegmentation";
import { colors } from "../styles/colors";
import { typography } from "../styles/globalStyles";
import { createNewClothingItem } from "../types/ClothingItem";
import { v4 as uuidv4 } from "uuid";

const { width: screenWidth } = Dimensions.get("window");

const OOTDRecordingScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [segmentedItems, setSegmentedItems] = useState<SegmentedClothingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const clothingContext = useContext(ClothingContext);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("权限需要", "需要相机权限才能拍照");
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("权限需要", "需要相册权限才能选择照片");
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      await processImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (imageUri: string) => {
    if (!imageUri) return;

    setIsProcessing(true);
    try {
      const items = await segmentClothingItems(imageUri);
      setSegmentedItems(items);
      // 默认选择所有识别出的衣物
      setSelectedItems(new Set(items.map(item => item.id)));
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert("处理错误", "无法识别图片中的衣物，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const saveSelectedItems = async () => {
    if (!clothingContext || !selectedImage) return;

    const itemsToSave = segmentedItems.filter(item => selectedItems.has(item.id));
    
    if (itemsToSave.length === 0) {
      Alert.alert("选择提醒", "请至少选择一个衣物单品");
      return;
    }

    try {
      // 批量保存选中的衣物到衣橱
      const savePromises = itemsToSave.map(async (segmentedItem) => {
        const newClothingItem = {
          ...createNewClothingItem(selectedImage),
          id: uuidv4(),
          category: segmentedItem.category,
          subcategory: segmentedItem.subcategory,
          color: segmentedItem.color,
          season: segmentedItem.season,
          occasion: segmentedItem.occasion,
          notes: segmentedItem.description,
          tags: [segmentedItem.color, segmentedItem.season, segmentedItem.occasion],
        };

        return clothingContext.addClothingItemFromImage(selectedImage, {
          onBackgroundRemovalComplete: () => {
            console.log(`Background removal complete for ${segmentedItem.description}`);
          },
          onCategorizationComplete: () => {
            console.log(`Categorization complete for ${segmentedItem.description}`);
          },
          onError: (error) => {
            console.error(`Error processing ${segmentedItem.description}:`, error);
          },
        });
      });

      await Promise.all(savePromises);
      
      Alert.alert("保存成功", `已保存 ${itemsToSave.length} 件衣物到衣橱`, [
        {
          text: "确定",
          onPress: () => {
            // 重置状态
            setSelectedImage(null);
            setSegmentedItems([]);
            setSelectedItems(new Set());
          },
        },
      ]);
    } catch (error) {
      console.error("Error saving items:", error);
      Alert.alert("保存失败", "保存衣物时出错，请重试");
    }
  };

  const renderSegmentedItem = (item: SegmentedClothingItem, index: number) => {
    const isSelected = selectedItems.has(item.id);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.itemCard, isSelected && styles.selectedItemCard]}
        onPress={() => toggleItemSelection(item.id)}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <Text style={styles.itemSubcategory}>{item.subcategory}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemDetail}>颜色: {item.color}</Text>
            <Text style={styles.itemDetail}>季节: {item.season}</Text>
            <Text style={styles.itemDetail}>场合: {item.occasion}</Text>
          </View>
        </View>
        <View style={styles.selectionIndicator}>
          {isSelected && <MaterialIcons name="check-circle" size={24} color={colors.primary} />}
          {!isSelected && <MaterialIcons name="radio-button-unchecked" size={24} color={colors.text_gray} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OOTD 记录</Text>
        <Text style={styles.subtitle}>拍摄或选择照片来记录你的穿搭</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 图片选择区域 */}
        <View style={styles.imageSection}>
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setSegmentedItems([]);
                  setSelectedItems(new Set());
                }}
              >
                <MaterialIcons name="edit" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                <MaterialIcons name="camera-alt" size={48} color={colors.primary} />
                <Text style={styles.buttonText}>拍照</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                <MaterialIcons name="photo-library" size={48} color={colors.primary} />
                <Text style={styles.buttonText}>选择照片</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 处理状态 */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>正在识别衣物...</Text>
          </View>
        )}

        {/* 识别结果 */}
        {segmentedItems.length > 0 && !isProcessing && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>识别到的衣物单品</Text>
            <Text style={styles.resultsSubtitle}>点击选择要保存的衣物</Text>
            {segmentedItems.map(renderSegmentedItem)}
          </View>
        )}

        {/* 保存按钮 */}
        {segmentedItems.length > 0 && !isProcessing && (
          <TouchableOpacity style={styles.saveButton} onPress={saveSelectedItems}>
            <Text style={styles.saveButtonText}>
              保存选中的衣物 ({selectedItems.size})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screen_background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider_light,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.bold,
    color: colors.text_primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: colors.text_gray,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageSection: {
    marginVertical: 20,
  },
  imageContainer: {
    position: "relative",
    alignItems: "center",
  },
  selectedImage: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 4 / 3,
    borderRadius: 12,
    resizeMode: "cover",
  },
  changeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 8,
  },
  imagePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 40,
  },
  cameraButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card_background,
    borderRadius: 16,
    padding: 24,
    width: 120,
    height: 120,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  galleryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card_background,
    borderRadius: 16,
    padding: 24,
    width: 120,
    height: 120,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: typography.medium,
    color: colors.text_primary,
  },
  processingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: typography.medium,
    color: colors.text_gray,
  },
  resultsSection: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: colors.text_primary,
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: colors.text_gray,
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: colors.card_background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedItemCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  itemInfo: {
    flex: 1,
  },
  itemCategory: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: colors.text_primary,
    marginBottom: 4,
  },
  itemSubcategory: {
    fontSize: 16,
    fontFamily: typography.medium,
    color: colors.text_secondary,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: colors.text_gray,
    marginBottom: 12,
  },
  itemDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  itemDetail: {
    fontSize: 12,
    fontFamily: typography.regular,
    color: colors.text_gray,
    backgroundColor: colors.screen_background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectionIndicator: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: "white",
  },
});

export default OOTDRecordingScreen;