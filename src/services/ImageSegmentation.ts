import * as FileSystem from "expo-file-system";
import OpenAI from "openai";
import { ClothingItem } from "../types/ClothingItem";
import { categories } from "../data/categories";
import { colors as colorOptions, seasons, occasions } from "../data/options";

const openai = new OpenAI({
  apiKey: "sk-750557120bb54d75a412a6e5aea0a60f",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

export interface SegmentedClothingItem {
  id: string;
  category: string;
  subcategory: string;
  color: string;
  season: string;
  occasion: string;
  description: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const segmentClothingItems = async (imageUri: string): Promise<SegmentedClothingItem[]> => {
  try {
    console.debug("[Image Segmentation Service] Request Initiated Time:", new Date().toISOString());
    
    // 读取图片并转为Base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });

    // 构建系统提示词
    const categoriesAndSubcategories = Object.entries(categories)
      .map(([category, subcategories]: [string, string[]]) => {
        const subcategoriesList = subcategories.join(", ");
        return `${category}: ${subcategoriesList}`;
      })
      .join("; ");
    const colorList = colorOptions.join(", ");
    const seasonList = seasons.join(", ");
    const occasionList = occasions.join(", ");

    const systemPrompt = `你是一个智能服装识别助手，请识别图片中的所有服装单品。对于每个识别到的衣物，请提供以下信息：
- 类别和子类别（可选类别：${categoriesAndSubcategories}）
- 颜色（可选颜色：${colorList}）
- 季节（可选季节：${seasonList}）
- 场合（可选场合：${occasionList}）
- 详细描述
- 在图片中的大致位置（可选）

请以JSON数组格式返回结果，每个衣物为一个对象：
[{
  "id": "unique_id",
  "category": "类别",
  "subcategory": "子类别",
  "color": "颜色",
  "season": "季节",
  "occasion": "场合",
  "description": "详细描述"
}]`;

    // 构建请求体
    const completion = await openai.chat.completions.create({
      model: "qwen-vl-plus-2025-01-25",
      messages: [
        {
          role: "system",
          content: [
            { type: "text", text: systemPrompt }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64}` }
            },
            {
              type: "text",
              text: "请识别这张照片中的所有服装单品，并为每个单品提供详细的分类信息。结果用JSON数组格式返回。"
            }
          ]
        }
      ]
    });

    // 解析AI返回内容
    let aiContent = completion.choices[0].message.content;
    if (!aiContent) throw new Error("Qwen API response missing content");

    // 尝试提取JSON
    let parsedData;
    try {
      // 兼容AI返回内容前后有多余文本的情况
      const match = aiContent.match(/\[[\s\S]*\]/);
      parsedData = match ? JSON.parse(match[0]) : JSON.parse(aiContent);
    } catch (e) {
      throw new Error("Failed to parse Qwen response as JSON: " + aiContent);
    }

    // 确保返回的是数组
    if (!Array.isArray(parsedData)) {
      throw new Error("Expected array response from image segmentation");
    }

    // 为每个项目生成唯一ID
    const segmentedItems: SegmentedClothingItem[] = parsedData.map((item: any, index: number) => ({
      id: `segmented_${Date.now()}_${index}`,
      category: item.category || "Tops",
      subcategory: item.subcategory || "T-Shirt",
      color: item.color || "Unknown",
      season: item.season || "All Season",
      occasion: item.occasion || "Casual",
      description: item.description || "Clothing item from OOTD photo",
      boundingBox: item.boundingBox || undefined
    }));

    console.debug("[Image Segmentation Service] Process Complete Time:", new Date().toISOString());
    return segmentedItems;
  } catch (error) {
    console.error("Error in image segmentation:", error);
    throw error;
  }
};