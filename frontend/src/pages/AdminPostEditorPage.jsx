import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import '../styles/quillEditor.css';
import {
  buildQuillModules,
  ensureGoogleFontsLoaded,
  generateExcerpt,
  getInitialEditorContent,
  QUILL_FORMATS,
} from '../utils/quillConfig';
import { setupQuillToolbar } from '../utils/quillToolbar';
import { postsAPI, getUser, uploadImage } from '../services/api';

export const AdminPostEditorPage = ({ user }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!postId;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_premium: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const quillRef = useRef(null);
  const titleQuillRef = useRef(null);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      try {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        const range = quill.getSelection(true);
        quill.insertText(range.index, 'Uploading image...', 'user');
        quill.setSelection(range.index + 19);

        const imageUrl = await uploadImage(file);

        quill.deleteText(range.index, 19);
        quill.insertEmbed(range.index, 'image', imageUrl);
        quill.setSelection(range.index + 1);
      } catch (error) {
        alert(`Failed to upload image: ${error.message}`);
        console.error('Image upload error:', error);
      }
    };
  }, []);

  const modules = useMemo(
    () => buildQuillModules(handleImageUpload),
    [handleImageUpload]
  );

  const titleModules = useMemo(
    () => buildQuillModules(null),
    []
  );

  useEffect(() => {
    ensureGoogleFontsLoaded();
  }, []);

  useEffect(() => {
    if (loading) return undefined;

    const timer = window.setTimeout(() => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;
      setupQuillToolbar(quill);

      const titleQuill = titleQuillRef.current?.getEditor();
      if (titleQuill) {
        setupQuillToolbar(titleQuill);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loading, isEditMode]);

  useEffect(() => {
    const currentUser = user || getUser();
    if (!currentUser || !currentUser.is_admin) {
      navigate('/subscribe?mode=login', { replace: true });
      return;
    }

    if (isEditMode) {
      const fetchPost = async () => {
        setLoading(true);
        try {
          const post = await postsAPI.getOne(postId);
          setFormData({
            title: post.title,
            content: getInitialEditorContent(post.excerpt, post.content),
            is_premium: post.is_premium,
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleTitleChange = (value) => {
    setFormData((prev) => ({ ...prev, title: value }));
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: '' }));
    }
  };

  const handleContentChange = (value) => {
    setFormData((prev) => ({ ...prev, content: value }));
    if (errors.content) {
      setErrors((prev) => ({ ...prev, content: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const strippedTitle = formData.title.replace(/<[^>]*>/g, '').trim();
    if (!strippedTitle) {
      newErrors.title = 'Title is required';
    }
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

    const payload = {
      title: formData.title.replace(/<[^>]*>/g, '').trim(),
      content: formData.content,
      excerpt: generateExcerpt(formData.content),
      is_premium: formData.is_premium,
    };

    try {
      if (isEditMode) {
        await postsAPI.update(postId, payload);
      } else {
        await postsAPI.create(payload);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      alert(`Failed to save post: ${err.message}`);
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
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
            backgroundSize: '20px 20px',
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
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px',
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
                <label
                  htmlFor="title"
                  className="block font-sans font-medium text-base text-warm-black"
                >
                  Post Title *
                </label>
                <p className="font-sans text-sm text-warm-black/60">
                  Format your title — change font, size, colors, and more.
                </p>
                <div
                  className={`post-title-editor bg-white rounded ${
                    errors.title ? 'border-2 border-red-300' : ''
                  }`}
                >
                  <ReactQuill
                    ref={titleQuillRef}
                    theme="snow"
                    value={formData.title}
                    onChange={handleTitleChange}
                    modules={titleModules}
                    formats={QUILL_FORMATS}
                    placeholder="Enter post title..."
                    data-testid="post-title-editor"
                  />
                </div>
                {errors.title && (
                  <span className="block font-sans text-sm text-red-600 mt-1">{errors.title}</span>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="content"
                  className="block font-sans font-medium text-base text-warm-black"
                >
                  Content *
                </label>
                <p className="font-sans text-sm text-warm-black/60">
                  Write and format your post — change font, size, colors, add images, and more.
                </p>
                <div
                  className={`post-content-editor bg-white rounded ${
                    errors.content ? 'border-2 border-red-300' : ''
                  }`}
                >
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={formData.content}
                    onChange={handleContentChange}
                    modules={modules}
                    formats={QUILL_FORMATS}
                    placeholder="Start writing your post..."
                    data-testid="post-content-editor"
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
                  <span className="font-sans text-base text-warm-black">
                    Premium Content (requires subscription)
                  </span>
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
                  <span>
                    {submitting ? 'Saving...' : isEditMode ? 'Update Post' : 'Publish Post'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
