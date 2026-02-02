import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { postsAPI, getUser, uploadImage } from '../services/api';

export const AdminPostEditorPage = ({ user }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!postId;

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    is_premium: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const quillRef = useRef(null);

  // Image upload handler
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      try {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        // Show loading indicator
        const range = quill.getSelection(true);
        quill.insertText(range.index, 'Uploading image...', 'user');
        quill.setSelection(range.index + 19);

        // Upload image
        const imageUrl = await uploadImage(file);

        // Remove loading text and insert image
        quill.deleteText(range.index, 19);
        quill.insertEmbed(range.index, 'image', imageUrl);
        quill.setSelection(range.index + 1);
      } catch (error) {
        alert('Failed to upload image: ' + error.message);
        console.error('Image upload error:', error);
      }
    };
  }, []);

  // Quill editor modules configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['blockquote'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    },
  }), [handleImageUpload]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote',
    'link',
    'image'
  ];

  useEffect(() => {
    // Check if user is logged in and is admin
    const currentUser = user || getUser();
    if (!currentUser || !currentUser.is_admin) {
      navigate('/subscribe?mode=login', { replace: true });
      return;
    }

    // If editing, load the post data
    if (isEditMode) {
      const fetchPost = async () => {
        setLoading(true);
        try {
          const post = await postsAPI.getOne(postId);
          setFormData({
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            is_premium: post.is_premium
          });
        } catch (err) {
          console.error('Error fetching post:', err);
          navigate('/admin/dashboard');
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [postId, isEditMode, navigate, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleContentChange = (value) => {
    setFormData(prev => ({ ...prev, content: value }));
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required';
    }
    // Strip HTML tags to check if content is empty
    const strippedContent = formData.content.replace(/<[^>]*>/g, '').trim();
    if (!strippedContent) {
      newErrors.content = 'Content is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode) {
        await postsAPI.update(postId, formData);
      } else {
        await postsAPI.create(formData);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      alert('Failed to save post: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white relative">
        <div 
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}
        />
        <div className="relative z-10">
          <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16">
            <div className="font-sans text-lg text-warm-black/70">Loading post...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white relative" data-testid="admin-post-editor">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16">
          <Link to="/" className="flex justify-center mb-8">
            <img 
              src="/Logo.png" 
              alt="Faith by Experiments" 
              className="h-20 md:h-28 lg:h-36"
            />
          </Link>

          <div className="max-w-2xl mx-auto space-y-12 md:space-y-16">
            <div className="space-y-6">
              <Link 
                to="/admin/dashboard" 
                className="inline-flex items-center gap-2 text-warm-black/60 hover:text-warm-black font-sans text-sm md:text-base transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </Link>
              <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight">
                {isEditMode ? 'Edit Post' : 'Create New Post'}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8" data-testid="post-editor-form">
              <div className="space-y-2">
                <label htmlFor="title" className="block font-sans font-medium text-base text-warm-black">Post Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted ${
                    errors.title ? 'border-red-300' : 'border-black/20'
                  }`}
                  placeholder="Enter post title"
                  data-testid="post-title-input"
                />
                {errors.title && (
                  <span className="block font-sans text-sm text-red-600 mt-1">{errors.title}</span>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="excerpt" className="block font-sans font-medium text-base text-warm-black">Excerpt / Short Description *</label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-4 py-3 border rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted resize-y ${
                    errors.excerpt ? 'border-red-300' : 'border-black/20'
                  }`}
                  placeholder="Brief description that appears in listings"
                  data-testid="post-excerpt-input"
                />
                {errors.excerpt && (
                  <span className="block font-sans text-sm text-red-600 mt-1">{errors.excerpt}</span>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="content" className="block font-sans font-medium text-base text-warm-black">Full Content *</label>
                <div className={errors.content ? 'border-2 border-red-300 rounded' : ''}>
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={formData.content}
                    onChange={handleContentChange}
                    modules={modules}
                    formats={formats}
                    placeholder="Write your full post content here..."
                    data-testid="post-content-editor"
                    className="bg-white"
                  />
                </div>
                {errors.content && (
                  <span className="block font-sans text-sm text-red-600 mt-1">{errors.content}</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_premium"
                    checked={formData.is_premium}
                    onChange={handleChange}
                    className="w-5 h-5 text-accent-muted border-black/20 rounded focus:ring-accent-muted focus:ring-2"
                    data-testid="post-premium-checkbox"
                  />
                  <span className="font-sans text-base text-warm-black">Premium Content (requires subscription)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-black/10">
                <Link 
                  to="/admin/dashboard" 
                  className="font-sans font-medium text-base text-warm-black/70 hover:text-warm-black transition-colors"
                >
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  className="inline-flex items-center justify-center gap-2 bg-accent-muted hover:bg-accent-muted/90 text-white font-sans font-semibold text-base md:text-lg px-6 py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                  data-testid="post-submit-btn"
                >
                  <Save size={20} />
                  <span>{submitting ? 'Saving...' : (isEditMode ? 'Update Post' : 'Publish Post')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
