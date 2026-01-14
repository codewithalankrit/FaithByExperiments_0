import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { postsAPI, getUser, uploadImage } from '../services/api';
import '../styles/AdminPages.css';

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
      navigate('/admin/login');
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
      <div className="admin-editor-page">
        <header className="admin-header">
          <div className="admin-header-content">
            <Link to="/" className="admin-logo">
              <img 
                src="https://customer-assets.emergentagent.com/job_34e2cbef-ee34-45ac-8348-79293beec714/artifacts/j8mvu38p_Production-edited-Logo-Photoroom.png" 
                alt="Faith by Experiments" 
                className="admin-header-logo"
              />
            </Link>
          </div>
        </header>
        <div className="admin-editor-container">
          <div className="loading-state">Loading post...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-editor-page" data-testid="admin-post-editor">
      <header className="admin-header">
        <div className="admin-header-content">
          <Link to="/" className="admin-logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_34e2cbef-ee34-45ac-8348-79293beec714/artifacts/j8mvu38p_Production-edited-Logo-Photoroom.png" 
              alt="Faith by Experiments" 
              className="admin-header-logo"
            />
          </Link>
        </div>
      </header>

      <div className="admin-editor-container">
        <div className="admin-editor-header">
          <Link to="/admin/dashboard" className="admin-back-button">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="admin-editor-title">
            {isEditMode ? 'Edit Post' : 'Create New Post'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="admin-editor-form" data-testid="post-editor-form">
          <div className="admin-form-group">
            <label htmlFor="title">Post Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`admin-form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter post title"
              data-testid="post-title-input"
            />
            {errors.title && <span className="admin-error-text">{errors.title}</span>}
          </div>

          <div className="admin-form-group">
            <label htmlFor="excerpt">Excerpt / Short Description *</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows="3"
              className={`admin-form-textarea ${errors.excerpt ? 'error' : ''}`}
              placeholder="Brief description that appears in listings"
              data-testid="post-excerpt-input"
            />
            {errors.excerpt && <span className="admin-error-text">{errors.excerpt}</span>}
          </div>

          <div className="admin-form-group">
            <label htmlFor="content">Full Content *</label>
            <div className={`quill-wrapper ${errors.content ? 'error' : ''}`}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                modules={modules}
                formats={formats}
                placeholder="Write your full post content here..."
                data-testid="post-content-editor"
              />
            </div>
            {errors.content && <span className="admin-error-text">{errors.content}</span>}
          </div>

          <div className="admin-form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_premium"
                checked={formData.is_premium}
                onChange={handleChange}
                data-testid="post-premium-checkbox"
              />
              <span>Premium Content (requires subscription)</span>
            </label>
          </div>

          <div className="admin-editor-actions">
            <Link to="/admin/dashboard" className="admin-cancel-button">
              Cancel
            </Link>
            <button 
              type="submit" 
              className="admin-save-button"
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
  );
};
