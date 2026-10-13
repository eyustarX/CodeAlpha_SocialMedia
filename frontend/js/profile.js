const profileContainer = document.getElementById('profile-container');
const userPostsStream = document.getElementById('user-posts-stream');

const urlParams = new URLSearchParams(window.location.search);
let targetUsername = urlParams.get('username');

if (!targetUsername) {
  const me = auth.getUser();
  if (me) {
    targetUsername = me.username;
  }
}

async function loadProfile() {
  if (!targetUsername) {
    profileContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: var(--danger);">No user specified.</p>
        <a href="index.html" class="btn" style="margin-top: 1rem;">Go to Feed</a>
      </div>
    `;
    return;
  }

  try {
    const res = await api.get(`/users/${targetUsername}`);
    const user = res.data;

    renderProfile(user);
    loadUserPosts();
  } catch (err) {
    profileContainer.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 2rem;">User not found: ${err.message}</p>`;
    userPostsStream.innerHTML = '';
  }
}

function renderProfile(user) {
  const currentUser = auth.getUser();
  const isMe = currentUser && currentUser.id === user.id;

  let actionButtonHtml = '';
  if (isMe) {
    actionButtonHtml = `<span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; padding: 0.4rem 0.8rem; background: #e2e8f0; border-radius: 999px;">This is you</span>`;
  } else {
    actionButtonHtml = `
      <button 
        id="follow-btn" 
        class="btn ${user.isFollowedByMe ? 'btn-following' : ''}" 
        onclick="handleFollowToggle('${user.id}')"
      >
        ${user.isFollowedByMe ? 'Following' : '+ Follow'}
      </button>
    `;
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  profileContainer.innerHTML = `
    <div class="profile-header-card">
      <div class="profile-top">
        <img 
          src="${user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}" 
          class="profile-avatar-lg" 
          alt="${user.name}"
        />
        <div class="profile-meta" style="flex: 1;">
          <h1>${escapeHTML(user.name)}</h1>
          <div class="profile-username">@${user.username}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">Joined ${joinDate}</div>
        </div>
        <div>
          ${actionButtonHtml}
        </div>
      </div>

      <p class="profile-bio">${user.bio ? escapeHTML(user.bio) : '<span style="color: var(--text-muted); font-style: italic;">No bio yet.</span>'}</p>

      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-num">${user.postsCount}</span>
          <span class="stat-label">Posts</span>
        </div>
        <div class="stat-item">
          <span class="stat-num" id="followers-count">${user.followersCount}</span>
          <span class="stat-label">Followers</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">${user.followingCount}</span>
          <span class="stat-label">Following</span>
        </div>
      </div>
    </div>
  `;
}

async function handleFollowToggle(targetUserId) {
  if (!auth.isAuthenticated()) {
    alert('Please log in to follow creators.');
    window.location.href = 'login.html';
    return;
  }

  const btn = document.getElementById('follow-btn');
  const countSpan = document.getElementById('followers-count');

  try {
    btn.disabled = true;
    const res = await api.post(`/users/${targetUserId}/follow`);
    const { isFollowing, followersCount } = res.data;

    btn.textContent = isFollowing ? 'Following' : '+ Follow';
    btn.className = `btn ${isFollowing ? 'btn-following' : ''}`;
    countSpan.textContent = followersCount;
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
}

async function loadUserPosts() {
  userPostsStream.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Loading posts...</p>';

  try {
    const res = await api.get(`/users/${targetUsername}/posts`);
    const posts = res.data;

    renderPosts(posts);
  } catch (err) {
    userPostsStream.innerHTML = `<p style="color: var(--danger); text-align: center;">Failed to load posts: ${err.message}</p>`;
  }
}

function renderPosts(posts) {
  if (!posts || posts.length === 0) {
    userPostsStream.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No posts published by this user yet.</p>';
    return;
  }

  const currentUser = auth.getUser();

  userPostsStream.innerHTML = posts.map((post) => {
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
            <span class="post-author-name">${escapeHTML(post.author.name)}</span>
            <div class="post-author-username">@${post.author.username}</div>
          </div>
          <span class="post-time">${timeFormatted}</span>
        </div>

        <div class="post-content">${escapeHTML(post.content)}</div>

        ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image-attachment" alt="Post attachment">` : ''}

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

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

document.addEventListener('DOMContentLoaded', loadProfile);
