import { ClothingItem } from "../types/ClothingItem";
import { categories } from "../data/categories";
import { colors as colorOptions, seasons, occasions } from "../data/options";
import * as FileSystem from "expo-file-system";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

const openai = new OpenAI({
  apiKey: "sk-750557120bb54d75a412a6e5aea0a60f",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

export const categorizeClothing = async (imageUri: string): Promise<Partial<ClothingItem>> => {
  try {
    console.debug("[Categorization Service] Request Initiated Time:", new Date().toISOString());
    // 读取图片并转为Base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });

    // 构建系统提示词
    const categoriesAndSubcategories = Object.entries(categories)
      .map(([category, subcategories]) => {
        const subcategoriesList = subcategories.join(", ");
        return `${category}: ${subcategoriesList}`;
      })
      .join("; ");
    const colorList = colorOptions.join(", ");
    const seasonList = seasons.join(", ");
    const occasionList = occasions.join(", ");

    const systemPrompt = `你是一个服装分类助手，请根据图片内容进行分类。可选类别及子类别有：${categoriesAndSubcategories}。可选颜色有：${colorList}。可选季节有：${seasonList}。可选场合有：${occasionList}。请输出最合适的类别、子类别、颜色、季节和场合，格式为JSON：{category, subcategory, color, season, occasion}`;

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
              text: "请对这件衣服进行分类，并输出类别、子类别、颜色、季节、场合，结果用JSON格式返回。"
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
      const match = aiContent.match(/\{[\s\S]*\}/);
      parsedData = match ? JSON.parse(match[0]) : JSON.parse(aiContent);
    } catch (e) {
      throw new Error("Failed to parse Qwen response as JSON: " + aiContent);
    }

    return {
      category: parsedData.category,
      subcategory: parsedData.subcategory,
      color: parsedData.color,
      season: parsedData.season,
      occasion: parsedData.occasion,
    };
  } catch (error) {
    console.error("Error categorizing clothing:", error);
    throw error;
  }
};
