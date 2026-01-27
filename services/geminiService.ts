
import { GoogleGenAI } from "@google/genai";

// SECURE: API Key managed via Environment Variables (.env.local)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
if (!API_KEY) {
  console.warn("Gemini API Key is missing! Using mock responses for development.");
}
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Mock responses for development when API key is not available
const getMockAnalysis = (complaintText: string, vehicleModel: string): string => {
  const mockResponses = [
    "1. Berdasarkan keluhan suara mesin kasar, kemungkinan masalah pada sistem pembakaran atau filter udara kotor.\n2. Rekomendasi: Periksa filter udara dan busi.\n3. Urgensi: Sedang",
    "1. Suara berisik saat berakselerasi dapat mengindikasikan masalah pada transmisi atau kopling.\n2. Rekomendasi: Inspeksi sistem transmisi dan kopling.\n3. Urgensi: Tinggi",
    "1. Getaran pada idle menunjukkan kemungkinan masalah pada engine mount atau sistem bahan bakar.\n2. Rekomendasi: Periksa engine mount dan sistem injeksi.\n3. Urgensi: Sedang",
    "1. Suara berderit saat belok kemungkinan masalah pada power steering atau bearing roda.\n2. Rekomendasi: Inspeksi sistem kemudi dan bearing.\n3. Urgensi: Sedang",
    "1. Bunyi kasar pada mesin dapat disebabkan oli kotor atau komponen internal yang aus.\n2. Rekomendasi: Ganti oli dan filter oli, periksa komponen internal.\n3. Urgensi: Tinggi"
  ];
  
  const randomIndex = Math.floor(Math.random() * mockResponses.length);
  return `[DEMO MODE - ${vehicleModel}]\n${mockResponses[randomIndex]}`;
};

// Audio Diagnosis using Gemini Native Audio model
export const analyzeAudioDiagnosis = async (audioBase64: string): Promise<string> => {
  if (!API_KEY || !ai) {
    return getMockAnalysis("Audio analysis", "Unknown vehicle");
  }

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
    console.error("Gagal analisis audio:", error);
    return getMockAnalysis("Audio error fallback", "Vehicle");
  }
};

// Advanced Multimodal Analysis for Booking (Audio + Text)
export const analyzeBookingWithAudio = async (audioBase64: string, complaintText: string, vehicleModel: string): Promise<string> => {
  if (!API_KEY || !ai) {
    return getMockAnalysis(complaintText, vehicleModel);
  }

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
    console.error("Gagal analisis booking:", error);
    return getMockAnalysis(complaintText, vehicleModel);
  }
};

// OCR for Invoice using Vision model
export const scanInvoiceOCR = async (imageBase64: string): Promise<string> => {
  if (!API_KEY || !ai) {
    // Mock OCR response for development
    return '[{"name": "Filter Oli", "qty": 1, "price": 25000}, {"name": "Oli Mesin SAE 10W-40", "qty": 4, "price": 55000}]';
  }

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
    console.error("Gagal OCR:", error);
    return "[]";
  }
};

// CRM Prediction using Text model
export const predictServiceSchedule = async (vehicleHistory: string): Promise<string> => {
  if (!API_KEY || !ai) {
    return "Berdasarkan riwayat servis, disarankan servis berkala setiap 5000 km atau 6 bulan. Periksa oli mesin, filter, dan sistem rem.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Berdasarkan riwayat servis ini: ${vehicleHistory}. Prediksi kapan servis berikutnya diperlukan dan apa yang perlu diperiksa. Jawab singkat dalam Bahasa Indonesia.`
    });
    return response.text || "Belum ada data cukup.";
  } catch (error) {
    console.error("Gagal prediksi:", error);
    return "Gagal memprediksi jadwal servis.";
  }
};

// Generate personalized WhatsApp reminder message
export const generateMarketingMessage = async (customerName: string, vehicleModel: string, lastServiceDate: string, serviceType: string): Promise<string> => {
  if (!API_KEY || !ai) {
    return `Halo ${customerName}! 👋\n\nWaktunya servis ${serviceType} untuk ${vehicleModel} Anda. Servis terakhir: ${lastServiceDate}.\n\nYuk booking sekarang untuk menjaga performa kendaraan Anda! [LINK BOOKING]\n\nTerima kasih,\nBengkel ABE`;
  }

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
    console.error("Gagal generate message:", error);
    return `Halo ${customerName}, waktunya servis ${serviceType} untuk ${vehicleModel} Anda.`;
  }
}
