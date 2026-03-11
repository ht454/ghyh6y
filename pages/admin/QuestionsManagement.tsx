import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search,
  Filter,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  HelpCircle,
  Image as ImageIcon,
  FileText,
  Mic,
  Upload,
  Play,
  Volume2,
  Music,
  Calendar,
  SplitSquareVertical,
  Camera
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Question, Category } from '../../types/admin';
import { AudioQuestion } from '../../components/AudioQuestion';

export const QuestionsManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);
  const [uploadingAnswerImage, setUploadingAnswerImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    category_id: '',
    question: '',
    answer: '',
    additional_info: '',
    image_url: '',
    image_description: '',
    question_image_url: '',
    answer_image_url: '',
    points: 200,
    difficulty: 'متوسط',
    question_type: 'text',
    options: [],
    is_active: true,
    audio_url: '',
    qr_code_data: '',
    blur_level: 5,
    year_range_enabled: false,
    year_range_value: 1
  });

  useEffect(() => {
    loadQuestions();
    loadCategories();
  }, [currentPage, categoryFilter, difficultyFilter, typeFilter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data, count } = await adminService.getQuestions(
        categoryFilter || undefined,
        currentPage,
        itemsPerPage
      );
      
      let filteredData = data;
      
      if (difficultyFilter) {
        filteredData = filteredData.filter(q => q.difficulty === difficultyFilter);
      }
      
      if (typeFilter) {
        filteredData = filteredData.filter(q => q.question_type === typeFilter);
      }
      
      setQuestions(filteredData);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await adminService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const formattedData = {
        category_id: formData.category_id,
        question: formData.question,
        answer: formData.answer,
        additional_info: formData.additional_info,
        image_url: formData.image_url,
        image_description: formData.image_description,
        question_image_url: formData.question_image_url,
        answer_image_url: formData.answer_image_url,
        points: formData.points,
        difficulty: formData.difficulty,
        question_type: formData.question_type,
        options: formData.question_type === 'multiple_choice' ? formData.options : null,
        is_active: formData.is_active,
        audio_url: formData.audio_url,
        qr_code_data: formData.qr_code_data,
        blur_level: formData.blur_level,
        year_range_enabled: formData.year_range_enabled,
        year_range_value: formData.year_range_value
      };
      
      if (editingQuestion) {
        await adminService.updateQuestion(editingQuestion.id, formattedData);
      } else {
        await adminService.createQuestion(formattedData);
      }
      
      await loadQuestions();
      handleCloseModal();
      
    } catch (error) {
      console.error('Error saving question:', error);
      alert('حدث خطأ في حفظ السؤال');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      category_id: question.category_id,
      question: question.question,
      answer: question.answer,
      additional_info: question.additional_info || '',
      image_url: question.image_url || '',
      image_description: question.image_description || '',
      question_image_url: question.question_image_url || '',
      answer_image_url: question.answer_image_url || '',
      points: question.points,
      difficulty: question.difficulty,
      question_type: question.question_type,
      options: question.options || [],
      is_active: question.is_active,
      audio_url: question.audio_url || '',
      qr_code_data: question.qr_code_data || '',
      blur_level: question.blur_level || 5,
      year_range_enabled: question.year_range_enabled || false,
      year_range_value: question.year_range_value || 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      try {
        await adminService.deleteQuestion(id);
        await loadQuestions();
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  const handleToggleActive = async (question: Question) => {
    try {
      await adminService.updateQuestion(question.id, {
        is_active: !question.is_active
      });
      await loadQuestions();
    } catch (error) {
      console.error('Error toggling question status:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
    setPreviewMode(false);
    setFormData({
      category_id: '',
      question: '',
      answer: '',
      additional_info: '',
      image_url: '',
      image_description: '',
      question_image_url: '',
      answer_image_url: '',
      points: 200,
      difficulty: 'متوسط',
      question_type: 'text',
      options: [],
      is_active: true,
      audio_url: '',
      qr_code_data: '',
      blur_level: 5,
      year_range_enabled: false,
      year_range_value: 1
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await adminService.uploadFile(file, 'image');
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`خطأ في رفع الصورة: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingQuestionImage(true);
      const imageUrl = await adminService.uploadFile(file, 'image');
      setFormData(prev => ({ ...prev, question_image_url: imageUrl }));
    } catch (error: any) {
      console.error('Error uploading question image:', error);
      alert(`خطأ في رفع صورة السؤال: ${error.message}`);
    } finally {
      setUploadingQuestionImage(false);
    }
  };

  const handleAnswerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAnswerImage(true);
      const imageUrl = await adminService.uploadFile(file, 'image');
      setFormData(prev => ({ ...prev, answer_image_url: imageUrl }));
    } catch (error: any) {
      console.error('Error uploading answer image:', error);
      alert(`خطأ في رفع صورة الإجابة: ${error.message}`);
    } finally {
      setUploadingAnswerImage(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAudio(true);
      
      const audio_url = await adminService.uploadFile(file, 'audio');
      setFormData(prev => ({ ...prev, audio_url: audio_url }));
      alert('تم رفع الملف الصوتي بنجاح!');
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      alert(`خطأ في رفع الملف الصوتي: ${error.message}`);
    } finally {
      setUploadingAudio(false);
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'text':
        return <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded-full text-xs">نص</span>;
      case 'image':
        return <span className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs">صورة</span>;
      case 'multiple_choice':
        return <span className="bg-purple-900 text-purple-300 px-2 py-1 rounded-full text-xs">اختيار متعدد</span>;
      case 'blurry_image':
        return <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full text-xs">صورة مشوشة</span>;
      case 'audio':
        return <span className="bg-pink-900 text-pink-300 px-2 py-1 rounded-full text-xs">صوتي</span>;
      case 'acting':
        return <span className="bg-orange-900 text-orange-300 px-2 py-1 rounded-full text-xs">تمثيلي</span>;
      case 'image_answer':
        return <span className="bg-teal-900 text-teal-300 px-2 py-1 rounded-full text-xs">إجابة بالصورة</span>;
      case 'mixed':
        return <span className="bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full text-xs">مختلط</span>;
      default:
        return <span className="bg-gray-900 text-gray-300 px-2 py-1 rounded-full text-xs">{type}</span>;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'متوسط':
        return <span className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs">متوسط</span>;
      case 'صعب':
        return <span className="bg-orange-900 text-orange-300 px-2 py-1 rounded-full text-xs">صعب</span>;
      case 'صعب جداً':
        return <span className="bg-red-900 text-red-300 px-2 py-1 rounded-full text-xs">صعب جداً</span>;
      default:
        return <span className="bg-gray-900 text-gray-300 px-2 py-1 rounded-full text-xs">{difficulty}</span>;
    }
  };

  const getYearRangeBadge = (question: Question) => {
    if (!question.year_range_enabled) return null;
    
    return (
      <span className="bg-amber-900 text-amber-300 px-2 py-1 rounded-full text-xs flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {question.year_range_value === 1 ? '±١ سنة' : `±${question.year_range_value} سنوات`}
      </span>
    );
  };

  const filteredQuestions = questions.filter(question =>
    question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (question.category?.name && question.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full mx-auto">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">إدارة الأسئلة</h1>
          <p className="text-gray-400 text-sm sm:text-base">إدارة بنك الأسئلة وإضافة أسئلة جديدة</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={loadQuestions}
            className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">تحديث</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سؤال جديد</span>
          </button>
        </div>
      </div>

      {}
      <div className="bg-black rounded-xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 border border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="البحث في الأسئلة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
          >
            <option value="">جميع الفئات</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
          >
            <option value="">جميع المستويات</option>
            <option value="متوسط">متوسط</option>
            <option value="صعب">صعب</option>
            <option value="صعب جداً">صعب جداً</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
          >
            <option value="">جميع الأنواع</option>
            <option value="text">نص</option>
            <option value="image">صورة</option>
            <option value="multiple_choice">اختيار متعدد</option>
            <option value="blurry_image">صورة مشوشة</option>
            <option value="audio">صوتي</option>
            <option value="acting">تمثيلي</option>
            <option value="image_answer">إجابة بالصورة</option>
            <option value="mixed">مختلط</option>
          </select>
        </div>
      </div>

      {}
      <div className="bg-black rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">السؤال</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الإجابة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الفئة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">المستوى</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">النوع</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400 hidden md:table-cell">النقاط</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الحالة</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredQuestions.map((question) => (
                <tr key={question.id} className="hover:bg-gray-900">
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="text-xs sm:text-sm text-white max-w-[150px] sm:max-w-[200px] md:max-w-xs truncate">
                      {question.question}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="text-xs sm:text-sm text-gray-400 max-w-[100px] sm:max-w-[150px] md:max-w-xs truncate">
                      {question.answer}
                      {question.answer_image_url && (
                        <span className="mr-1 text-teal-400">[صورة]</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="text-xs sm:text-sm text-gray-400">
                      {question.category?.name || 'غير محدد'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    {getDifficultyBadge(question.difficulty)}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    {getQuestionTypeBadge(question.question_type)}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 hidden md:table-cell">
                    <div className="text-xs sm:text-sm text-gray-400">
                      {question.points}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <button
                      onClick={() => handleToggleActive(question)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-full text-xs font-medium ${
                        question.is_active
                          ? 'bg-green-900 text-green-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {question.is_active ? (
                        <>
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">نشط</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">غير نشط</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEdit(question)}
                        className="text-blue-400 hover:text-blue-300 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        {totalPages > 1 && (
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-400">
              عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, totalCount)} من {totalCount} سؤال
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
              >
                السابق
              </button>
              <span className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <div className="bg-black rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
              </h2>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium ${
                    previewMode
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {previewMode ? 'العودة للتحرير' : 'معاينة'}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {previewMode ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gray-900 rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800">
                  <div className="mb-3 sm:mb-4">
                    <span className="inline-block bg-blue-900 text-blue-300 px-2 py-1 rounded-full text-xs mb-2">
                      {formData.category_id ? categories.find(c => c.id === formData.category_id)?.name : 'غير محدد'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white">{formData.question}</h3>
                  </div>
                  
                  {}
                  {(formData.question_type === 'mixed' || formData.question_type === 'image') && formData.question_image_url && (
                    <div className="mb-3 sm:mb-4">
                      <img 
                        src={formData.question_image_url} 
                        alt="صورة السؤال" 
                        className="w-full max-h-60 sm:max-h-80 object-contain rounded-lg"
                      />
                    </div>
                  )}
                  
                  {}
                  {formData.question_type === 'image' && formData.image_url && !formData.question_image_url && (
                    <div className="mb-3 sm:mb-4">
                      <img 
                        src={formData.image_url} 
                        alt={formData.image_description || 'صورة السؤال'} 
                        className="w-full max-h-60 sm:max-h-80 object-contain rounded-lg"
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">{formData.image_description}</p>
                    </div>
                  )}
                  
                  {formData.question_type === 'blurry_image' && formData.image_url && (
                    <div className="mb-3 sm:mb-4">
                      <div className="relative">
                        <img 
                          src={formData.image_url} 
                          alt={formData.image_description || 'صورة السؤال'} 
                          className="w-full max-h-60 sm:max-h-80 object-contain rounded-lg"
                          style={{ filter: `blur(${formData.blur_level}px)` }}
                        />
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          مستوى التشويش: {formData.blur_level}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">{formData.image_description}</p>
                    </div>
                  )}
                  
                  {formData.question_type === 'audio' && formData.audio_url && (
                    <div className="mb-3 sm:mb-4">
                      <AudioQuestion 
                        audio_url={formData.audio_url}
                        question={formData.question}
                      />
                    </div>
                  )}
                  
                  {formData.question_type === 'multiple_choice' && formData.options && (
                    <div className="mb-3 sm:mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {formData.options.map((option, index) => (
                        <div 
                          key={index}
                          className={`p-2 sm:p-3 rounded-lg border ${
                            option === formData.answer 
                              ? 'bg-green-900/30 border-green-600 text-green-300' 
                              : 'bg-gray-800 border-gray-700 text-gray-300'
                          }`}
                        >
                          {option}
                          {option === formData.answer && (
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-2 text-green-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {}
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      <h4 className="text-base sm:text-lg font-bold text-white">الإجابة الصحيحة</h4>
                    </div>
                    
                    {}
                    {(formData.question_type === 'image_answer' || formData.question_type === 'mixed') && formData.answer_image_url ? (
                      <div className="space-y-2">
                        <p className="text-green-300 text-sm sm:text-base">{formData.answer}</p>
                        {formData.answer_image_url && (
                          <img 
                            src={formData.answer_image_url} 
                            alt="صورة الإجابة" 
                            className="max-h-40 object-contain rounded-lg mt-2"
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-green-300 text-sm sm:text-base">{formData.answer}</p>
                    )}
                  </div>
                  
                  {formData.additional_info && (
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-900/30 rounded-lg border border-blue-900/50">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        <h4 className="text-base sm:text-lg font-bold text-white">معلومات إضافية</h4>
                      </div>
                      <p className="text-blue-300 text-sm sm:text-base">{formData.additional_info}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="bg-gray-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-600 text-sm"
                  >
                    العودة للتحرير
                  </button>
                </div>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      الفئة *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      required
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    >
                      <option value="">اختر الفئة</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      نوع السؤال *
                    </label>
                    <select
                      value={formData.question_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, question_type: e.target.value }))}
                      required
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    >
                      <option value="text">نصي</option>
                      <option value="image">صورة</option>
                      <option value="multiple_choice">اختيار متعدد</option>
                      <option value="blurry_image">صورة مشوشة</option>
                      <option value="audio">صوتي</option>
                      <option value="acting">تمثيلي</option>
                      <option value="image_answer">إجابة بالصورة</option>
                      <option value="mixed">مختلط (نص وصورة)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    نص السؤال *
                  </label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    required
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                  />
                </div>

                {}
                {formData.question_type === 'mixed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      صورة السؤال (للنوع المختلط)
                    </label>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {}
                      <div className="flex items-center gap-3 sm:gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQuestionImageUpload}
                          disabled={uploadingQuestionImage}
                          className="hidden"
                          id="question-image-upload"
                        />
                        <label
                          htmlFor="question-image-upload"
                          className={`bg-gray-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-sm ${
                            uploadingQuestionImage ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploadingQuestionImage ? (
                            <>
                              <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                              جاري الرفع...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                              رفع صورة السؤال
                            </>
                          )}
                        </label>
                        
                        {formData.question_image_url && (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-800">
                            <img 
                              src={formData.question_image_url} 
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      
                      {}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                          أو أدخل رابط صورة السؤال
                        </label>
                        <input
                          type="url"
                          value={formData.question_image_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, question_image_url: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    الإجابة الصحيحة *
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                    required
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                  />
                </div>

                {}
                {(formData.question_type === 'image_answer' || formData.question_type === 'mixed') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      صورة الإجابة
                    </label>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {}
                      <div className="flex items-center gap-3 sm:gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAnswerImageUpload}
                          disabled={uploadingAnswerImage}
                          className="hidden"
                          id="answer-image-upload"
                        />
                        <label
                          htmlFor="answer-image-upload"
                          className={`bg-gray-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-sm ${
                            uploadingAnswerImage ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploadingAnswerImage ? (
                            <>
                              <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                              جاري الرفع...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                              رفع صورة الإجابة
                            </>
                          )}
                        </label>
                        
                        {formData.answer_image_url && (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-800">
                            <img 
                              src={formData.answer_image_url} 
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      
                      {}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                          أو أدخل رابط صورة الإجابة
                        </label>
                        <input
                          type="url"
                          value={formData.answer_image_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, answer_image_url: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {}
                <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    <h3 className="text-base sm:text-lg font-bold text-amber-300">نطاق السنة</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <input
                      type="checkbox"
                      id="year_range_enabled"
                      checked={formData.year_range_enabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, year_range_enabled: e.target.checked }))}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-700 bg-gray-900 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="year_range_enabled" className="text-sm font-medium text-gray-300">
                      تفعيل التحقق من نطاق السنة
                    </label>
                  </div>
                  
                  {formData.year_range_enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                        نطاق السنة المقبول (±) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.year_range_value}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value > 0) {
                            setFormData(prev => ({ ...prev, year_range_value: value }));
                          }
                        }}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white text-sm"
                      />
                      <p className="mt-2 text-xs sm:text-sm text-amber-400/70">
                        سيتم قبول الإجابات ضمن نطاق ±{formData.year_range_value} {formData.year_range_value === 1 ? 'سنة' : 'سنوات'} من الإجابة الصحيحة
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    معلومات إضافية
                  </label>
                  <textarea
                    value={formData.additional_info}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value }))}
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    placeholder="معلومات إضافية عن الإجابة (اختياري)"
                  />
                </div>

                {}
                {formData.question_type === 'audio' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      ملف صوتي للسؤال
                    </label>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {}
                      <div className="flex items-center gap-3 sm:gap-4">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioUpload}
                          disabled={uploadingAudio}
                          className="hidden"
                          id="audio-upload"
                        />
                        <label
                          htmlFor="audio-upload"
                          className={`bg-gray-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-sm ${
                            uploadingAudio ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploadingAudio ? (
                            <>
                              <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                              جاري الرفع...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                              رفع ملف صوتي
                            </>
                          )}
                        </label>
                        
                        {formData.audio_url && (
                          <div className="flex items-center gap-2 bg-gray-800 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                            <span className="text-xs sm:text-sm text-gray-300">تم رفع الملف</span>
                          </div>
                        )}
                      </div>
                      
                      {}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                          أو أدخل رابط الملف الصوتي
                        </label>
                        <input
                          type="url"
                          value={formData.audio_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, audio_url: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                          placeholder="https://example.com/audio.mp3"
                        />
                      </div>
                      
                      {}
                      {formData.audio_url && (
                        <div className="mt-3 sm:mt-4">
                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                            معاينة الملف الصوتي
                          </label>
                          <AudioQuestion 
                            audio_url={formData.audio_url}
                            question={formData.question || 'معاينة السؤال الصوتي'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {}
                {(formData.question_type === 'image' || formData.question_type === 'blurry_image') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      صورة السؤال
                    </label>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {}
                      <div className="flex items-center gap-3 sm:gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className={`bg-gray-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-sm ${
                            uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploadingImage ? (
                            <>
                              <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                              جاري الرفع...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                              رفع صورة
                            </>
                          )}
                        </label>
                        
                        {formData.image_url && (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-800">
                            <img 
                              src={formData.image_url} 
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      
                      {}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                          أو أدخل رابط الصورة
                        </label>
                        <input
                          type="url"
                          value={formData.image_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      
                      {}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                          وصف الصورة
                        </label>
                        <input
                          type="text"
                          value={formData.image_description}
                          onChange={(e) => setFormData(prev => ({ ...prev, image_description: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                          placeholder="وصف الصورة للمساعدة في البحث"
                        />
                      </div>
                      
                      {}
                      {formData.question_type === 'blurry_image' && (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                            مستوى التشويش (1-10)
                          </label>
                          <div className="flex items-center gap-3 sm:gap-4">
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={formData.blur_level}
                              onChange={(e) => setFormData(prev => ({ ...prev, blur_level: parseInt(e.target.value) }))}
                              className="flex-1"
                            />
                            <span className="text-white bg-gray-800 px-2 sm:px-3 py-1 rounded-lg min-w-[30px] sm:min-w-[40px] text-center text-xs sm:text-sm">
                              {formData.blur_level}
                            </span>
                          </div>
                          
                          {formData.image_url && (
                            <div className="mt-3 sm:mt-4">
                              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                                معاينة التشويش
                              </label>
                              <div className="relative">
                                <img 
                                  src={formData.image_url} 
                                  alt={formData.image_description || 'صورة السؤال'} 
                                  className="w-full max-h-40 sm:max-h-60 object-contain rounded-lg"
                                  style={{ filter: `blur(${formData.blur_level}px)` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {}
                {formData.question_type === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      خيارات الإجابة
                    </label>
                    <div className="space-y-2 sm:space-y-3">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="flex items-center gap-2 sm:gap-3">
                          <input
                            type="text"
                            value={formData.options[index] || ''}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[index] = e.target.value;
                              setFormData(prev => ({ ...prev, options: newOptions }));
                            }}
                            className="flex-1 px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                            placeholder={`الخيار ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, answer: formData.options[index] || '' }));
                            }}
                            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm ${
                              formData.answer === formData.options[index]
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {formData.answer === formData.options[index] ? (
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              'تعيين كإجابة'
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      النقاط *
                    </label>
                    <select
                      value={formData.points}
                      onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                      required
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    >
                      <option value={200}>200 (متوسط)</option>
                      <option value={400}>400 (صعب)</option>
                      <option value={600}>600 (صعب جداً)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      مستوى الصعوبة *
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                      required
                      className="w-full px-3 sm:px-4 py-2 border border-gray-700 bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    >
                      <option value="متوسط">متوسط</option>
                      <option value="صعب">صعب</option>
                      <option value="صعب جداً">صعب جداً</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-300">
                      سؤال نشط
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 sm:pt-6 border-t border-gray-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                        {editingQuestion ? 'تحديث' : 'إضافة'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="bg-gray-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-gray-600 text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};