const postViewContainer = document.getElementById('post-view-container');
const commentsStream = document.getElementById('comments-stream');
const addCommentForm = document.getElementById('add-comment-form');
const commentTextInput = document.getElementById('comment-text-input');
const submitCommentBtn = document.getElementById('submit-comment-btn');

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

async function loadPostDetails() {
  if (!postId) {
    postViewContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: var(--danger);">No post ID provided.</p>
        <a href="index.html" class="btn" style="margin-top: 1rem;">Back to Feed</a>
      </div>
    `;
    return;
  }

  try {
    const res = await api.get(`/posts/${postId}`);
    const post = res.data;

    renderPostCard(post);
    renderComments(post.comments || []);
  } catch (err) {
    postViewContainer.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 2rem;">Failed to load post: ${err.message}</p>`;
    commentsStream.innerHTML = '';
  }
}

function renderPostCard(post) {
  const currentUser = auth.getUser();
  const isOwner = currentUser && currentUser.id === post.author.id;
  const timeFormatted = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  postViewContainer.innerHTML = `
    <article class="post-card" id="post-${post.id}">
      <div class="post-header">
        <img src="${post.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}" class="avatar-img" alt="${post.author.name}">
        <div>
          <a href="profile.html?username=${post.author.username}" class="post-author-name">${escapeHTML(post.author.name)}</a>
          <div class="post-author-username">@${post.author.username}</div>
        </div>
        <span class="post-time">${timeFormatted}</span>
      </div>

      <div class="post-content" style="font-size: 1.1rem; line-height: 1.6;">${escapeHTML(post.content)}</div>

      ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image-attachment" alt="Post attachment">` : ''}

      <div class="post-actions">
        <button class="action-btn ${post.isLikedByMe ? 'liked' : ''}" onclick="handleLike('${post.id}')" id="like-btn-${post.id}">
          <span>${post.isLikedByMe ? '❤️' : '🤍'}</span>
          <span id="like-count-${post.id}">${post.likesCount}</span>
        </button>

        <span class="action-btn" style="cursor: default;">
          <span>💬</span>
          <span id="comment-count-header">${post.commentsCount} comments</span>
        </span>

        ${isOwner ? `<button class="delete-btn" onclick="handleDeletePost('${post.id}')">Delete</button>` : ''}
      </div>
    </article>
  `;
}

function renderComments(comments) {
  if (!comments || comments.length === 0) {
    commentsStream.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1.5rem;">No comments yet. Be the first to share your thoughts!</p>';
    return;
  }

  const currentUser = auth.getUser();

  commentsStream.innerHTML = comments.map((c) => {
    const isOwner = currentUser && currentUser.id === c.author.id;
    const timeFormatted = new Date(c.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <div class="comment-card" id="comment-${c.id}">
        <img src="${c.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}" class="comment-avatar" alt="${c.author.name}">
        <div class="comment-body">
          <div>
            <a href="profile.html?username=${c.author.username}" class="comment-author-name">${escapeHTML(c.author.name)}</a>
            <span style="font-size: 0.8rem; color: var(--text-muted);">@${c.author.username}</span>
            <span class="comment-time">${timeFormatted}</span>
          </div>
          <p class="comment-text">${escapeHTML(c.content)}</p>
        </div>
        ${isOwner ? `<button onclick="handleDeleteComment('${c.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 0.8rem; align-self: flex-start;">✕</button>` : ''}
      </div>
    `;
  }).join('');
}

async function handleLike(pId) {
  if (!auth.isAuthenticated()) {
    alert('Please log in to like posts.');
    window.location.href = 'login.html';
    return;
  }

  const btn = document.getElementById(`like-btn-${pId}`);
  const countSpan = document.getElementById(`like-count-${pId}`);

  try {
    const res = await api.post(`/posts/${pId}/like`);
    const { isLiked, likesCount } = res.data;

    btn.classList.toggle('liked', isLiked);
    btn.querySelector('span').textContent = isLiked ? '❤️' : '🤍';
    countSpan.textContent = likesCount;
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeletePost(pId) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  try {
    await api.delete(`/posts/${pId}`);
    window.location.href = 'index.html';
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteComment(commentId) {
  if (!confirm('Delete this comment?')) return;

  try {
    await api.delete(`/comments/${commentId}`);
    const row = document.getElementById(`comment-${commentId}`);
    if (row) row.remove();
  } catch (err) {
    alert(err.message);
  }
}

// Add comment form listener
if (addCommentForm) {
  addCommentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!auth.isAuthenticated()) {
      alert('Please log in to leave a comment.');
      window.location.href = 'login.html';
      return;
    }

    const content = commentTextInput.value.trim();
    if (!content) return;

    try {
      submitCommentBtn.disabled = true;
      submitCommentBtn.textContent = 'Posting...';

      await api.post(`/posts/${postId}/comments`, { content });

      commentTextInput.value = '';
      submitCommentBtn.disabled = false;
      submitCommentBtn.textContent = 'Reply';

      loadPostDetails();
    } catch (err) {
      alert(`Failed to add comment: ${err.message}`);
      submitCommentBtn.disabled = false;
      submitCommentBtn.textContent = 'Reply';
    }
  });
}

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

document.addEventListener('DOMContentLoaded', loadPostDetails);
