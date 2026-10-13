let currentFeedMode = 'explore'; // 'explore' or 'following'

const postsStream = document.getElementById('posts-stream');
const createPostWrapper = document.getElementById('create-post-wrapper');
const createPostForm = document.getElementById('create-post-form');
const postContentInput = document.getElementById('post-content-input');
const postImageInput = document.getElementById('post-image-input');
const publishBtn = document.getElementById('publish-btn');

function checkAuthUI() {
  if (!auth.isAuthenticated()) {
    createPostWrapper.innerHTML = `
      <div style="text-align: center; padding: 1rem;">
        <p style="color: var(--text-muted); margin-bottom: 0.75rem;">Log in to create posts and like or comment on others.</p>
        <a href="login.html" class="btn" style="padding: 0.4rem 1.2rem;">Log In / Register</a>
      </div>
    `;
  }
}

function switchFeedTab(mode) {
  if (mode === 'following' && !auth.isAuthenticated()) {
    alert('Please log in to view your personalized Following feed.');
    window.location.href = 'login.html';
    return;
  }

  currentFeedMode = mode;
  document.getElementById('tab-explore').classList.toggle('active', mode === 'explore');
  document.getElementById('tab-following').classList.toggle('active', mode === 'following');
  loadFeed();
}

async function loadFeed() {
  postsStream.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading posts...</p>';

  try {
    const endpoint = currentFeedMode === 'following' ? '/posts/feed' : '/posts';
    const response = await api.get(endpoint);
    const posts = response.data;

    renderPosts(posts);
  } catch (error) {
    postsStream.innerHTML = `<p style="text-align: center; color: var(--danger); padding: 2rem;">Failed to load feed: ${error.message}</p>`;
  }
}

function renderPosts(posts) {
  if (!posts || posts.length === 0) {
    const msg = currentFeedMode === 'following'
      ? "You aren't following anyone yet or your following hasn't posted! Switch to Explore Global to find users to follow."
      : "No posts yet. Be the first to share something!";

    postsStream.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 3rem;">${msg}</p>`;
    return;
  }

  const currentUser = auth.getUser();

  postsStream.innerHTML = posts.map((post) => {
    const isOwner = currentUser && currentUser.id === post.author.id;
    const timeFormatted = new Date(post.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <article class="post-card" id="post-${post.id}">
        <div class="post-header">
          <img src="${post.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}" class="avatar-img" alt="${post.author.name}">
          <div>
            <a href="profile.html?username=${post.author.username}" class="post-author-name">${post.author.name}</a>
            <div class="post-author-username">@${post.author.username}</div>
          </div>
          <span class="post-time">${timeFormatted}</span>
        </div>

        <div class="post-content">${escapeHTML(post.content)}</div>

        ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image-attachment" alt="Post image">` : ''}

        <div class="post-actions">
          <button class="action-btn ${post.isLikedByMe ? 'liked' : ''}" onclick="handleLike('${post.id}')" id="like-btn-${post.id}">
            <span>${post.isLikedByMe ? '❤️' : '🤍'}</span>
            <span id="like-count-${post.id}">${post.likesCount}</span>
          </button>

          <a href="post.html?id=${post.id}" class="action-btn" style="text-decoration: none;">
            <span>💬</span>
            <span>${post.commentsCount} comments</span>
          </a>

          ${isOwner ? `<button class="delete-btn" onclick="handleDeletePost('${post.id}')">Delete</button>` : ''}
        </div>
      </article>
    `;
  }).join('');
}

async function handleLike(postId) {
  if (!auth.isAuthenticated()) {
    alert('Please log in to like posts.');
    window.location.href = 'login.html';
    return;
  }

  const btn = document.getElementById(`like-btn-${postId}`);
  const countSpan = document.getElementById(`like-count-${postId}`);

  try {
    const res = await api.post(`/posts/${postId}/like`);
    const { isLiked, likesCount } = res.data;

    btn.classList.toggle('liked', isLiked);
    btn.querySelector('span').textContent = isLiked ? '❤️' : '🤍';
    countSpan.textContent = likesCount;
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;

  try {
    await api.delete(`/posts/${postId}`);
    const card = document.getElementById(`post-${postId}`);
    if (card) card.remove();
  } catch (err) {
    alert(err.message);
  }
}

// Post creation form
if (createPostForm) {
  createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!auth.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }

    const content = postContentInput.value.trim();
    const imageUrl = postImageInput.value.trim();

    if (!content) return;

    try {
      publishBtn.disabled = true;
      publishBtn.textContent = 'Posting...';

      await api.post('/posts', { content, imageUrl });

      postContentInput.value = '';
      postImageInput.value = '';
      publishBtn.disabled = false;
      publishBtn.textContent = 'Post';

      loadFeed();
    } catch (err) {
      alert(`Failed to create post: ${err.message}`);
      publishBtn.disabled = false;
      publishBtn.textContent = 'Post';
    }
  });
}

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuthUI();
  loadFeed();
});
