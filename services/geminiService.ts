
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
if (!API_KEY) {
  console.warn("Gemini API Key is missing! Please set VITE_GEMINI_API_KEY in .env.local");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Audio Diagnosis using Gemini Native Audio model
export const analyzeAudioDiagnosis = async (audioBase64: string): Promise<string> => {
  try {
    // Using native audio preview for multimodal audio understanding
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: audioBase64
            }
          },
          {
            text: "Dengarkan suara mesin kendaraan ini. Analisis kemungkinan kerusakan mekanis berdasarkan suara tersebut. Berikan jawaban singkat dalam Bahasa Indonesia, fokus pada kemungkinan masalah teknis."
          }
        ]
      }
    });
    return response.text || "Tidak dapat menganalisis suara.";
  } catch (error: any) {
    console.error("Gemini Audio Error:", error);
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    return `Gagal: ${errorMessage}`;
  }
};

// Advanced Multimodal Analysis for Booking (Audio + Text)
export const analyzeBookingWithAudio = async (audioBase64: string, complaintText: string, vehicleModel: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: audioBase64
            }
          },
          {
            text: `Anda adalah asisten mekanik AI senior.
            Konteks: Pelanggan melakukan booking servis online.
            Kendaraan: ${vehicleModel}
            Keluhan Pelanggan: "${complaintText}"
            
            Tugas:
            1. Dengarkan audio mesin yang dilampirkan.
            2. Korelasikan suara tersebut dengan keluhan teks pelanggan.
            3. Berikan prediksi teknis penyebab kerusakan.
            4. Berikan estimasi urgensi (Rendah/Sedang/Tinggi).
            
            Format jawaban dalam Bahasa Indonesia. Gunakan format poin-poin (numbered list 1., 2., 3.) agar mudah dibaca. Jangan gunakan markdown bold (**).`
          }
        ]
      }
    });
    return response.text || "Analisis AI tidak tersedia.";
  } catch (error: any) {
    console.error("Gemini Booking Analysis Error:", error);
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    return `Gagal analisis: ${errorMessage}`;
  }
};

// OCR for Invoice using Vision model
export const scanInvoiceOCR = async (imageBase64: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64
            }
          },
          {
            text: "Analisis gambar nota sparepart ini. Ekstrak daftar barang, jumlah, dan harga satuan dalam format JSON Array: [{ name: string, qty: number, price: number }]. Jangan gunakan markdown, hanya JSON raw text."
          }
        ]
      }
    });

    let text = response.text || "[]";
    // Clean up markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return text;
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    return "[]";
  }
};

// CRM Prediction using Text model
export const predictServiceSchedule = async (vehicleHistory: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Berdasarkan riwayat servis ini: ${vehicleHistory}. Prediksi kapan servis berikutnya diperlukan dan apa yang perlu diperiksa. Jawab singkat dalam Bahasa Indonesia.`
    });
    return response.text || "Belum ada data cukup.";
  } catch (error) {
    console.error("Gemini Prediction Error:", error);
    return "Gagal memprediksi jadwal.";
  }
};

// Generate personalized WhatsApp reminder message
export const generateMarketingMessage = async (customerName: string, vehicleModel: string, lastServiceDate: string, serviceType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Buatkan pesan WhatsApp pengingat servis yang ramah, profesional, dan personal untuk pelanggan bengkel 'ABE' (Aplikasi Bengkel). 
            
            Data:
            Nama: ${customerName}
            Kendaraan: ${vehicleModel}
            Servis Terakhir: ${lastServiceDate}
            Rekomendasi Servis: ${serviceType}
            
            Pesan harus menyertakan salam, mengingatkan pentingnya servis tersebut, dan ajakan untuk booking. Sertakan link placeholder [LINK BOOKING]. Jangan terlalu panjang.`
    });
    return response.text || "Halo, waktunya servis kendaraan Anda.";
  } catch (error) {
    console.error("Gemini Message Gen Error:", error);
    return `Halo ${customerName}, waktunya servis ${serviceType} untuk ${vehicleModel} Anda.`;
  }
}
