import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, 
  Copy, 
  ExternalLink, 
  X, 
  AlertCircle, 
  Check, 
  Upload, 
  Loader,
  Youtube,
  Download,
  Scissors,
  Music,
  Video,
  Sliders,
  Image as ImageIcon,
  Save,
  Eye,
  EyeOff,
  Search,
  Trash2,
  Link as LinkIcon,
  Plus
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { youtubeService } from '../../services/youtubeService';

export const ToolsPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'image-to-link' | 'youtube-downloader' | 'image-blur'>('image-to-link');
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean[]>([]);
  const [convertedImageUrls, setConvertedImageUrls] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState<boolean[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [downloadFormat, setDownloadFormat] = useState<'mp3' | 'mp4'>('mp3');
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<{title?: string, thumbnail?: string, duration?: string, videoId?: string} | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  const [blurImage, setBlurImage] = useState<File | null>(null);
  const [blurLevel, setBlurLevel] = useState(5);
  const [blurredImageUrl, setBlurredImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [isProcessingBlur, setIsProcessingBlur] = useState(false);
  const blurFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setUploadingImages(prev => [...prev, ...Array(newFiles.length).fill(false)]);
      setCopySuccess(prev => [...prev, ...Array(newFiles.length).fill(false)]);
      setError(null);
    }
  };

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadingImages(prev => prev.filter((_, i) => i !== index));
    setCopySuccess(prev => prev.filter((_, i) => i !== index));
    
    if (convertedImageUrls[index]) {
      setConvertedImageUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleUploadImage = async (index: number) => {
    if (!selectedFiles[index]) {
      setError('الملف غير موجود');
      return;
    }

    const file = selectedFiles[index];
    
    const newUploadingImages = [...uploadingImages];
    newUploadingImages[index] = true;
    setUploadingImages(newUploadingImages);
    
    setError(null);
    
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`حجم الملف ${file.name} كبير جداً. الحد الأقصى هو 5 ميجابايت`);
      }
      
      if (!file.type.startsWith('image/')) {
        throw new Error(`الملف ${file.name} ليس صورة صالحة`);
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/images/${fileName}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`فشل في رفع الصورة ${file.name}: ${uploadError.message}`);
      }
      
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(data.path);
      
      const newConvertedImageUrls = [...convertedImageUrls];
      newConvertedImageUrls[index] = urlData.publicUrl;
      setConvertedImageUrls(newConvertedImageUrls);
      
      setSuccess(`تم رفع الصورة ${file.name} وتحويلها إلى رابط بنجاح!`);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(error.message || 'حدث خطأ في رفع الصورة');
    } finally {
      const newUploadingImages = [...uploadingImages];
      newUploadingImages[index] = false;
      setUploadingImages(newUploadingImages);
    }
  };

  const handleUploadAllImages = async () => {
    if (selectedFiles.length === 0) {
      setError('يرجى اختيار صورة واحدة على الأقل');
      return;
    }

    setError(null);
    
    setUploadingImages(Array(selectedFiles.length).fill(true));
    
    try {
      const newConvertedImageUrls = [...convertedImageUrls];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        if (newConvertedImageUrls[i]) {
          continue;
        }
        
        try {
          if (file.size > 5 * 1024 * 1024) {
            console.warn(`حجم الملف ${file.name} كبير جداً. تخطي...`);
            continue;
          }
          
          if (!file.type.startsWith('image/')) {
            console.warn(`الملف ${file.name} ليس صورة صالحة. تخطي...`);
            continue;
          }
          
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `uploads/images/${fileName}`;
          
          const { data, error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error(`فشل في رفع الصورة ${file.name}:`, uploadError);
            continue;
          }
          
          const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(data.path);
          
          newConvertedImageUrls[i] = urlData.publicUrl;
          
        } catch (fileError) {
          console.error(`خطأ في معالجة الملف ${file.name}:`, fileError);
        }
      }
      
      setConvertedImageUrls(newConvertedImageUrls);
      
      setSuccess(`تم رفع ${newConvertedImageUrls.filter(Boolean).length} صورة بنجاح!`);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error uploading images:', error);
      setError(error.message || 'حدث خطأ في رفع الصور');
    } finally {
      setUploadingImages(Array(selectedFiles.length).fill(false));
    }
  };

  const handleCopyLink = (index: number) => {
    if (convertedImageUrls[index]) {
      navigator.clipboard.writeText(convertedImageUrls[index]);
      
      const newCopySuccess = [...copySuccess];
      newCopySuccess[index] = true;
      setCopySuccess(newCopySuccess);
      
      setTimeout(() => {
        const resetCopySuccess = [...copySuccess];
        resetCopySuccess[index] = false;
        setCopySuccess(resetCopySuccess);
      }, 3000);
    }
  };

  const handleCopyAllLinks = () => {
    const validUrls = convertedImageUrls.filter(Boolean);
    if (validUrls.length > 0) {
      navigator.clipboard.writeText(validUrls.join('\n'));
      
      setSuccess('تم نسخ جميع الروابط!');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value);
    setError(null);
    setVideoInfo(null);
  };

  const handleFetchVideoInfo = async () => {
    if (!youtubeUrl) {
      setError('يرجى إدخال رابط فيديو يوتيوب');
      return;
    }

    setIsProcessingVideo(true);
    setError(null);
    
    try {
      const info = await youtubeService.getVideoInfo(youtubeUrl);
      setVideoInfo(info);
    } catch (error: any) {
      console.error('Error fetching video info:', error);
      setError(error.message || 'حدث خطأ في جلب معلومات الفيديو');
    } finally {
      setIsProcessingVideo(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!youtubeUrl) {
      setError('يرجى إدخال رابط فيديو يوتيوب');
      return;
    }

    if (!videoInfo || !videoInfo.videoId) {
      setError('يرجى جلب معلومات الفيديو أولاً');
      return;
    }

    setIsProcessingVideo(true);
    setError(null);
    setDownloadProgress(0);
    
    try {
      const downloadOptions = {
        youtubeUrl,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        format: downloadFormat
      };
      
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      
      const result = await youtubeService.downloadVideo(downloadOptions);
      
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      
      const blob = await youtubeService.simulateDownload(videoInfo.videoId, downloadFormat);
      
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `youtube-${videoInfo.videoId}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      
     
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      setSuccess(`تم تحميل ${downloadFormat === 'mp3' ? 'الصوت' : 'الفيديو'} بنجاح!`);
      
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error downloading video:', error);
      setError(error.message || 'حدث خطأ في تحميل الفيديو');
    } finally {
      setIsProcessingVideo(false);
    }
  };

 
  const handleBlurImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBlurImage(file);
      setError(null);
      
      
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
      }
      if (blurredImageUrl && blurredImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blurredImageUrl);
      }
      
      
      const objectUrl = URL.createObjectURL(file);
      setOriginalImageUrl(objectUrl);
      setBlurredImageUrl(null);
    }
  };

  const handleOpenBlurFileDialog = () => {
    if (blurFileInputRef.current) {
      blurFileInputRef.current.click();
    }
  };

  const handleProcessBlur = async () => {
    if (!blurImage || !originalImageUrl) {
      setError('يرجى اختيار صورة أولاً');
      return;
    }

    setIsProcessingBlur(true);
    setError(null);
    
    try {
      
      if (blurredImageUrl && blurredImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blurredImageUrl);
      }
      
      
      const img = new Image();
      
      img.onload = () => {
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('فشل في إنشاء سياق الرسم');
        }
        
        
        ctx.drawImage(img, 0, 0);
        
        
        ctx.filter = `blur(${blurLevel}px)`;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0);
        
       
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('فشل في تحويل الصورة');
            return;
          }
          
          
          const url = URL.createObjectURL(blob);
          setBlurredImageUrl(url);
          setIsProcessingBlur(false);
          
          setSuccess('تم معالجة الصورة بنجاح!');
          
          
          setTimeout(() => {
            setSuccess(null);
          }, 3000);
        }, 'image/jpeg', 0.95);
        
        
        canvasRef.current = canvas;
      };
      
      img.onerror = () => {
        throw new Error('فشل في تحميل الصورة');
      };
      
      
      img.src = originalImageUrl;
      imgRef.current = img;
      
    } catch (error: any) {
      console.error('Error processing blur:', error);
      setError(error.message || 'حدث خطأ في معالجة الصورة');
      setIsProcessingBlur(false);
    }
  };

  const handleDownloadBlurredImage = () => {
    if (!blurredImageUrl) {
      setError('يرجى معالجة الصورة أولاً');
      return;
    }
    
    try {
      
      const tempCanvas = document.createElement('canvas');
      const tempImg = new Image();
      
      tempImg.onload = function() {
        tempCanvas.width = tempImg.width;
        tempCanvas.height = tempImg.height;
        
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          throw new Error('فشل في إنشاء سياق الرسم');
          return;
        }
        
        
        ctx.drawImage(tempImg, 0, 0);
        
        
        tempCanvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('فشل في تحويل الصورة');
            return;
          }
          
          
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.download = `blurred-${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          
          
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);
        }, 'image/jpeg', 0.95);
      };
      
      tempImg.onerror = function() {
        throw new Error('فشل في تحميل الصورة المشوشة');
      };
      
      tempImg.src = blurredImageUrl;
      
    } catch (error: any) {
      console.error('Error downloading blurred image:', error);
      setError(error.message || 'حدث خطأ في تحميل الصورة المشوشة');
    }
  };

  useEffect(() => {
    return () => {
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
      }
      if (blurredImageUrl && blurredImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blurredImageUrl);
      }
      if (imgRef.current) {
        imgRef.current = null;
      }
    };
  }, []);

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full mx-auto">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">الأدوات المساعدة</h1>
          <p className="text-gray-400 text-sm sm:text-base">مجموعة من الأدوات المساعدة لتسهيل العمل</p>
        </div>
      </div>

      {}
      <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 border border-gray-800">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTool('image-to-link')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              activeTool === 'image-to-link' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <FileUp className="w-4 h-4" />
            تحويل صورة إلى رابط
          </button>
          
          <button
            onClick={() => setActiveTool('youtube-downloader')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              activeTool === 'youtube-downloader' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Youtube className="w-4 h-4" />
            تحميل فيديو يوتيوب
          </button>
          
          <button
            onClick={() => setActiveTool('image-blur')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              activeTool === 'image-blur' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            تشويش الصور
          </button>
        </div>
      </div>

      {}
      <div className="bg-black rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="p-4 sm:p-6">
          {}
          {error && (
            <div className="bg-red-900 border border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-red-300">
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {}
          {success && (
            <div className="bg-green-900 border border-green-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-3">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-green-300">
                <p className="font-medium">{success}</p>
              </div>
            </div>
          )}

          {}
          {activeTool === 'image-to-link' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-purple-400" />
                  تحويل صور إلى روابط
                </h2>
                
                <p className="text-gray-400 mb-6">
                  قم برفع صور متعددة للحصول على روابط مباشرة يمكنك استخدامها في أي مكان
                </p>
                
                {}
                <div className="mb-6">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                    multiple
                  />
                  
                  <div 
                    className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/50 cursor-pointer hover:bg-gray-900 transition-colors" 
                    onClick={handleOpenFileDialog}
                  >
                    {selectedFiles.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2 text-green-400">
                          <Check className="w-5 h-5" />
                          <span>تم اختيار {selectedFiles.length} {selectedFiles.length === 1 ? 'ملف' : 'ملفات'}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {selectedFiles.length <= 3 
                            ? selectedFiles.map(file => file.name).join(', ')
                            : `${selectedFiles.length} ملفات جاهزة للرفع`}
                        </div>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-12 h-12 text-gray-500" />
                        <div className="text-gray-400 text-center">
                          <p className="font-medium">اسحب وأفلت الصور هنا</p>
                          <p className="text-sm text-gray-500 mt-1">أو انقر لاختيار ملفات متعددة</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <p className="mt-2 text-xs text-gray-500">
                    الحد الأقصى لحجم الملف: 5 ميجابايت. الصيغ المدعومة: JPG, PNG, GIF, WEBP
                  </p>
                </div>

                {}
                {selectedFiles.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-white font-bold">الملفات المختارة</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUploadAllImages}
                          disabled={uploadingImages.some(status => status) || selectedFiles.length === 0}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Upload className="w-3 h-3" />
                          رفع الكل
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFiles([]);
                            setUploadingImages([]);
                            setCopySuccess([]);
                            setConvertedImageUrls([]);
                          }}
                          className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 flex items-center gap-1 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          حذف الكل
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {selectedFiles.map((file, index) => (
                        <div 
                          key={`${file.name}-${index}`} 
                          className="flex items-center justify-between bg-gray-800 p-2 rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white truncate">{file.name}</div>
                              <div className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {convertedImageUrls[index] ? (
                              <>
                                <button
                                  onClick={() => handleCopyLink(index)}
                                  className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors"
                                  title="نسخ الرابط"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <a
                                  href={convertedImageUrls[index]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-gray-700 text-white p-1.5 rounded hover:bg-gray-600 transition-colors"
                                  title="فتح في نافذة جديدة"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                {copySuccess[index] && (
                                  <span className="text-xs text-green-400">تم النسخ!</span>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={() => handleUploadImage(index)}
                                disabled={uploadingImages[index]}
                                className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {uploadingImages[index] ? (
                                  <>
                                    <Loader className="w-3 h-3 animate-spin" />
                                    جاري...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3 h-3" />
                                    رفع
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveFile(index)}
                              className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700 transition-colors"
                              title="حذف"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {}
                {convertedImageUrls.filter(Boolean).length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-bold">الروابط المحولة</h3>
                      <button
                        onClick={handleCopyAllLinks}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 text-xs"
                      >
                        <Copy className="w-3 h-3" />
                        نسخ جميع الروابط
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {convertedImageUrls.map((url, index) => {
                        if (!url) return null;
                        return (
                          <div 
                            key={`url-${index}`} 
                            className="flex items-center justify-between bg-gray-800 p-2 rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-gray-700 rounded overflow-hidden">
                                <img 
                                  src={url} 
                                  alt="Thumbnail" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/40';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400 truncate">{url}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyLink(index)}
                                className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors"
                                title="نسخ الرابط"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gray-700 text-white p-1.5 rounded hover:bg-gray-600 transition-colors"
                                title="فتح في نافذة جديدة"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              {copySuccess[index] && (
                                <span className="text-xs text-green-400">تم النسخ!</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleOpenFileDialog}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة المزيد من الصور
                  </button>
                </div>

                {}
                <div className="mt-6 bg-blue-900/30 border border-blue-800/50 rounded-lg p-3">
                  <p className="text-blue-300 text-sm">
                    <span className="font-bold">نصيحة:</span> يمكنك رفع عدة صور دفعة واحدة ثم نسخ جميع الروابط بنقرة واحدة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {}
          {activeTool === 'youtube-downloader' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-400" />
                  تحميل فيديو يوتيوب
                </h2>
                
                <p className="text-gray-400 mb-6">
                  قم بإدخال رابط فيديو يوتيوب واختر المقطع الذي تريد تحميله بصيغة MP3 أو MP4
                </p>
                
                {}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    رابط فيديو يوتيوب
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={handleYoutubeUrlChange}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                    <button
                      onClick={handleFetchVideoInfo}
                      disabled={!youtubeUrl || isProcessingVideo}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isProcessingVideo && !videoInfo ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      جلب المعلومات
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    أدخل رابط فيديو يوتيوب صالح للحصول على معلومات الفيديو
                  </p>
                </div>

                {}
                {videoInfo && (
                  <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-40 h-24 bg-gray-900 rounded overflow-hidden">
                        <img 
                          src={videoInfo.thumbnail} 
                          alt="Video Thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-2">{videoInfo.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Video className="w-4 h-4" />
                            <span>{videoInfo.duration}</span>
                          </div>
                          {videoInfo.videoId && (
                            <div className="flex items-center gap-1">
                              <Youtube className="w-4 h-4" />
                              <span className="font-mono text-xs">{videoInfo.videoId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {}
                {videoInfo && (
                  <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        وقت البداية (اختياري)
                      </label>
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        placeholder="00:00"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        بتنسيق MM:SS أو HH:MM:SS
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        وقت النهاية (اختياري)
                      </label>
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        placeholder="00:00"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        بتنسيق MM:SS أو HH:MM:SS
                      </p>
                    </div>
                  </div>
                )}

                {}
                {videoInfo && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      صيغة التحميل
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setDownloadFormat('mp3')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${
                          downloadFormat === 'mp3' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <Music className="w-5 h-5" />
                        <span>MP3 (صوت فقط)</span>
                      </button>
                      <button
                        onClick={() => setDownloadFormat('mp4')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${
                          downloadFormat === 'mp4' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <Video className="w-5 h-5" />
                        <span>MP4 (فيديو)</span>
                      </button>
                    </div>
                  </div>
                )}

                {}
                {isProcessingVideo && downloadProgress > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>جاري التحميل...</span>
                      <span>{Math.round(downloadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-red-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {}
                {videoInfo && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleDownloadVideo}
                      disabled={isProcessingVideo}
                      className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessingVideo ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          تحميل {downloadFormat === 'mp3' ? 'الصوت' : 'الفيديو'}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {}
                <div className="mt-6 bg-yellow-900/30 border border-yellow-800/50 rounded-lg p-3">
                  <p className="text-yellow-300 text-sm">
                    <span className="font-bold">ملاحظة:</span> يرجى مراعاة حقوق الملكية الفكرية عند استخدام المحتوى. هذه الأداة مخصصة للاستخدام الشخصي فقط.
                  </p>
                </div>
              </div>
            </div>
          )}

          {}
          {activeTool === 'image-blur' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  تشويش الصور
                </h2>
                
                <p className="text-gray-400 mb-6">
                  قم برفع صورة وضبط مستوى التشويش ثم تحميل الصورة المشوشة
                </p>
                
                {}
                <div className="mb-6">
                  <input
                    type="file"
                    ref={blurFileInputRef}
                    onChange={handleBlurImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <div 
                    className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/50 cursor-pointer hover:bg-gray-900 transition-colors" 
                    onClick={handleOpenBlurFileDialog}
                  >
                    {blurImage ? (
                      <>
                        <div className="flex items-center gap-2 text-green-400">
                          <Check className="w-5 h-5" />
                          <span>تم اختيار الصورة</span>
                        </div>
                        <div className="text-sm text-gray-400">{blurImage.name} ({(blurImage.size / 1024).toFixed(1)} KB)</div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-gray-500" />
                        <div className="text-gray-400 text-center">
                          <p className="font-medium">اسحب وأفلت الصورة هنا</p>
                          <p className="text-sm text-gray-500 mt-1">أو انقر لاختيار ملف</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {}
                {originalImageUrl && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      مستوى التشويش: {blurLevel}
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400">1</span>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={blurLevel}
                        onChange={(e) => setBlurLevel(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-gray-400">20</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>تشويش خفيف</span>
                      <span>تشويش قوي</span>
                    </div>
                  </div>
                )}

                {}
                {originalImageUrl && (
                  <div className="flex justify-center mb-6">
                    <button
                      onClick={handleProcessBlur}
                      disabled={isProcessingBlur}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessingBlur ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          جاري المعالجة...
                        </>
                      ) : (
                        <>
                          <Sliders className="w-5 h-5" />
                          معالجة الصورة
                        </>
                      )}
                    </button>
                  </div>
                )}

                {}
                {(originalImageUrl || blurredImageUrl) && (
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {originalImageUrl && (
                        <div>
                          <div className="text-center mb-2 text-sm font-medium text-gray-300">الصورة الأصلية</div>
                          <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800 h-64">
                            <img 
                              src={originalImageUrl} 
                              alt="Original"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                      
                      {blurredImageUrl && (
                        <div>
                          <div className="text-center mb-2 text-sm font-medium text-gray-300">الصورة المشوشة</div>
                          <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800 h-64">
                            <img 
                              src={blurredImageUrl} 
                              alt="Blurred"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {}
                {blurredImageUrl && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleDownloadBlurredImage}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      تحميل الصورة المشوشة
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};